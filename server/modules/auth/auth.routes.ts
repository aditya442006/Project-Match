
import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const createSupabaseClient = (accessToken?: string) => {
  return createClient(supabaseUrl!, supabaseKey!, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

const getProfile = async (accessToken: string, userId: string) => {
  const client = createSupabaseClient(accessToken);

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Profile Error]:', error.message);
    throw new Error('Unable to load user profile');
  }

  return data;
};

const sendError = (
  res: Response,
  status: number,
  code: string,
  message: string
) => {
  return res.status(status).json({
    success: false,
    error: { code, message },
  });
};

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, college, branch, year } = req.body;

    if (
      !email ||
      !password ||
      !name ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof name !== 'string'
    ) {
      return sendError(
        res,
        422,
        'VALIDATION_ERROR',
        'Name, email and password are required'
      );
    }

    if (password.length < 8) {
      return sendError(
        res,
        422,
        'WEAK_PASSWORD',
        'Password must contain at least 8 characters'
      );
    }

    const client = createSupabaseClient();

    const { data, error } = await client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
          college: college || 'College Student',
          branch: branch || 'Engineering',
          year: year ? Number(year) : 1,
        },
        ...(process.env.CLIENT_URL
          ? { emailRedirectTo: process.env.CLIENT_URL }
          : {}),
      },
    });

    if (error) {
      return sendError(res, 400, 'SIGNUP_FAILED', error.message);
    }

    if (!data.user) {
      return sendError(
        res,
        400,
        'SIGNUP_FAILED',
        'Unable to create account'
      );
    }

    // The database trigger creates the profile.
    let profile = null;

    if (data.session) {
      profile = await getProfile(
        data.session.access_token,
        data.user.id
      );
    }

    return res.status(201).json({
      success: true,
      data: {
        user: profile || {
          id: data.user.id,
          email: data.user.email,
          name: name.trim(),
        },
        session: data.session,
        email_verified: !!data.user.email_confirmed_at,
        message: data.session
          ? 'Account created successfully'
          : 'Account created. Please verify your email before logging in.',
      },
    });
  } catch (error: any) {
    console.error('[Signup Error]:', error.message);
    return sendError(
      res,
      500,
      'SIGNUP_ERROR',
      'Unable to complete signup'
    );
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(
        res,
        422,
        'VALIDATION_ERROR',
        'Email and password are required'
      );
    }

    const client = createSupabaseClient();

    const { data, error } = await client.auth.signInWithPassword({
      email: String(email).trim().toLowerCase(),
      password,
    });

    if (error || !data.session || !data.user) {
      return sendError(
        res,
        401,
        'BAD_CREDENTIALS',
        'Invalid email or password, or email verification is required'
      );
    }

    const profile = await getProfile(
      data.session.access_token,
      data.user.id
    );

    if (!profile) {
      return sendError(
        res,
        404,
        'PROFILE_NOT_FOUND',
        'Your account exists but its profile could not be found'
      );
    }

    if (profile.is_active === false) {
      return sendError(
        res,
        403,
        'ACCOUNT_DISABLED',
        'Your account has been deactivated'
      );
    }

    return res.json({
      success: true,
      data: {
        session: data.session,
        user: profile,
        email_verified: !!data.user.email_confirmed_at,
      },
    });
  } catch (error: any) {
    console.error('[Login Error]:', error.message);
    return sendError(
      res,
      500,
      'LOGIN_ERROR',
      'Unable to complete login'
    );
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken =
      req.body?.refresh_token || req.cookies?.pm_refresh;

    if (!refreshToken) {
      return sendError(
        res,
        401,
        'NO_REFRESH_TOKEN',
        'Refresh token is required'
      );
    }

    const client = createSupabaseClient();

    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      return sendError(
        res,
        401,
        'INVALID_REFRESH_TOKEN',
        'Refresh token is invalid or expired. Please log in again.'
      );
    }

    const profile = await getProfile(
      data.session.access_token,
      data.user.id
    );

    if (!profile) {
      return sendError(
        res,
        404,
        'PROFILE_NOT_FOUND',
        'User profile not found'
      );
    }

    return res.json({
      success: true,
      data: {
        session: data.session,
        user: profile,
      },
    });
  } catch (error: any) {
    console.error('[Refresh Error]:', error.message);
    return sendError(
      res,
      500,
      'REFRESH_ERROR',
      'Unable to refresh session'
    );
  }
});

