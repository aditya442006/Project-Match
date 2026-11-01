
import { apiClient } from './client';

import type {
  ApiResponse,
  LoginResponseData,
  Profile,
  AuthSession,
} from '@/types';

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  college?: string;
  branch?: string;
  year?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  expires_at?: number;
  user?: unknown;
}

export interface AuthResponseData {
  user: Profile;
  session?: AuthSession | null;
  email_verified?: boolean;
  message?: string;
}

export interface RefreshResponseData {
  session: AuthSession;
  user?: Profile;
}

export const authApi = {
  // Register a new account
  signup: async (payload: SignupPayload) => {
    const res = await apiClient.post<
      ApiResponse<AuthResponseData>
    >('/auth/signup', payload);

    return res.data;
  },

  // Login with email and password
  login: async (payload: LoginPayload) => {
    const res = await apiClient.post<
      ApiResponse<LoginResponseData>
    >('/auth/login', payload);

    return res.data;
  },

  // Refresh the Supabase session
  refresh: async (refresh_token: string) => {
    const res = await apiClient.post<
      ApiResponse<RefreshResponseData>
    >('/auth/refresh', { refresh_token });

    return res.data;
  },

  // Exchange and validate an existing access token
  exchangeSession: async (payload: {
    access_token: string;
    refresh_token?: string;
  }) => {
    const res = await apiClient.post<
      ApiResponse<{
        session: {
          access_token: string;
          refresh_token?: string | null;
        };
        user: Profile;
      }>
    >('/auth/session', payload);

    return res.data;
  },

  // Logout
  logout: async (payload?: {
    access_token?: string;
    refresh_token?: string;
  }) => {
    const res = await apiClient.post<
      ApiResponse<{ message: string }>
    >('/auth/logout', payload || {});

    return res.data;
  },

  // Request password reset email
  forgotPassword: async (email: string) => {
    const res = await apiClient.post<
      ApiResponse<{ message: string }>
    >('/auth/forgot-password', { email });

    return res.data;
  },

  // Reset password using an authenticated Supabase session
  resetPassword: async (password: string) => {
    const res = await apiClient.post<
      ApiResponse<{ message: string }>
    >('/auth/reset-password', { password });

    return res.data;
  },

  // Change password
  changePassword: async (payload: {
    current_password?: string;
    new_password: string;
  }) => {
    const res = await apiClient.post<
      ApiResponse<{ message: string }>
    >('/auth/change-password', {
      password: payload.new_password,
    });

    return res.data;
  },

  // Resend email verification
  resendVerification: async (email: string) => {
    const res = await apiClient.post<
      ApiResponse<{ message: string }>
    >('/auth/resend-verification', { email });

    return res.data;
  },

  // Get currently authenticated user
  getMe: async () => {
    const res = await apiClient.get<
      ApiResponse<Profile>
    >('/auth/me');

    return res.data;
  },
};
