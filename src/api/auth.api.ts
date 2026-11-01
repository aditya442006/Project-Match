import { apiClient } from './client';

import type {
  ApiResponse,
  AuthSession,
  LoginResponseData,
  Profile,
} from '@/types';

// Signup request
export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  college?: string;
  branch?: string;
  year?: number;
}

// Login request
export interface LoginPayload {
  email: string;
  password: string;
}

// Signup response
export interface SignupResponseData {
  user: Profile;
  session: AuthSession | null;
  email_verified: boolean;
  message?: string;
}

// Refresh response
export interface RefreshResponseData {
  session: AuthSession;
  user?: Profile;
}

export const authApi = {
  // Register a new user
  signup: (payload: SignupPayload) =>
    apiClient.post<ApiResponse<SignupResponseData>>(
      '/auth/signup',
      payload
    ),

  // Login
  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<LoginResponseData>>(
      '/auth/login',
      payload
    ),

  // Refresh session using Supabase refresh token
  refresh: (refresh_token: string) =>
    apiClient.post<ApiResponse<RefreshResponseData>>(
      '/auth/refresh',
      { refresh_token }
    ),

  // Exchange an existing Supabase session
  exchangeSession: (payload: {
    access_token: string;
    refresh_token?: string;
  }) =>
    apiClient.post<ApiResponse<{
      user: Profile;
    }>>('/auth/session', payload),

  // Logout
  logout: () =>
    apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/logout'
    ),

  // Forgot password
  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/forgot-password',
      { email }
    ),

  // Reset password
  resetPassword: (password: string) =>
    apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/reset-password',
      { password }
    ),

  // Change password
  changePassword: (payload: {
    current_password?: string;
    new_password: string;
  }) =>
    apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/change-password',
      { password: payload.new_password }
    ),

  // Resend email verification
  resendVerification: (email: string) =>
    apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/resend-verification',
      { email }
    ),

  // Get logged-in user's profile
  getMe: () =>
    apiClient.get<ApiResponse<Profile>>('/auth/me'),
};
