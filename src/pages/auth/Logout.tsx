import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const Logout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      await logout();
      navigate('/', { replace: true });
    };
    performLogout();
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Signing you out...</p>
      </div>
    </div>
  );
};
