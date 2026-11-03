
import axios from 'axios';
import { env } from '@/config/env';

const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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
  }) => apiClient.post('/auth/register', payload),

  logout: () => apiClient.post('/auth/logout'),

  getMe: () => apiClient.get('/auth/me'),

  refresh: (refresh_token: string) =>
    apiClient.post('/auth/refresh', { refresh_token }),
};

export default authApi;
