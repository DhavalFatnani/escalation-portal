import { Router } from 'express';
import { requireAuth, requireManager, AuthRequest } from '../middleware/auth';
import {
  getTeamMembers,
  getTeamMembersByRole,
  getTeamMetrics,
  toggleUserActive,
  getUnassignedTickets,
  getIncomingTickets,
  getOutgoingTickets,
  getTeamWorkloadSummary,
} from '../services/managerService';
import { query } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// All manager routes require authentication and manager role
router.use(requireAuth, requireManager);

/**
 * GET /api/managers/team
 * Get manager's team members
 */
router.get('/team', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const teamMembers = await getTeamMembersByRole(req.user.role);

    res.json({ team_members: teamMembers });
  } catch (error) {
    logger.error('Error fetching team members:', error);
    next(error);
  }
});

/**
 * GET /api/managers/tickets/pending
 * Get unassigned tickets needing manager review
 */
router.get('/tickets/pending', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const tickets = await getUnassignedTickets(req.user.role);

    res.json({ tickets });
  } catch (error) {
    logger.error('Error fetching pending tickets:', error);
    next(error);
  }
});

/**
 * GET /api/managers/metrics
 * Get team performance metrics
 */
router.get('/metrics', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const metrics = await getTeamMetrics(req.user.id, req.user.role);

    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching team metrics:', error);
    next(error);
  }
});

/**
 * PATCH /api/managers/users/:user_id/toggle-active
 * Toggle user active/inactive status
 */
router.patch('/users/:user_id/toggle-active', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { user_id } = req.params;

    const newStatus = await toggleUserActive(user_id, req.user.id);

    res.json({
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      is_active: newStatus,
    });
  } catch (error: any) {
    logger.error('Error toggling user status:', error);
    if (error.message.includes('Permission denied')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * PATCH /api/managers/auto-assign
 * Toggle auto-assign setting for manager
 */
router.patch('/auto-assign', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    await query(
      'UPDATE users SET auto_assign_enabled = $1, updated_at = now() WHERE id = $2',
      [enabled, req.user.id]
    );

    logger.info(`Manager ${req.user.id} set auto-assign to ${enabled}`);

    res.json({
      message: `Auto-assign ${enabled ? 'enabled' : 'disabled'} successfully`,
      auto_assign_enabled: enabled,
    });
  } catch (error) {
    logger.error('Error toggling auto-assign:', error);
    next(error);
  }
});

/**
 * GET /api/managers/incoming
 * Get incoming tickets (tickets needing assignment to team)
 */
router.get('/incoming', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const tickets = await getIncomingTickets(req.user.id, req.user.role);

    res.json({ tickets });
  } catch (error) {
    logger.error('Error fetching incoming tickets:', error);
    next(error);
  }
});

/**
 * GET /api/managers/outgoing
 * Get outgoing tickets (tickets created by team)
 */
router.get('/outgoing', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const tickets = await getOutgoingTickets(req.user.id, req.user.role);

    res.json({ tickets });
  } catch (error) {
    logger.error('Error fetching outgoing tickets:', error);
    next(error);
  }
});

/**
 * GET /api/managers/workload
 * Get team workload summary
 */
router.get('/workload', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const workload = await getTeamWorkloadSummary(req.user.id, req.user.role);

    res.json({ workload });
  } catch (error) {
    logger.error('Error fetching team workload:', error);
    next(error);
  }
});

export default router;

