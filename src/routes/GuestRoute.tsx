import React from 'react';
import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const GuestRoute: React.FC = () => {
  const { status } = useAuth();
  const [searchParams] = useSearchParams();

  if (status === 'booting') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'authenticated') {
    const next = searchParams.get('next');
    return <Navigate to={next ? decodeURIComponent(next) : '/account'} replace />;
  }

  return <Outlet />;
};
