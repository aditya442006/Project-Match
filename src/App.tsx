import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/router';
import { ToastProvider } from '@/components/ui/Toast';

// Configure TanStack Query client with domain caching & no unnecessary window focus refetching
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: (failureCount, error: any) => {
        // Do not retry on 401, 403, 404, or 422
        if (error?.status === 401 || error?.status === 403 || error?.status === 404 || error?.status === 422) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  );
}
