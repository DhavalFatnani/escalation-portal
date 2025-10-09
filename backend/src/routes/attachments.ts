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
      const { upload_context } = req.body; // Get upload context from request
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      // Validate upload_context if provided
      const validContexts = ['initial', 'resolution', 'reopen', 'additional'];
      const contextToUse = upload_context && validContexts.includes(upload_context) 
        ? upload_context 
        : 'additional';

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

          // Save attachment metadata to database with upload_context
          const result = await client.query(
            `INSERT INTO attachments (ticket_id, filename, url, file_size, mime_type, uploaded_by, upload_context)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
              ticket.id,
              file.originalname,
              fileUrl,
              file.size,
              file.mimetype,
              req.user!.id,
              contextToUse,
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
              `Uploaded file: ${file.originalname} (${contextToUse})`,
              JSON.stringify({ filename: file.originalname, size: file.size, context: contextToUse }),
            ]
          );
        }

        await client.query('COMMIT');

        logger.info(
          `Uploaded ${files.length} file(s) to ticket ${ticket_number} with context '${contextToUse}' by user ${req.user!.id}`
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

// Request deletion of attachment (creates approval request)
router.post('/attachments/:id/request-deletion', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Deletion reason is required' });
    }

    // Get attachment and ticket details
    const attachmentResult = await query(
      `SELECT a.*, t.ticket_number, t.created_by as ticket_creator, t.id as ticket_id
       FROM attachments a
       JOIN tickets t ON a.ticket_id = t.id
       WHERE a.id = $1`,
      [id]
    );

    if (attachmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const attachment = attachmentResult.rows[0];

    // Check permissions: Only uploader, ticket creator, or admin can request deletion
    if (
      attachment.uploaded_by !== req.user!.id &&
      attachment.ticket_creator !== req.user!.id &&
      req.user!.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Determine approver role based on requester role
    const approverRoleResult = await query(
      'SELECT get_approver_role($1, $2) as approver_role',
      [req.user!.role, attachment.ticket_creator]
    );
    const approverRole = approverRoleResult.rows[0].approver_role;

    // Create deletion request
    const result = await query(
      `INSERT INTO deletion_requests 
       (attachment_id, ticket_id, requester_id, requester_reason, requester_role, approver_role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, attachment.ticket_id, req.user!.id, reason.trim(), req.user!.role, approverRole]
    );

    logger.info(
      `Deletion request created for attachment ${id} by ${req.user!.email}, requires ${approverRole} approval`
    );

    res.status(201).json({
      message: `Deletion request submitted. Waiting for ${approverRole} team approval.`,
      request: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Get pending deletion requests for approval (role-based)
router.get('/deletion-requests/pending', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT 
        dr.*,
        a.filename,
        a.file_size,
        a.mime_type,
        t.ticket_number,
        t.brand_name,
        t.description as ticket_description,
        t.status as ticket_status,
        requester.name as requester_name,
        requester.email as requester_email
       FROM deletion_requests dr
       JOIN attachments a ON dr.attachment_id = a.id
       JOIN tickets t ON dr.ticket_id = t.id
       JOIN users requester ON dr.requester_id = requester.id
       WHERE dr.status = 'pending'
         AND dr.approver_role = $1
       ORDER BY dr.created_at DESC`,
      [req.user!.role]
    );

    res.json({ requests: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get user's own deletion requests
router.get('/deletion-requests/my-requests', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT 
        dr.*,
        a.filename,
        t.ticket_number,
        approver.name as approver_name,
        approver.email as approver_email
       FROM deletion_requests dr
       JOIN attachments a ON dr.attachment_id = a.id
       JOIN tickets t ON dr.ticket_id = t.id
       LEFT JOIN users approver ON dr.approved_by = approver.id
       WHERE dr.requester_id = $1
       ORDER BY dr.created_at DESC
       LIMIT 50`,
      [req.user!.id]
    );

    res.json({ requests: result.rows });
  } catch (error) {
    next(error);
  }
});

