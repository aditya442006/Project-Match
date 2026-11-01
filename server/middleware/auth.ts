import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'projectmatch-dev-access-jwt-secret';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'projectmatch-dev-refresh-jwt-secret';

export interface AuthRequest extends Request {
  user?: any;
}

export const signAccessToken = (user: any) => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

export const signRefreshToken = (user: any) => {
  return jwt.sign(
    { sub: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Authentication required' },
    });
  }

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as { sub: string };
    const user = db.users.find((u) => u.id === payload.sub);

    if (!user || user.is_active === false) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'User not found or deactivated' },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
    });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not allowed' },
      });
    }
    next();
  };
};
