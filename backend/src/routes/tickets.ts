import { Router } from 'express';
import { requireAuth, requireGrowth, requireOps, AuthRequest } from '../middleware/auth';
import { validate, ticketSchemas } from '../middleware/validation';
import { ticketService } from '../services/ticketService';

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

    // Check permissions: Growth can only see their own tickets
    if (req.user!.role === 'growth' && ticket.created_by !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ ticket });
  } catch (error) {
    next(error);
  }
});

// Update ticket
router.patch('/:ticket_number', validate(ticketSchemas.update), async (req: AuthRequest, res, next) => {
  try {
    const ticket = await ticketService.updateTicket(
      req.params.ticket_number,
      req.body,
      req.user!.id
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

export default router;
