import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { query, getClient } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Require admin role for all admin routes
router.use((req: AuthRequest, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

// Toggle user manager status
router.patch('/users/:user_id/toggle-manager', async (req: AuthRequest, res, next) => {
  try {
    const { user_id } = req.params;
    const { is_manager } = req.body;

    // Cannot change admin's manager status
    const userCheck = await query('SELECT role FROM users WHERE id = $1', [user_id]);
    if (!userCheck.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (userCheck.rows[0].role === 'admin') {
      return res.status(400).json({ error: 'Cannot change manager status of admin users' });
    }

    // Update is_manager flag
    const result = await query(
      `UPDATE users 
       SET is_manager = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, name, email, role, is_manager, is_active`,
      [is_manager, user_id]
    );

    logger.info(`Admin ${req.user!.email} toggled manager status for user ${user_id} to ${is_manager}`);
    
    res.json({ 
      user: result.rows[0],
      message: is_manager ? 'User promoted to manager' : 'User demoted from manager'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

