import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import type { NormalizedError, ApiResponse } from '@/types';

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Single-flight refresh token queue state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: NormalizedError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const normalizeError = (error: unknown): NormalizedError => {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{
      success?: boolean;
      error?: {
        code?: string;
        message?: string;
        details?: {
          body?: Array<{ path: (string | number)[]; message: string }>;
          [key: string]: unknown;
        };
      };
      message?: string;
    }>;

    if (err.response?.data?.error) {
      return {
        status: err.response.status,
        code: err.response.data.error.code || 'UNKNOWN_ERROR',
        message: err.response.data.error.message || 'An error occurred',
        details: err.response.data.error.details,
      };
    }

    if (err.response) {
      return {
        status: err.response.status,
        code: `HTTP_${err.response.status}`,
        message: err.response.data?.message || err.message || 'Request failed',
        details: err.response.data as NormalizedError['details'],
      };
    }

    if (err.request) {
      return {
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Could not connect to the server. Please check your internet connection.',
      };
    }

    return {
      status: 0,
      code: 'REQUEST_CONFIG_ERROR',
      message: err.message || 'An unexpected request error occurred.',
    };
  }

  const genericError = error as { status?: number; code?: string; message?: string; details?: NormalizedError['details'] };
  return {
    status: genericError?.status || 500,
    code: genericError?.code || 'INTERNAL_ERROR',
    message: genericError?.message || 'An unexpected error occurred.',
    details: genericError?.details,
  };
};

// Request interceptor to attach Authorization token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(normalizeError(error));
  }
);

// Response interceptor with single-flight 401 refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't intercept if no original request or request already retried
    if (!originalRequest) {
      return Promise.reject(normalizeError(error));
    }

    // Ignore 401s from /auth/* to avoid infinite refresh loops
    const isAuthRoute = originalRequest.url?.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // If already refreshing, wait on queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(normalizeError(err));
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token endpoint uses the httpOnly cookie pm_refresh
        const refreshResponse = await axios.post<
          ApiResponse<{
            session?: { access_token: string; refresh_token?: string };
            access_token?: string;
          }>
        >(`${env.VITE_API_URL}/auth/refresh`, {}, { withCredentials: true });

        const data = refreshResponse.data?.data;
        const newToken = data?.session?.access_token || data?.access_token;

        if (!newToken) {
          throw new Error('No access token returned from refresh');
        }

        useAuthStore.getState().setToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);

        return apiClient(originalRequest);
      } catch (refreshErr) {
        const normalizedRefreshErr = normalizeError(refreshErr);
        processQueue(normalizedRefreshErr, null);

        // Hard logout on refresh failure
        useAuthStore.getState().clear();

        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname + window.location.search;
          if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
            window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
          }
        }

        return Promise.reject(normalizedRefreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);
