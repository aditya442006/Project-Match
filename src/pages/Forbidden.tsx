import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, Home } from 'lucide-react';

export const Forbidden: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
        403 - Access Forbidden
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
        You don't have administrative privileges to view this section of ProjectMatch.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
