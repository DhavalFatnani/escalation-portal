import { Router } from 'express';
import bcrypt from 'bcrypt';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get current user
router.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      'SELECT id, email, name, role, created_at, last_login_at, must_change_password FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get all users (admin only)
router.get('/', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      'SELECT id, email, name, role, created_at, last_login_at FROM users ORDER BY created_at DESC'
    );

    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
});

// Create user (admin only)
router.post('/', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    if (!['growth', 'ops', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate random password (12 characters)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    const temporaryPassword = Array.from({ length: 12 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');

    // Hash password
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Create user
    const result = await query(
      `INSERT INTO users (email, name, role, password_hash, must_change_password) 
       VALUES ($1, $2, $3, $4, true) 
       RETURNING id, email, name, role`,
      [email.toLowerCase(), name.trim(), role, passwordHash]
    );

    const user = result.rows[0];
    logger.info(`User created by admin ${req.user!.email}: ${email} (${role})`);

    res.status(201).json({ 
      user,
      temporaryPassword
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:userId', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting self
    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING email',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User deleted by admin ${req.user!.email}: ${result.rows[0].email}`);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    // Password validation
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }

    // Get user
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear must_change_password flag
    await query(
      'UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2',
      [newPasswordHash, req.user!.id]
    );

    logger.info(`Password changed for user: ${req.user!.email}`);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;