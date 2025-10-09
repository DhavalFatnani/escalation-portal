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

export default router;

