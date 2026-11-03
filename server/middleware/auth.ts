
import {
  Request,
  Response,
  NextFunction,
} from 'express';

import {
  createClient,
  User,
} from '@supabase/supabase-js';
import { db } from '../config/db';

export interface AuthRequest extends Request {
  user?: any;
  authUser?: User;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active?: boolean;
  [key: string]: any;
}

// Create a Supabase client using the current user's access token.
const createAuthenticatedClient = (token: string) => {
  const supabaseUrl = process.env.SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'SUPABASE_URL or Supabase publishable/anon key is missing'
    );
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

// Verify Supabase access token and load user profile.
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization || '';

  const token = authorization.startsWith('Bearer ')
    ? authorization.substring(7).trim()
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

    // Step 1: Verify access token with Supabase Auth.
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

    // Step 2: Fetch permanent user profile.
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        '[Profile Lookup Error]:',
        profileError.message
      );

      return res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_LOOKUP_FAILED',
          message: 'Unable to load user profile',
        },
      });
    }

    // Step 3: Check whether profile exists.
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'User profile not found',
        },
      });
    }

    const userProfile = profile as UserProfile;

    // Step 4: Check account status.
    if (userProfile.is_active === false) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been deactivated',
        },
      });
    }

    // Step 5: Attach authenticated user to request.
    req.authUser = authUser;

    const storedProfile = db.users.find(
      (user) => user.id === authUser.id
    );
    const appProfile = Object.fromEntries(
      Object.entries(storedProfile || {}).filter(
        ([key]) => key !== 'passwordHash'
      )
    );
    const mergedProfile = {
      ...userProfile,
      ...appProfile,
      id: authUser.id,
      email: authUser.email || userProfile.email,
      role: userProfile.role,
      is_active: userProfile.is_active,
    };

    if (storedProfile) {
      Object.assign(storedProfile, mergedProfile);
    } else {
      db.users.push(mergedProfile);
    }

    req.user = mergedProfile;

    return next();

  } catch (error) {
    console.error('[Authentication Error]:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_CONFIGURATION_ERROR',
        message: 'Authentication service is unavailable',
      },
    });
  }
};

// Role-based authorization middleware.
export const requireRole = (...roles: string[]) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
    }

    return next();
  };
};
