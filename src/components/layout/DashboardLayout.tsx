import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useUiStore } from '@/store/uiStore';
import { WifiOff } from 'lucide-react';
import { useSocketEvents } from '@/socket/useSocketEvents';

export const DashboardLayout: React.FC = () => {
  const { isOnline, setIsOnline } = useUiStore();

  // Attach real-time socket event listeners to TanStack Query cache
  useSocketEvents();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {!isOnline && (
        <div className="bg-rose-500 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 sticky top-0 z-50 shadow-sm">
          <WifiOff className="w-4 h-4" />
          <span>You are currently offline. Changes will sync once your connection is restored.</span>
        </div>
      )}

      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
