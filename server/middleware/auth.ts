
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

export interface AuthRequest extends Request {
  user?: any;
  authUser?: any;
}

// Create a request-scoped Supabase client using the user's access token.
const createAuthenticatedClient = (token: string) => {
  const supabaseUrl = process.env.SUPABASE_URL;

  // Use the publishable key (or legacy anon key), NOT the service-role key.
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or publishable key is missing');
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'Authentication required',
      },
    });
  }

  try {
    const supabase = createAuthenticatedClient(token);

    // Verify the token with Supabase Auth.
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired access token',
        },
      });
    }

    // Fetch the user's permanent profile.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('[Profile Lookup Error]:', profileError.message);

      return res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_LOOKUP_FAILED',
          message: 'Unable to load user profile',
        },
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'User profile not found',
        },
      });
    }

    if (profile.is_active === false) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been deactivated',
        },
      });
    }

    req.authUser = authUser;
    req.user = {
      ...profile,
      id: authUser.id,
      email: authUser.email,
    };

    return next();
  } catch (error: any) {
    console.error('[Authentication Error]:', error.message);

    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_CONFIGURATION_ERROR',
        message: 'Authentication service is unavailable',
      },
    });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not allowed',
        },
      });
    }

    return next();
  };
};
