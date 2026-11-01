
import { apiClient } from './client';

import type {
  ApiResponse,
  AuthSession,
  LoginResponseData,
  Profile,
} from '@/types';

// --------------------------------------
// REQUEST TYPES
// --------------------------------------

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

// --------------------------------------
// RESPONSE TYPES
// --------------------------------------

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

// --------------------------------------
// AUTH API
// --------------------------------------

export const authApi = {
  // ------------------------------------
  // SIGNUP
  // POST /api/v1/auth/signup
  // ------------------------------------

  signup: (payload: SignupPayload) =>
    apiClient.post<ApiResponse<SignupResponseData>>(
      '/auth/signup',
      payload
    ),

  // ------------------------------------
  // LOGIN
  // POST /api/v1/auth/login
  // ------------------------------------

  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<LoginResponseData>>(
      '/auth/login',
      payload
    ),

  // ------------------------------------
  // REFRESH SESSION
  // POST /api/v1/auth/refresh
  // ------------------------------------

  refresh: (refresh_token: string) =>
    apiClient.post<ApiResponse<RefreshResponseData>>(
      '/auth/refresh',
      { refresh_token }
    ),

  // ------------------------------------
  // EXCHANGE SESSION
  // POST /api/v1/auth/session
  // ------------------------------------

  exchangeSession: (payload: {
    access_token: string;
    refresh_token?: string;
  }) =>
    apiClient.post<ApiResponse<{ user: Profile }>>(
      '/auth/session',
      payload
    ),

  // ------------------------------------
  // LOGOUT
  // POST /api/v1/auth/logout
  // ------------------------------------

  logout: () =>
    apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/logout'
    ),

  // ------------------------------------
  // FORGOT PASSWORD
  // POST /api/v1/auth/forgot-password
  // ------------------------------------

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/forgot-password',
      { email }
    ),

  // ------------------------------------
  // RESET PASSWORD
  // POST /api/v1/auth/reset-password
  // ------------------------------------

  resetPassword: (password: string) =>
    apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/reset-password',
      { password }
    ),

  // ------------------------------------
  // CHANGE PASSWORD
  // POST /api/v1/auth/change-password
  // ------------------------------------

  changePassword: (payload: {
    current_password?: string;
    new_password: string;
  }) =>
    apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/change-password',
      {
        password: payload.new_password,
      }
    ),

  // ------------------------------------
  // RESEND EMAIL VERIFICATION
  // POST /api/v1/auth/resend-verification
  // ------------------------------------

  resendVerification: (email: string) =>
    apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/resend-verification',
      { email }
    ),

  // ------------------------------------
  // GET CURRENT USER
  // GET /api/v1/auth/me
  // ------------------------------------

  getMe: () =>
    apiClient.get<ApiResponse<Profile>>('/auth/me'),
};

export default authApi;
