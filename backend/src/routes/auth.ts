import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { validate, authSchemas } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

router.post('/login', validate(authSchemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // In production, use proper password hashing
    // For now, using a simple check
    const isValid = await bcrypt.compare(password, user.password_hash || '');
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login_at = now() WHERE id = $1',
      [user.id]
    );

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        must_change_password: user.must_change_password || false,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user exists
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users (email, name, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, name, role || 'growth', passwordHash]
    );

    const user = result.rows[0];
    logger.info(`User registered: ${email}`);

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

// Sign up endpoint for new users (public registration)
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }

    // Check if user exists
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with 'growth' role by default
    const result = await query(
      'INSERT INTO users (email, name, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email.toLowerCase(), name.trim(), 'growth', passwordHash]
    );

    const user = result.rows[0];
    logger.info(`New user signed up: ${email} (${name})`);

    res.status(201).json({ 
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
