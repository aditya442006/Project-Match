
import { useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import type { Profile } from '@/types';

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const status = useAuthStore((state) => state.status);
  const setSession = useAuthStore((state) => state.setSession);
  const clear = useAuthStore((state) => state.clear);

  const restoreSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session?.access_token) {
        clear();
        return null;
      }

      const response = await authApi.getMe();
      const profile = response.data?.data as Profile | undefined;

      if (!response.data?.success || !profile) {
        await supabase.auth.signOut();
        clear();
        return null;
      }

      setSession(profile, session.access_token);
      return profile;
    } catch (error) {
      console.error('[Restore Session Error]:', error);
      clear();
      return null;
    }
  }, [clear, setSession]);

  const login = useCallback(async (payload: {
    email: string;
    password: string;
  }) => {
    const response = await authApi.login(payload);
    const result = response.data?.data;

    if (
      !response.data?.success ||
      !result?.session?.access_token ||
      !result?.session?.refresh_token ||
      !result?.user
    ) {
      throw new Error(
        response.data?.error?.message || 'Invalid login response'
      );
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'Unable to establish session');
    }

    setSession(result.user, data.session.access_token);

    return {
      user: result.user,
      session: data.session,
      email_verified: result.email_verified,
    };
  }, [setSession]);

  const signup = useCallback(async (payload: {
    email: string;
    password: string;
    name: string;
    college?: string;
    branch?: string;
    year?: number;
  }) => {
    const response = await authApi.signup(payload);

    if (!response.data?.success || !response.data?.data) {
      throw new Error(
        response.data?.error?.message || 'Signup failed'
      );
    }

    const result = response.data.data;

    if (
      result.session?.access_token &&
      result.session?.refresh_token
    ) {
      const { data, error } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });

      if (error || !data.session) {
        throw new Error(error?.message || 'Unable to establish session');
      }

      setSession(result.user, data.session.access_token);
    }

    return result;
  }, [setSession]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('[Backend Logout Error]:', error);
    } finally {
      await supabase.auth.signOut();
      clear();
    }
  }, [clear]);

  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session?.refresh_token) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refresh(session.refresh_token);
      const refreshed = response.data?.data?.session;

      if (
        !response.data?.success ||
        !refreshed?.access_token ||
        !refreshed?.refresh_token
      ) {
        throw new Error('Unable to refresh session');
      }

      const { data, error: sessionError } =
        await supabase.auth.setSession({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
        });

      if (sessionError || !data.session) {
        throw new Error(
          sessionError?.message || 'Unable to update session'
        );
      }

      setSession(
        response.data.data.user,
        data.session.access_token
      );

      return data.session;
    } catch (error) {
      console.error('[Refresh Session Error]:', error);
      await supabase.auth.signOut();
      clear();
      throw error;
    }
  }, [clear, setSession]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [clear]);

  return {
    user,
    token,
    status,
    isAuthenticated: Boolean(user && token),
    login,
    signup,
    logout,
    restoreSession,
    refreshSession,
  };
};

export default useAuth;
