import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { initSocket, disconnectSocket } from '@/socket/socket';
import { useQueryClient } from '@tanstack/react-query';
import type { LoginPayload, SignupPayload } from '@/api/auth.api';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { user, accessToken, status, setSession, setUser, clear } = useAuthStore();

  // Bootstraps session on initial app load / page reload
  const restoreSession = useCallback(async () => {
    try {
      const refreshRes = await authApi.refresh();
      const token = refreshRes.data?.session?.access_token;
      if (token) {
        // Hydrate user profile
        const meRes = await authApi.getMe();
        if (meRes.data) {
          setSession(meRes.data, token);
          initSocket(token);
          return;
        }
      }
      clear();
    } catch {
      clear();
    }
  }, [setSession, clear]);

  useEffect(() => {
    if (status === 'booting') {
      restoreSession();
    }
  }, [status, restoreSession]);

  const login = async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    const { session, user: loggedInUser } = res.data;
    setSession(loggedInUser, session.access_token);
    initSocket(session.access_token);
    return res.data;
  };

  const signup = async (payload: SignupPayload) => {
    const res = await authApi.signup(payload);
    return res.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue client cleanup even if network fails
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
