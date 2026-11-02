
import { useEffect, useCallback } from 'react';

import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { supabase } from '@/lib/supabase';

import {
  initSocket,
  disconnectSocket,
} from '@/socket/socket';

import { useQueryClient } from '@tanstack/react-query';

import type {
  LoginPayload,
  SignupPayload,
} from '@/api/auth.api';

import type {
  AuthSession,
  Profile,
} from '@/types';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const {
    user,
    accessToken,
    status,
    setSession,
    setUser,
    clear,
  } = useAuthStore();

  // ---------------------------------------
  // RESTORE SESSION
  // ---------------------------------------

  const restoreSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!session?.access_token) {
        clear();
        disconnectSocket();
        return;
      }

      // Get the latest user profile from backend.
      const meRes = await authApi.getMe();

      const profile = meRes.data?.data as Profile | undefined;

      if (!profile) {
        throw new Error('Unable to load user profile.');
      }

      setSession(
        profile,
        session.access_token,
        session as AuthSession
      );

      initSocket(session.access_token);
    } catch (error) {
      console.error('[Session Restore Error]:', error);

      await supabase.auth.signOut({ scope: 'local' });

      disconnectSocket();
      clear();
    }
  }, [setSession, clear]);

  // ---------------------------------------
  // INITIAL AUTHENTICATION CHECK
  // ---------------------------------------

  useEffect(() => {
    if (status === 'booting') {
      restoreSession();
    }
  }, [status, restoreSession]);

  // ---------------------------------------
  // LOGIN
  // ---------------------------------------

  const login = async (payload: LoginPayload) => {
    try {
      const response = await authApi.login(payload);

      // IMPORTANT:
      // Axios response -> response.data
      // API response payload -> response.data.data

      const result = response.data?.data;

      if (!response.data?.success || !result) {
        throw new Error(
          response.data?.error?.message ||
          'Login failed. Invalid server response.'
        );
      }

      const { session, user: loggedInUser } = result;

      if (
        !session?.access_token ||
        !session?.refresh_token ||
        !loggedInUser
      ) {
        throw new Error(
          'Login did not return a valid Supabase session.'
        );
      }

      // Establish the backend-returned session in Supabase.
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (sessionError) {
        throw sessionError;
      }

      if (!sessionData.session?.access_token) {
        throw new Error(
          'Supabase could not establish the login session.'
        );
      }

      const activeSession = sessionData.session;

      // Save the profile and complete session.
      setSession(
        loggedInUser,
        activeSession.access_token,
        activeSession as AuthSession
      );

      // Connect socket using the active Supabase token.
      initSocket(activeSession.access_token);

      return {
        ...result,
        session: activeSession,
        user: loggedInUser,
      };
    } catch (error) {
      console.error('[Login Error]:', error);
      throw error;
    }
  };

  // ---------------------------------------
  // SIGNUP
  // ---------------------------------------

  const signup = async (payload: SignupPayload) => {
    const response = await authApi.signup(payload);

    if (!response.data?.success || !response.data?.data) {
      throw new Error(
        response.data?.error?.message ||
        'Signup failed.'
      );
    }

    return response.data.data;
  };

  // ---------------------------------------
  // LOGOUT
  // ---------------------------------------

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('[Backend Logout Error]:', error);
    } finally {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (error) {
        console.error('[Supabase Logout Error]:', error);
      }

      queryClient.clear();

      disconnectSocket();

      clear();
    }
  };

  return {
    user,
    accessToken,
    status,

    isAuthenticated: status === 'authenticated',
    isBooting: status === 'booting',
    isAdmin: user?.role === 'admin',
    isVerified: user?.is_verified ?? true,

    login,
    signup,
    logout,
    restoreSession,
    setUser,
    setSession,
  };
};
