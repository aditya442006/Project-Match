import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/Skeleton';

export const ProtectedRoute: React.FC = () => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'booting') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <Skeleton variant="circle" className="w-12 h-12" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
          <p className="text-center text-xs text-slate-400 font-medium">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (status === 'anonymous') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
};
