import { useEffect, useCallback } from 'react';

import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { supabase } from '@/lib/supabase';

import { initSocket, disconnectSocket } from '@/socket/socket';
import { useQueryClient } from '@tanstack/react-query';

import type {
  LoginPayload,
  SignupPayload,
} from '@/api/auth.api';

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

  // Restore the existing Supabase session.
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
        disconnectSocket();
        clear();
        return;
      }

      // Save the access token in Zustand.
      useAuthStore.getState().setToken(
        session.access_token
      );

      // Validate the token and fetch the user's profile.
      const meRes = await authApi.getMe();

      if (!meRes.data?.id) {
        throw new Error('User profile could not be loaded');
      }

      setSession(
        meRes.data,
        session.access_token
      );

      initSocket(session.access_token);

    } catch (error) {
      console.error('[Restore Session Error]:', error);

      disconnectSocket();

      await supabase.auth.signOut({
        scope: 'local',
      });

      clear();
    }
  }, [setSession, clear]);

  // Restore session when the application starts.
  useEffect(() => {
    if (status === 'booting') {
      void restoreSession();
    }
  }, [status, restoreSession]);

  // Listen for Supabase authentication changes.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {

      if (event === 'SIGNED_OUT' || !session) {
        disconnectSocket();
        clear();
        return;
      }

      useAuthStore.getState().setToken(
        session.access_token
      );

      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED'
      ) {
        initSocket(session.access_token);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clear]);

  // Login.
  const login = async (payload: LoginPayload) => {
    const res = await authApi.login(payload);

    const { session, user: loggedInUser } = res.data;

    if (
      !session?.access_token ||
      !session?.refresh_token
    ) {
      throw new Error(
        'Login did not return a valid Supabase session'
      );
    }

    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (error) {
      throw error;
    }

    setSession(
      loggedInUser,
      session.access_token
    );

    initSocket(session.access_token);

    return res.data;
  };

  // Signup.
  const signup = async (payload: SignupPayload) => {
    const res = await authApi.signup(payload);

    const { session, user: newUser } = res.data;

    // If email confirmation is enabled,
    // Supabase may not return a session immediately.
    if (
      session?.access_token &&
      session?.refresh_token
    ) {
      const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (error) {
        throw error;
      }

      setSession(
        newUser,
        session.access_token
      );

      initSocket(session.access_token);
    }

    return res.data;
  };

  // Logout.
  const logout = async () => {
    try {
      await supabase.auth.signOut({
        scope: 'local',
      });
    } catch (error) {
      console.error('[Supabase Logout Error]:', error);
    }

    try {
      await authApi.logout();
    } catch (error) {
      console.error('[API Logout Error]:', error);
    }

    disconnectSocket();
    queryClient.clear();
    clear();
  };

  return {
    user,
    accessToken,
    status,

    isAuthenticated: status === 'authenticated',
    isBooting: status === 'booting',
    isAdmin: user?.role === 'admin',
    isVerified: user?.is_verified ?? false,

    login,
    signup,
    logout,
    restoreSession,

    setUser,
    setSession,
  };
};
