import { apiClient } from './client';
import type { ApiResponse, LoginResponseData, Profile } from '@/types';

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

export const authApi = {
  signup: async (payload: SignupPayload) => {
    const res = await apiClient.post<ApiResponse<{ user: Profile }>>('/auth/signup', payload);
    return res.data;
  },

  login: async (payload: LoginPayload) => {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', payload);
    return res.data;
  },

  refresh: async () => {
    const res = await apiClient.post<ApiResponse<{
      session: { access_token: string; refresh_token?: string; expires_in?: number };
      user?: Profile;
    }>>('/auth/refresh');
    return res.data;
  },

  exchangeSession: async (payload: { access_token: string; refresh_token?: string }) => {
    const res = await apiClient.post<ApiResponse<{
      session: { access_token: string; refresh_token?: string; expires_in?: number };
      user: Profile;
    }>>('/auth/session', payload);
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout');
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (password: string) => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', { password });
    return res.data;
  },

  changePassword: async (payload: { current_password: string; new_password: string }) => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/change-password', payload);
    return res.data;
  },

  resendVerification: async (email?: string) => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/resend-verification', { email });
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get<ApiResponse<Profile>>('/auth/me');
    return res.data;
  },
};
