import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const AdminRoute: React.FC = () => {
  const { user, status } = useAuth();

  if (status === 'booting') {
    return null;
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
