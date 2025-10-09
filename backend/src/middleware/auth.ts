import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { User, UserRole } from '../types';

export interface AuthRequest extends Request {
  user?: User;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  file?: Express.Multer.File;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    const result = await query(
      'SELECT id, email, name, role, created_at, updated_at, last_login_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

export const requireGrowth = requireRole('growth', 'admin');
export const requireOps = requireRole('ops', 'admin');
export const requireAdmin = requireRole('admin');
