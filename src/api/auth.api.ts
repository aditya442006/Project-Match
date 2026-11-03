
import axios from 'axios';
import { env } from '@/config/env';
import { supabase } from '@/lib/supabase';

const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Attach Supabase access token to protected API requests.
apiClient.interceptors.request.use(async (config) => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

export const authApi = {
  login: (payload: {
    email: string;
    password: string;
  }) => apiClient.post('/auth/login', payload),

  signup: (payload: {
    email: string;
    password: string;
    name: string;
    college?: string;
    branch?: string;
    year?: number;
  }) => apiClient.post('/auth/signup', payload),

  logout: () => apiClient.post('/auth/logout'),

  getMe: () => apiClient.get('/auth/me'),

  refresh: async (refresh_token?: string) => {
    let token = refresh_token;

    if (!token) {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      token = data.session?.refresh_token;
    }

    if (!token) {
      throw new Error('No refresh token available. Please log in again.');
    }

    return apiClient.post('/auth/refresh', {
      refresh_token: token,
    });
  },

  resendVerification: (email?: string | null) =>
    apiClient.post('/auth/resend-verification', { email }),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  exchangeSession: (payload: {
    access_token: string;
    refresh_token?: string;
  }) => apiClient.post('/auth/session', {
    access_token: payload.access_token,
  }),

  resetPassword: (password: string) =>
    apiClient.post('/auth/reset-password', { password }),

  changePassword: (password: string) =>
    apiClient.post('/auth/change-password', { password }),
};

export default authApi;
