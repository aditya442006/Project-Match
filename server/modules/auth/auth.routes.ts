
import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  requireAuth,
  AuthRequest,
} from '../../middleware/auth';

const router = Router();

// --------------------------------------------------
// SUPABASE CONFIGURATION
// --------------------------------------------------

const supabaseUrl = process.env.SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing SUPABASE_URL or Supabase publishable/anon key'
  );
}

// Create a Supabase client.
// Access token is optional and used for authenticated operations.
const createSupabaseClient = (accessToken?: string) => {
  return createClient(supabaseUrl!, supabaseKey!, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,

    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

// --------------------------------------------------
// COMMON HELPERS
// --------------------------------------------------

const sendError = (
  res: Response,
  status: number,
  code: string,
  message: string
) => {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};

// Fetch user profile from Supabase database.
const getProfile = async (
  accessToken: string,
  userId: string
) => {
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

// Check if the account is active.
const isAccountActive = (profile: any): boolean => {
  return profile && profile.is_active !== false;
};

// Get access token from Authorization header.
const getAccessToken = (req: Request): string | null => {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.substring(7).trim() || null;
};

// --------------------------------------------------
// 1. SIGNUP
// POST /api/v1/auth/signup
// --------------------------------------------------

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      name,
      college,
      branch,
      year,
    } = req.body || {};

    // Validate input.
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof name !== 'string' ||
      !email.trim() ||
      !password ||
      !name.trim()
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

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedYear = Number(year);

    const client = createSupabaseClient();

    const { data, error } = await client.auth.signUp({
      email: normalizedEmail,
      password,

      options: {
        data: {
          name: name.trim(),
          college:
            typeof college === 'string' && college.trim()
              ? college.trim()
              : 'College Student',

          branch:
            typeof branch === 'string' && branch.trim()
              ? branch.trim()
              : 'Engineering',

          year:
            Number.isInteger(normalizedYear) &&
            normalizedYear > 0
              ? normalizedYear
              : 1,
        },

        ...(process.env.CLIENT_URL
          ? {
              emailRedirectTo: process.env.CLIENT_URL,
            }
          : {}),
      },
    });

    if (error || !data.user) {
      console.error('[Signup Error]:', error?.message);

      return sendError(
        res,
        400,
        'SIGNUP_FAILED',
        error?.message || 'Unable to create account'
      );
    }

    let profile = null;

    // A session is returned only when Supabase permits immediate login.
    if (data.session) {
      profile = await getProfile(
        data.session.access_token,
        data.user.id
      );

      if (!profile) {
        return sendError(
          res,
          500,
          'PROFILE_CREATION_FAILED',
          'Account created but profile could not be loaded'
        );
      }
    }

    return res.status(201).json({
      success: true,

      data: {
        user: profile || {
          id: data.user.id,
          email: data.user.email,
          name: name.trim(),
          college: college || 'College Student',
          branch: branch || 'Engineering',
          year: normalizedYear || 1,
          role: 'student',
          is_verified: !!data.user.email_confirmed_at,
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

// --------------------------------------------------
// 2. LOGIN
// POST /api/v1/auth/login
// --------------------------------------------------

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return sendError(
        res,
        422,
        'VALIDATION_ERROR',
        'Email and password are required'
      );
    }

    const client = createSupabaseClient();

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
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

    if (!isAccountActive(profile)) {
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
        user: {
          ...profile,
          email: data.user.email || profile.email,
          is_verified: !!data.user.email_confirmed_at,
        },
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

// --------------------------------------------------
// 3. REFRESH SESSION
// POST /api/v1/auth/refresh
// --------------------------------------------------

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body?.refresh_token;

    if (
      typeof refreshToken !== 'string' ||
      !refreshToken.trim()
    ) {
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
        'Session expired. Please log in again.'
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

    if (!isAccountActive(profile)) {
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
        user: {
          ...profile,
          email: data.user.email || profile.email,
          is_verified: !!data.user.email_confirmed_at,
        },
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

// --------------------------------------------------
// 4. VERIFY EXISTING SESSION
// POST /api/v1/auth/session
// --------------------------------------------------

router.post('/session', async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body || {};

    if (
      typeof access_token !== 'string' ||
      !access_token.trim()
    ) {
      return sendError(
        res,
        401,
        'NO_TOKEN',
        'Access token is required'
      );
    }

    const client = createSupabaseClient();

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

    if (!isAccountActive(profile)) {
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
        user: {
          ...profile,
          email: user.email || profile.email,
          is_verified: !!user.email_confirmed_at,
        },
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

// --------------------------------------------------
// 5. LOGOUT
// POST /api/v1/auth/logout
// --------------------------------------------------

router.post('/logout', (_req: Request, res: Response) => {
  // The frontend calls supabase.auth.signOut().
  // This endpoint only confirms the API logout request.

  return res.json({
    success: true,

    data: {
      message: 'Logged out successfully',
    },
  });
});

// --------------------------------------------------
// 6. FORGOT PASSWORD
// POST /api/v1/auth/forgot-password
// --------------------------------------------------

router.post(
  '/forgot-password',
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body || {};

      if (
        typeof email !== 'string' ||
        !email.trim()
      ) {
        return sendError(
          res,
          422,
          'VALIDATION_ERROR',
          'Email is required'
        );
      }

      if (!process.env.CLIENT_URL) {
        return sendError(
          res,
          500,
          'CONFIGURATION_ERROR',
          'CLIENT_URL is not configured'
        );
      }

      const client = createSupabaseClient();

      const { error } = await client.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${process.env.CLIENT_URL}/reset-password`,
        }
      );

      if (error) {
        console.error('[Forgot Password Error]:', error.message);
      }

      // Avoid revealing whether an email is registered.
      return res.json({
        success: true,

        data: {
          message:
            'If that email is registered, password instructions have been sent.',
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
  }
);

// --------------------------------------------------
// 7. RESET PASSWORD
// POST /api/v1/auth/reset-password
// --------------------------------------------------

router.post(
  '/reset-password',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { password } = req.body || {};

      if (
        typeof password !== 'string' ||
        password.length < 8
      ) {
        return sendError(
          res,
          422,
          'WEAK_PASSWORD',
          'Password must contain at least 8 characters'
        );
      }

      const token = getAccessToken(req);

      if (!token) {
        return sendError(
          res,
          401,
          'NO_TOKEN',
          'Authentication required'
        );
      }

      const client = createSupabaseClient(token);

      const { error } = await client.auth.updateUser({
        password,
      });

      if (error) {
        console.error('[Reset Password Error]:', error.message);

        return sendError(
          res,
          400,
          'PASSWORD_UPDATE_FAILED',
          error.message
        );
      }

      return res.json({
        success: true,

        data: {
          message: 'Password reset successfully',
        },
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

// --------------------------------------------------
// 8. CHANGE PASSWORD
// POST /api/v1/auth/change-password
// --------------------------------------------------

router.post(
  '/change-password',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const { password } = req.body || {};

      if (
        typeof password !== 'string' ||
        password.length < 8
      ) {
        return sendError(
          res,
          422,
          'WEAK_PASSWORD',
          'Password must contain at least 8 characters'
        );
      }

      const token = getAccessToken(req);

      if (!token) {
        return sendError(
          res,
          401,
          'NO_TOKEN',
          'Authentication required'
        );
      }

      const client = createSupabaseClient(token);

      const { error } = await client.auth.updateUser({
        password,
      });

      if (error) {
        console.error('[Change Password Error]:', error.message);

        return sendError(
          res,
          400,
          'PASSWORD_UPDATE_FAILED',
          error.message
        );
      }

      return res.json({
        success: true,

        data: {
          message: 'Password changed successfully',
        },
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

// --------------------------------------------------
// 9. RESEND EMAIL VERIFICATION
// POST /api/v1/auth/resend-verification
// --------------------------------------------------

router.post(
  '/resend-verification',
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body || {};

      if (
        typeof email !== 'string' ||
        !email.trim()
      ) {
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
        email: email.trim().toLowerCase(),
        ...(process.env.CLIENT_URL
          ? {
              options: {
                emailRedirectTo: process.env.CLIENT_URL,
              },
            }
          : {}),
      });

      if (error) {
        console.error(
          '[Resend Verification Error]:',
          error.message
        );

        return sendError(
          res,
          502,
          'VERIFICATION_SEND_FAILED',
          'Supabase could not send the verification email. Check the Supabase Auth email settings and try again later.'
        );
      }

      return res.json({
        success: true,

        data: {
          message:
            'If verification is available, an email will be sent.',
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

// --------------------------------------------------
// 10. CURRENT USER
// GET /api/v1/auth/me
// --------------------------------------------------

router.get(
  '/me',
  requireAuth,
  (req: AuthRequest, res: Response) => {
    return res.json({
      success: true,
      data: req.user,
    });
  }
);

// --------------------------------------------------
// EXPORT ROUTER
// --------------------------------------------------

export default router;
