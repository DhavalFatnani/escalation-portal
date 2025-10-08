import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { upload, uploadFileToStorage, supabase } from '../config/storage';
import { query, getClient } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Upload attachment for a ticket
router.post(
  '/tickets/:ticket_number/attachments',
  upload.array('files', 5),
  async (req: AuthRequest, res, next) => {
    try {
      const { ticket_number } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      // Check if ticket exists and user has access
      const ticketResult = await query(
        'SELECT * FROM tickets WHERE ticket_number = $1',
        [ticket_number]
      );

      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const ticket = ticketResult.rows[0];

      // Check permissions: Creator or Ops/Admin can upload
      if (
        req.user!.role !== 'ops' &&
        req.user!.role !== 'admin' &&
        ticket.created_by !== req.user!.id
      ) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const client = await getClient();

      try {
        await client.query('BEGIN');

        const uploadedAttachments = [];

        for (const file of files) {
          // Upload to Supabase Storage (or fallback to local if not configured)
          let fileUrl: string;
          let storagePath: string | null = null;

          if (supabase) {
            const { url, path } = await uploadFileToStorage(file);
            fileUrl = url;
            storagePath = path;
          } else {
            // Fallback: store as base64 data URL (not recommended for production)
            fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          }

          // Save attachment metadata to database
          const result = await client.query(
            `INSERT INTO attachments (ticket_id, filename, url, file_size, mime_type, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
              ticket.id,
              file.originalname,
              fileUrl,
              file.size,
              file.mimetype,
              req.user!.id,
            ]
          );

          uploadedAttachments.push(result.rows[0]);

          // Log activity
          await client.query(
            `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, payload)
             VALUES ($1, $2, 'attachment_added', $3, $4)`,
            [
              ticket.id,
              req.user!.id,
              `Uploaded file: ${file.originalname}`,
              JSON.stringify({ filename: file.originalname, size: file.size }),
            ]
          );
        }

        await client.query('COMMIT');

        logger.info(
          `Uploaded ${files.length} file(s) to ticket ${ticket_number} by user ${req.user!.id}`
        );

        res.status(201).json({
          message: `${files.length} file(s) uploaded successfully`,
          attachments: uploadedAttachments,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }
);

// Get attachments for a ticket
router.get('/tickets/:ticket_number/attachments', async (req: AuthRequest, res, next) => {
  try {
    const { ticket_number } = req.params;

    // Get ticket
    const ticketResult = await query(
      'SELECT * FROM tickets WHERE ticket_number = $1',
      [ticket_number]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    // Check permissions
    if (
      req.user!.role === 'growth' &&
      ticket.created_by !== req.user!.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get attachments
    const attachmentsResult = await query(
      `SELECT a.*, u.name as uploader_name, u.email as uploader_email
       FROM attachments a
       LEFT JOIN users u ON a.uploaded_by = u.id
       WHERE a.ticket_id = $1
       ORDER BY a.created_at ASC`,
      [ticket.id]
    );

    res.json({ attachments: attachmentsResult.rows });
  } catch (error) {
    next(error);
  }
});

// Delete attachment
router.delete('/attachments/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Get attachment
    const attachmentResult = await query(
      `SELECT a.*, t.ticket_number, t.created_by as ticket_creator
       FROM attachments a
       JOIN tickets t ON a.ticket_id = t.id
       WHERE a.id = $1`,
      [id]
    );

    if (attachmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const attachment = attachmentResult.rows[0];

    // Check permissions: Only uploader, ticket creator, or admin can delete
    if (
      attachment.uploaded_by !== req.user!.id &&
      attachment.ticket_creator !== req.user!.id &&
      req.user!.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Delete from database
      await client.query('DELETE FROM attachments WHERE id = $1', [id]);

      // Log activity
      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment)
         VALUES ((SELECT ticket_id FROM attachments WHERE id = $1), $2, 'attachment_deleted', $3)`,
        [id, req.user!.id, `Deleted file: ${attachment.filename}`]
      );

      await client.query('COMMIT');

      // Delete from storage (optional, happens after transaction)
      if (supabase && attachment.url.includes('supabase')) {
        try {
          const pathMatch = attachment.url.match(/uploads\/[^?]+/);
          if (pathMatch) {
            await supabase.storage.from('attachments').remove([pathMatch[0]]);
          }
        } catch (storageError) {
          logger.warn('Failed to delete file from storage:', storageError);
        }
      }

      logger.info(
        `Deleted attachment ${id} from ticket ${attachment.ticket_number} by user ${req.user!.id}`
      );

      res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

export default router;
