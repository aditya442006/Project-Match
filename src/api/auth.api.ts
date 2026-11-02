
import { apiClient } from './client';
import type { Profile, AuthSession, LoginResponseData } from '@/types';

// Standard backend response format
export interface AuthApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
}

// Request types
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

// Response data types
export interface SignupResponseData {
  user: Profile;
  session: AuthSession | null;
  email_verified: boolean;
  message?: string;
}

export interface RefreshResponseData {
  session: AuthSession;
  user: Profile;
}

export interface SessionResponseData {
  user: Profile;
}

export interface MessageResponseData {
  message: string;
}

// API functions
export const authApi = {
  signup: (payload: SignupPayload) =>
    apiClient.post<AuthApiResponse<SignupResponseData>>(
      '/auth/signup',
      {
        ...payload,
        email: payload.email.trim().toLowerCase(),
      }
    ),

  login: (payload: LoginPayload) =>
    apiClient.post<AuthApiResponse<LoginResponseData>>(
      '/auth/login',
      {
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      }
    ),

  refresh: (refresh_token: string) =>
    apiClient.post<AuthApiResponse<RefreshResponseData>>(
      '/auth/refresh',
      { refresh_token }
    ),

  exchangeSession: (payload: {
    access_token: string;
    refresh_token?: string;
  }) =>
    apiClient.post<AuthApiResponse<SessionResponseData>>(
      '/auth/session',
      payload
    ),

  logout: () =>
    apiClient.post<AuthApiResponse<MessageResponseData>>(
      '/auth/logout'
    ),

  forgotPassword: (email: string) =>
    apiClient.post<AuthApiResponse<MessageResponseData>>(
      '/auth/forgot-password',
      { email: email.trim().toLowerCase() }
    ),

  resetPassword: (password: string) =>
    apiClient.post<AuthApiResponse<MessageResponseData>>(
      '/auth/reset-password',
      { password }
    ),

  // Your backend expects the field name "password".
  changePassword: (payload: {
    current_password?: string;
    new_password: string;
  }) =>
    apiClient.post<AuthApiResponse<MessageResponseData>>(
      '/auth/change-password',
      { password: payload.new_password }
    ),

  resendVerification: (email: string) =>
    apiClient.post<AuthApiResponse<MessageResponseData>>(
      '/auth/resend-verification',
      { email: email.trim().toLowerCase() }
    ),

  getMe: () =>
    apiClient.get<AuthApiResponse<Profile>>('/auth/me'),
};

export default authApi;