// POST /auth/session
router.post('/session', async (req: Request, res: Response) => {
  try {
    const { access_token, refresh_token } = req.body || {};

    if (!access_token) {
      return sendError(
        res,
        401,
        'NO_TOKEN',
        'Access token is required'
      );
    }

    const client = createSupabaseClient(access_token);

    const {
      data: { user },
      error,
    } = await client.auth.getUser(access_token);

    if (error || !user) {
      return sendError(
        res,
        401,
        'INVALID_TOKEN',
        'Invalid access token'
      );
    }

    const profile = await getProfile(access_token, user.id);

    if (!profile) {
      return sendError(
        res,
        404,
        'PROFILE_NOT_FOUND',
        'User profile not found'
      );
    }

    return res.json({
      success: true,
      data: {
        session: {
          access_token,
          refresh_token: refresh_token || null,
        },
        user: profile,
      },
    });
  } catch (error: any) {
    console.error('[Session Error]:', error.message);
    return sendError(
      res,
      500,
      'SESSION_ERROR',
      'Unable to verify session'
    );
  }
});

// POST /auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { access_token, refresh_token } = req.body || {};

    if (access_token && refresh_token) {
      const client = createSupabaseClient();

      await client.auth.setSession({
        access_token,
        refresh_token,
      });

      await client.auth.signOut({ scope: 'local' });
    }

    res.clearCookie('pm_refresh');

    return res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error: any) {
    console.error('[Logout Error]:', error.message);
    return sendError(
      res,
      400,
      'LOGOUT_ERROR',
      'Unable to complete logout'
    );
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(
        res,
        422,
        'VALIDATION_ERROR',
        'Email is required'
      );
    }

    const client = createSupabaseClient();

    const { error } = await client.auth.resetPasswordForEmail(
      String(email).trim().toLowerCase(),
      {
        redirectTo: process.env.CLIENT_URL,
      }
    );

    if (error) {
      console.error('[Password Reset Request]:', error.message);
    }

    // Avoid revealing whether an account exists.
    return res.json({
      success: true,
      data: {
        message: 'If that email is registered, password instructions have been sent.',
      },
    });
  } catch (error: any) {
    console.error('[Forgot Password Error]:', error.message);
    return sendError(
      res,
      500,
      'PASSWORD_RESET_ERROR',
      'Unable to process password reset request'
    );
  }
});

// POST /auth/reset-password
router.post(
  '/reset-password',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { password } = req.body;

      if (typeof password !== 'string' || password.length < 8) {
        return sendError(
          res,
          422,
          'WEAK_PASSWORD',
          'Password must contain at least 8 characters'
        );
      }

      const token = req.headers.authorization!.slice(7);
      const client = createSupabaseClient(token);

      const { error } = await client.auth.updateUser({ password });

      if (error) {
        return sendError(
          res,
          400,
          'PASSWORD_UPDATE_FAILED',
          error.message
        );
      }

      return res.json({
        success: true,
        data: { message: 'Password reset successfully' },
      });
    } catch (error: any) {
      console.error('[Reset Password Error]:', error.message);
      return sendError(
        res,
        500,
        'PASSWORD_RESET_ERROR',
        'Unable to reset password'
      );
    }
  }
);

// POST /auth/change-password
router.post(
  '/change-password',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { password } = req.body;

      if (typeof password !== 'string' || password.length < 8) {
        return sendError(
          res,
          422,
          'WEAK_PASSWORD',
          'Password must contain at least 8 characters'
        );
      }

      const token = req.headers.authorization!.slice(7);
      const client = createSupabaseClient(token);

      const { error } = await client.auth.updateUser({ password });

      if (error) {
        return sendError(
          res,
          400,
          'PASSWORD_UPDATE_FAILED',
          error.message
        );
      }

      return res.json({
        success: true,
        data: { message: 'Password changed successfully' },
      });
    } catch (error: any) {
      console.error('[Change Password Error]:', error.message);
      return sendError(
        res,
        500,
        'PASSWORD_CHANGE_ERROR',
        'Unable to change password'
      );
    }
  }
);

// POST /auth/resend-verification
router.post(
  '/resend-verification',
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return sendError(
          res,
          422,
          'VALIDATION_ERROR',
          'Email is required'
        );
      }

      const client = createSupabaseClient();

      const { error } = await client.auth.resend({
        type: 'signup',
        email: String(email).trim().toLowerCase(),
      });

      if (error) {
        console.error('[Resend Verification]:', error.message);
      }

      return res.json({
        success: true,
        data: {
          message: 'If verification is available, an email will be sent.',
        },
      });
    } catch (error: any) {
      console.error('[Resend Verification Error]:', error.message);
      return sendError(
        res,
        500,
        'VERIFICATION_ERROR',
        'Unable to resend verification email'
      );
    }
  }
);

// GET /auth/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: req.user,
  });
});

export default router;
