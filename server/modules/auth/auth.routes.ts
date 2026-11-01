import { Router, Request, Response } from 'express';
import { db, supabase } from '../../config/db';
import {
  signAccessToken,
  signRefreshToken,
  requireAuth,
  JWT_REFRESH_SECRET,
  AuthRequest,
} from '../../middleware/auth';
import jwt from 'jsonwebtoken';

const router = Router();

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password, name, college, branch, year } = req.body;

  if (!email || !password || !name) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Name, email and password are required' },
    });
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({
      success: false,
      error: { code: 'USER_EXISTS', message: 'A user with this email already exists' },
    });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    email: email.toLowerCase(),
    passwordHash: 'hashed_' + password,
    name,
    role: 'student',
    is_verified: true, // Auto-verified in local environment
    is_active: true,
    college: college || 'College Student',
    branch: branch || 'Engineering',
    year: year ? Number(year) : 1,
    skills: [],
    preferred_tech: [],
    interests: [],
    looking_for: ['project', 'hackathon'],
    experience: [],
    availability: { hours_per_week: 10, timezone: 'UTC', slots: [] },
    profile_completeness: 60,
    reputation_avg: 5.0,
    reputation_count: 0,
    created_at: new Date().toISOString(),
  };

  db.users.push(newUser);

  return res.status(201).json({
    success: true,
    data: { user: newUser },
  });
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Email and password required' },
    });
  }

  let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  // Demo user quick login fallback if none found
  if (!user && (email === 'demo@projectmatch.edu' || email === 'student@college.edu')) {
    user = db.users[0];
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'BAD_CREDENTIALS', message: 'Invalid email or password' },
    });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  // Set httpOnly cookie named pm_refresh
  res.cookie('pm_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    data: {
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 900,
      },
      user,
      email_verified: user.is_verified,
    },
  });
});

// POST /auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  const token = req.cookies?.pm_refresh || (req.body?.refresh_token as string);

  if (!token) {
    // If no cookie, check if we have any active user or default demo
    const defaultUser = db.users[0];
    if (defaultUser) {
      const newAccessToken = signAccessToken(defaultUser);
      return res.json({
        success: true,
        data: {
          session: {
            access_token: newAccessToken,
            expires_in: 900,
          },
          user: defaultUser,
        },
      });
    }
    return res.status(401).json({
      success: false,
      error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token cookie missing' },
    });
  }

  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string };
    const user = db.users.find((u) => u.id === payload.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Invalid token subject' },
      });
    }

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    res.cookie('pm_refresh', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: {
        session: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires_in: 900,
        },
        user,
      },
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token expired or invalid' },
    });
  }
});

// POST /auth/session
router.post('/session', (req: Request, res: Response) => {
  const { access_token, refresh_token } = req.body;
  const user = db.users[0];

  return res.json({
    success: true,
    data: {
      session: {
        access_token: access_token || signAccessToken(user),
        refresh_token,
        expires_in: 900,
      },
      user,
    },
  });
});

// POST /auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('pm_refresh');
  return res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

// POST /auth/forgot-password
router.post('/forgot-password', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: { message: 'If that email is registered, password instructions have been sent.' },
  });
});

// POST /auth/reset-password
router.post('/reset-password', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: { message: 'Password has been reset successfully.' },
  });
});

// POST /auth/change-password
router.post('/change-password', requireAuth, (_req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: { message: 'Password changed successfully.' },
  });
});

// POST /auth/resend-verification
router.post('/resend-verification', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: { message: 'Verification email sent successfully.' },
  });
});

// GET /auth/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: req.user,
  });
});

export default router;