// Approve deletion request (generates OTP)
router.post('/deletion-requests/:request_id/approve', async (req: AuthRequest, res, next) => {
  try {
    const { request_id } = req.params;

    // Get request details
    const requestResult = await query(
      `SELECT dr.*, a.filename, t.ticket_number
       FROM deletion_requests dr
       JOIN attachments a ON dr.attachment_id = a.id
       JOIN tickets t ON dr.ticket_id = t.id
       WHERE dr.id = $1`,
      [request_id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deletion request not found' });
    }

    const request = requestResult.rows[0];

    // Check if user has permission to approve (must be from approver_role)
    if (request.approver_role !== req.user!.role) {
      return res.status(403).json({ error: 'You do not have permission to approve this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Request is already ${request.status}` });
    }

    // Generate OTP
    const otpResult = await query('SELECT generate_otp_code() as otp');
    const otpCode = otpResult.rows[0].otp;

    // Update request with approval and OTP
    const result = await query(
      `UPDATE deletion_requests 
       SET status = 'approved',
           approved_by = $1,
           approved_at = now(),
           otp_code = $2,
           otp_expires_at = now() + interval '10 minutes',
           updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [req.user!.id, otpCode, request_id]
    );

    logger.info(
      `Deletion request ${request_id} approved by ${req.user!.email}, OTP: ${otpCode}`
    );

    res.json({
      message: 'Deletion request approved. OTP generated.',
      request: result.rows[0],
      otp_code: otpCode,
      expires_in_minutes: 10,
    });
  } catch (error) {
    next(error);
  }
});

// Reject deletion request
router.post('/deletion-requests/:request_id/reject', async (req: AuthRequest, res, next) => {
  try {
    const { request_id } = req.params;
    const { reason } = req.body;

    // Get request details
    const requestResult = await query(
      'SELECT * FROM deletion_requests WHERE id = $1',
      [request_id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deletion request not found' });
    }

    const request = requestResult.rows[0];

    // Check if user has permission to reject
    if (request.approver_role !== req.user!.role) {
      return res.status(403).json({ error: 'You do not have permission to reject this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Request is already ${request.status}` });
    }

    // Update request with rejection
    await query(
      `UPDATE deletion_requests 
       SET status = 'rejected',
           approved_by = $1,
           approved_at = now(),
           rejection_reason = $2,
           updated_at = now()
       WHERE id = $3`,
      [req.user!.id, reason || 'No reason provided', request_id]
    );

    logger.info(
      `Deletion request ${request_id} rejected by ${req.user!.email}`
    );

    res.json({ message: 'Deletion request rejected' });
  } catch (error) {
    next(error);
  }
});

// Delete attachment (requires OTP from approved request)
router.delete('/attachments/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { otp_code } = req.body;

    // OTP is required for deletion
    if (!otp_code) {
      return res.status(400).json({ error: 'OTP code is required for file deletion' });
    }

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

    // Verify OTP from approved deletion request
    const requestResult = await query(
      `SELECT * FROM deletion_requests 
       WHERE otp_code = $1 
         AND attachment_id = $2
         AND status = 'approved'
         AND otp_expires_at > now()
         AND requester_id = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [otp_code, id, req.user!.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired OTP, or you are not the requester' });
    }

    const deletionRequest = requestResult.rows[0];

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Mark request as used
      await client.query(
        'UPDATE deletion_requests SET status = $1, used_at = now() WHERE id = $2',
        ['used', deletionRequest.id]
      );

      // Log activity BEFORE deleting
      await client.query(
        `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment)
         VALUES ($1, $2, 'attachment_deleted', $3)`,
        [attachment.ticket_id, req.user!.id, `Deleted file: ${attachment.filename} (approved by ${deletionRequest.approver_role} team)`]
      );

      // Delete from database
      await client.query('DELETE FROM attachments WHERE id = $1', [id]);

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
        `Deleted attachment ${id} from ticket ${attachment.ticket_number} by user ${req.user!.id} with peer approval`
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
