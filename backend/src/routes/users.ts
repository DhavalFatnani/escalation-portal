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
      'SELECT id, email, name, role, created_at, last_login_at, must_change_password, profile_picture FROM users WHERE id = $1',
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
      'SELECT id, email, name, role, is_manager, is_active, created_at, last_login_at FROM users ORDER BY created_at DESC'
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

    // Check if user exists
    const userCheck = await query(
      'SELECT email, name FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userEmail = userCheck.rows[0].email;

    // Check for dependencies
    const ticketsCreated = await query(
      'SELECT COUNT(*) as count FROM tickets WHERE created_by = $1',
      [userId]
    );

    const ticketsAssigned = await query(
      'SELECT COUNT(*) as count FROM tickets WHERE current_assignee = $1',
      [userId]
    );

    const attachmentsUploaded = await query(
      'SELECT COUNT(*) as count FROM attachments WHERE uploaded_by = $1',
      [userId]
    );

    const hasTickets = parseInt(ticketsCreated.rows[0].count) > 0;
    const hasAssignments = parseInt(ticketsAssigned.rows[0].count) > 0;
    const hasAttachments = parseInt(attachmentsUploaded.rows[0].count) > 0;

    if (hasTickets || hasAssignments || hasAttachments) {
      const dependencies = [];
      if (hasTickets) dependencies.push(`${ticketsCreated.rows[0].count} ticket(s) created`);
      if (hasAssignments) dependencies.push(`${ticketsAssigned.rows[0].count} ticket(s) assigned`);
      if (hasAttachments) dependencies.push(`${attachmentsUploaded.rows[0].count} attachment(s)`);

      return res.status(400).json({ 
        error: 'Cannot delete user with existing data',
        details: `User has: ${dependencies.join(', ')}. Please reassign or remove these items first.`
      });
    }

    // Safe to delete - user has no dependencies
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING email',
      [userId]
    );

    logger.info(`User deleted by admin ${req.user!.email}: ${userEmail}`);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
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

// Update profile picture
router.patch('/profile/picture', async (req: AuthRequest, res, next) => {
  try {
    const { profile_picture } = req.body;

    if (!profile_picture) {
      return res.status(400).json({ error: 'Profile picture data is required' });
    }

    // Validate base64 image format
    if (!profile_picture.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format. Must be a base64 encoded image.' });
    }

    // Limit size to 2MB (base64 encoded)
    if (profile_picture.length > 2 * 1024 * 1024 * 1.37) { // 1.37 is base64 overhead
      return res.status(400).json({ error: 'Image too large. Maximum size is 2MB.' });
    }

    const result = await query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING id, email, name, role, profile_picture',
      [profile_picture, req.user!.id]
    );

    logger.info(`Profile picture updated for user: ${req.user!.email}`);
    res.json({ user: result.rows[0], message: 'Profile picture updated successfully' });
  } catch (error) {
    logger.error('Error updating profile picture:', error);
    next(error);
  }
});

// Update user name
router.patch('/profile/name', async (req: AuthRequest, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Name must be less than 100 characters' });
    }

    const result = await query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name, role, profile_picture',
      [name.trim(), req.user!.id]
    );

    logger.info(`Name updated for user: ${req.user!.email} to ${name.trim()}`);
    res.json({ user: result.rows[0], message: 'Name updated successfully' });
  } catch (error) {
    logger.error('Error updating name:', error);
    next(error);
  }
});

export default router;