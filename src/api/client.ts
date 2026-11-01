
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

import type { NormalizedError } from '@/types';

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// --------------------------------------
// API BASE URL
// --------------------------------------

const API_BASE_URL = env.VITE_API_URL?.trim().replace(/\/+$/, '');

if (!API_BASE_URL) {
  throw new Error(
    'VITE_API_URL is missing. Set it in Vercel Environment Variables.'
  );
}

if (API_BASE_URL.includes('project-match-gilt.vercel.app')) {
  throw new Error(
    'Incorrect API URL: frontend Vercel URL detected. Use your Render backend URL.'
  );
}

console.log('[Project-Match API Base URL]:', API_BASE_URL);

// --------------------------------------
// AXIOS CLIENT
// --------------------------------------

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// --------------------------------------
// ERROR NORMALIZATION
// --------------------------------------

export const normalizeError = (error: unknown): NormalizedError => {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{
      success?: boolean;
      error?: {
        code?: string;
        message?: string;
        details?: NormalizedError['details'];
      };
      message?: string;
    }>;

    if (err.response?.data?.error) {
      return {
        status: err.response.status,
        code: err.response.data.error.code || 'UNKNOWN_ERROR',
        message:
          err.response.data.error.message || 'An error occurred',
        details: err.response.data.error.details,
      };
    }

    if (err.response) {
      return {
        status: err.response.status,
        code: `HTTP_${err.response.status}`,
        message:
          err.response.data?.message ||
          err.message ||
          'Request failed',
        details: err.response.data as NormalizedError['details'],
      };
    }

    if (err.request) {
      return {
        status: 0,
        code: 'NETWORK_ERROR',
        message:
          'Could not connect to the server. Please check your internet connection.',
      };
    }

    return {
      status: 0,
      code: 'REQUEST_CONFIG_ERROR',
      message: err.message || 'Unexpected request error.',
    };
  }

  const genericError = error as {
    status?: number;
    code?: string;
    message?: string;
    details?: NormalizedError['details'];
  };

  return {
    status: genericError?.status || 500,
    code: genericError?.code || 'INTERNAL_ERROR',
    message:
      genericError?.message || 'An unexpected error occurred.',
    details: genericError?.details,
  };
};

// --------------------------------------
// SUPABASE ACCESS TOKEN INTERCEPTOR
// --------------------------------------

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      const token = data.session?.access_token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;

        useAuthStore.getState().setToken(token);
      } else {
        delete config.headers.Authorization;
      }
    } catch (error) {
      console.error('[Auth Token Error]:', error);
    }

    return config;
  },
  (error) => Promise.reject(normalizeError(error))
);

// --------------------------------------
// SESSION REFRESH
// --------------------------------------

let refreshPromise: Promise<string | null> | null = null;

const refreshSupabaseSession = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data, error } =
          await supabase.auth.refreshSession();

        if (error || !data.session?.access_token) {
          console.error(
            '[Session Refresh Error]:',
            error?.message || 'No refreshed session returned'
          );

          return null;
        }

        const newToken = data.session.access_token;

        useAuthStore.getState().setToken(newToken);

        return newToken;
      } catch (error) {
        console.error('[Session Refresh Error]:', error);

        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

// --------------------------------------
// RESPONSE INTERCEPTOR
// --------------------------------------

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryableRequest | undefined;

    if (!originalRequest) {
      return Promise.reject(normalizeError(error));
    }

    const isAuthRoute =
      originalRequest.url?.includes('/auth/');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;

      const newToken = await refreshSupabaseSession();

      if (newToken) {
        originalRequest.headers.Authorization =
          `Bearer ${newToken}`;

        return apiClient(originalRequest);
      }

      // Refresh failed: clear the local Supabase session.
      await supabase.auth.signOut({ scope: 'local' });

      useAuthStore.getState().clear();

      // Redirect to login if necessary.
      if (typeof window !== 'undefined') {
        const currentPath =
          window.location.pathname + window.location.search;

        if (
          !currentPath.startsWith('/login') &&
          !currentPath.startsWith('/register')
        ) {
          window.location.href =
            `/login?next=${encodeURIComponent(currentPath)}`;
        }
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export default apiClient;
