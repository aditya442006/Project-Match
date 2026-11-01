
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

  // Restore the saved Supabase session when the application loads.
  const restoreSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.access_token) {
        disconnectSocket();
        clear();
        return;
      }

      // Keep the current access token in Zustand.
      useAuthStore.getState().setToken(
        session.access_token
      );

      // Ask the backend to validate the token and load the profile.
      const meRes = await authApi.getMe();

      if (!meRes.data) {
        throw new Error('User profile could not be loaded');
      }

      setSession(meRes.data, session.access_token);

      initSocket(session.access_token);
    } catch (error) {
      console.error('[Restore Session Error]:', error);

      disconnectSocket();
      clear();
    }
  }, [setSession, clear]);

  // Restore session once when the app starts.
  useEffect(() => {
    if (status === 'booting') {
      void restoreSession();
    }
  }, [status, restoreSession]);

  // Keep Zustand and Socket.IO synchronized with Supabase auth changes.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        disconnectSocket();
        clear();
        return;
      }

      if (
        event === 'TOKEN_REFRESHED' ||
        event === 'SIGNED_IN' ||
        event === 'INITIAL_SESSION'
      ) {
        useAuthStore.getState().setToken(
          session.access_token
        );

        if (event !== 'INITIAL_SESSION') {
          initSocket(session.access_token);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clear]);

  // Login using the backend and save the returned Supabase session.
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

  // Signup. Supabase may require email verification first.
  const signup = async (payload: SignupPayload) => {
    const res = await authApi.signup(payload);

    const session = res.data.session;

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

      if (res.data.user) {
        setSession(
          res.data.user,
          session.access_token
        );

        initSocket(session.access_token);
      }
    }

    return res.data;
  };

  // Logout from Supabase and clean up application state.
  const logout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('[Supabase Logout Error]:', error);
    }

    try {
      await authApi.logout();
    } catch (error) {
      console.error('[API Logout Error]:', error);
    } finally {
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
