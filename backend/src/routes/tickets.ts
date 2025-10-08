import { Router } from 'express';
import { requireAuth, requireGrowth, requireOps, AuthRequest } from '../middleware/auth';
import { validate, ticketSchemas } from '../middleware/validation';
import { ticketService } from '../services/ticketService';
import { query } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Create ticket (Growth only)
router.post('/', requireGrowth, validate(ticketSchemas.create), async (req: AuthRequest, res, next) => {
  try {
    const ticket = await ticketService.createTicket(req.user!.id, req.body);
    res.status(201).json({ ticket });
  } catch (error) {
    next(error);
  }
});

// List tickets with filters
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const filters = {
      status: req.query.status ? (req.query.status as string).split(',') as any : undefined,
      priority: req.query.priority ? (req.query.priority as string).split(',') as any : undefined,
      brand_name: req.query.brand_name as string,
      created_by: req.query.created_by as string,
      current_assignee: req.query.current_assignee as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await ticketService.getTickets(filters, req.user!.id, req.user!.role);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get ticket by number
router.get('/:ticket_number', async (req: AuthRequest, res, next) => {
  try {
    const ticket = await ticketService.getTicketByNumber(req.params.ticket_number);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permissions: Growth users can see tickets from ANY growth team member
    if (req.user!.role === 'growth') {
      // Check if ticket was created by a growth team member
      const creatorResult = await query(
        'SELECT role FROM users WHERE id = $1',
        [ticket.created_by]
      );
      
      if (creatorResult.rows.length === 0 || creatorResult.rows[0].role !== 'growth') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ ticket });
  } catch (error) {
    next(error);
  }
});

// Update ticket (Admin can update any field, others limited)
router.patch('/:ticket_number', async (req: AuthRequest, res, next) => {
  try {
    const ticket = await ticketService.updateTicket(
      req.params.ticket_number,
      req.body,
      req.user!.id,
      req.user!.role
    );
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
});

// Resolve ticket (Ops only)
router.post('/:ticket_number/resolve', requireOps, validate(ticketSchemas.resolve), async (req: AuthRequest, res, next) => {
  try {
    const ticket = await ticketService.resolveTicket(
      req.params.ticket_number,
      req.body,
      req.user!.id
    );
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
});

// Reopen ticket (Growth only)
router.post('/:ticket_number/reopen', requireGrowth, validate(ticketSchemas.reopen), async (req: AuthRequest, res, next) => {
  try {
    const ticket = await ticketService.reopenTicket(
      req.params.ticket_number,
      req.body,
      req.user!.id
    );
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
});

// Close ticket (mark as resolved)
router.post('/:ticket_number/close', requireGrowth, async (req: AuthRequest, res, next) => {
  try {
    const ticket = await ticketService.closeTicket(
      req.params.ticket_number,
      req.user!.id
    );
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
});

// Get ticket activities
router.get('/:ticket_number/activities', async (req: AuthRequest, res, next) => {
  try {
    const activities = await ticketService.getTicketActivities(req.params.ticket_number);
    res.json({ activities });
  } catch (error) {
    next(error);
  }
});

// Delete ticket (Admin only)
router.delete('/:ticket_number', async (req: AuthRequest, res, next) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete tickets' });
    }

    const ticket = await ticketService.getTicketByNumber(req.params.ticket_number);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await query('DELETE FROM tickets WHERE ticket_number = $1', [req.params.ticket_number]);
    
    logger.info(`Ticket deleted: ${req.params.ticket_number} by admin ${req.user!.email}`);
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Force status change (Admin only)
router.post('/:ticket_number/force-status', async (req: AuthRequest, res, next) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can force status changes' });
    }

    const { status, reason } = req.body;
    
    if (!status || !['open', 'processed', 'resolved', 're-opened', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ticket = await ticketService.getTicketByNumber(req.params.ticket_number);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await query(
      `UPDATE tickets SET status = $1, updated_at = now(), last_status_change_at = now() 
       WHERE ticket_number = $2`,
      [status, req.params.ticket_number]
    );

    // Log activity
    await query(
      `INSERT INTO ticket_activities (ticket_id, actor_id, action, comment, created_at)
       VALUES ($1, $2, 'status_forced', $3, now())`,
      [ticket.id, req.user!.id, reason || `Admin forced status change to: ${status}`]
    );

    logger.info(`Ticket status forced: ${req.params.ticket_number} → ${status} by admin ${req.user!.email}`);
    
    const updatedTicket = await ticketService.getTicketByNumber(req.params.ticket_number);
    res.json({ ticket: updatedTicket });
  } catch (error) {
    next(error);
  }
});

export default router;
