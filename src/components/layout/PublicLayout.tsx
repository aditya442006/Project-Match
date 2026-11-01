import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useUiStore } from '@/store/uiStore';
import { WifiOff } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { isOnline, setIsOnline } = useUiStore();

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
        <div className="bg-rose-500 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>You are currently offline. Please check your connection.</span>
        </div>
      )}

      <Navbar />

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
