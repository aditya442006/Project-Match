
import { apiClient } from './client';

import type {
  ApiResponse,
  AuthSession,
  LoginResponseData,
  Profile,
} from '@/types';

// ======================================
// REQUEST TYPES
// ======================================

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

// ======================================
// RESPONSE TYPES
// ======================================

export interface SignupResponseData {
  user: Profile;
  session: AuthSession | null;
  email_verified: boolean;
  message?: string;
}

export interface RefreshResponseData {
  session: AuthSession;
  user?: Profile;
}

export interface LogoutResponseData {
  message: string;
}

export interface MessageResponseData {
  message: string;
}

// ======================================
// API ERROR / RESPONSE TYPES
// ======================================

interface ApiError {
  code?: string;
  message?: string;
  details?: unknown;
}

export interface AuthApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
  message?: string;
}

// ======================================
// AUTH API
// ======================================

export const authApi = {
  // ------------------------------------
  // SIGNUP
  // POST /api/v1/auth/signup
  // ------------------------------------

  signup: (payload: SignupPayload) =>
    apiClient.post<AuthApiResponse<SignupResponseData>>(
      '/auth/signup',
      {
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        name: payload.name.trim(),
        college: payload.college,
        branch: payload.branch,
        year: payload.year,
      }
    ),

  // ------------------------------------
  // LOGIN
  // POST /api/v1/auth/login
  // ------------------------------------

  login: (payload: LoginPayload) =>
    apiClient.post<AuthApiResponse<LoginResponseData>>(
      '/auth/login',
      {
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      }
    ),

  // ------------------------------------
  // REFRESH SESSION
  // POST /api/v1/auth/refresh
  // ------------------------------------

  refresh: (refresh_token: string) =>
    apiClient.post<AuthApiResponse<RefreshResponseData>>(
      '/auth/refresh',
      {
        refresh_token,
      }
    ),

  // ------------------------------------
  // EXCHANGE SESSION
  // POST /api/v1/auth/session
  // ------------------------------------

  exchangeSession: (payload: {
    access_token: string;
    refresh_token?: string;
  }) =>
    apiClient.post<AuthApiResponse<{ user: Profile }>>(
      '/auth/session',
      payload
    ),

  // ------------------------------------
  // LOGOUT
  // POST /api/v1/auth/logout
  // ------------------------------------

  logout: () =>
    apiClient.post<AuthApiResponse<LogoutResponseData>>(
      '/auth/logout'
    ),

  // ------------------------------------
  // FORGOT PASSWORD
  // POST /api/v1/auth/forgot-password
  // ------------------------------------

  forgotPassword: (email: string) =>
    apiClient.post<AuthApiResponse<MessageResponseData>>(
      '/auth/forgot-password',
      {
        email: email.trim().toLowerCase(),
      }
    ),

  // ------------------------------------
  // RESET PASSWORD
  // POST /api/v1/auth/reset-password
  // ------------------------------------

  resetPassword: (password: string) =>
    apiClient.post<AuthApiResponse<MessageResponseData>>(
      '/auth/reset-password',
      {
        password,
      }
    ),

  // ------------------------------------
  // CHANGE PASSWORD
  // POST /api/v1/auth/change-password
  // ------------------------------------

  changePassword: (payload: {
    current_password?: string;
    new_password: string;
  }) =>
    apiClient.post<AuthApiResponse<MessageResponseData>>(
      '/auth/change-password',
      {
        current_password: payload.current_password,
        new_password: payload.new_password,
      }
    ),

  // ------------------------------------
  // RESEND EMAIL VERIFICATION
  // POST /api/v1/auth/resend-verification
  // ------------------------------------

  resendVerification: (email: string) =>
    apiClient.post<AuthApiResponse<MessageResponseData>>(
      '/auth/resend-verification',
      {
        email: email.trim().toLowerCase(),
      }
    ),

  // ------------------------------------
  // GET CURRENT USER
  // GET /api/v1/auth/me
  // ------------------------------------

  getMe: () =>
    apiClient.get<AuthApiResponse<Profile>>(
      '/auth/me'
    ),
};

export default authApi;
