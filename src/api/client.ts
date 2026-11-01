
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

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

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
    message: genericError?.message || 'An unexpected error occurred.',
    details: genericError?.details,
  };
};

// Attach the latest Supabase access token to every API request.
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!error && session?.access_token) {
        config.headers.Authorization =
          `Bearer ${session.access_token}`;

        useAuthStore.getState().setToken(session.access_token);
      } else {
        config.headers.Authorization = undefined;
      }
    } catch (error) {
      console.error('[Auth Token Error]:', error);
    }

    return config;
  },
  (error) => Promise.reject(normalizeError(error))
);

// One refresh operation is shared by concurrent failed requests.
let refreshPromise: Promise<string | null> | null = null;

const refreshSupabaseSession = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data, error } =
          await supabase.auth.refreshSession();

        if (error || !data.session?.access_token) {
          return null;
        }

        useAuthStore.getState().setToken(
          data.session.access_token
        );

        return data.session.access_token;
      } catch (error) {
        console.error('[Session Refresh Error]:', error);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};

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

      // Refresh failed: clear local session and authentication state.
      await supabase.auth.signOut({ scope: 'local' });

      useAuthStore.getState().clear();

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
