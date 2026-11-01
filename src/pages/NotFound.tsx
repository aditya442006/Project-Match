import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 font-mono font-bold text-2xl shadow-xs">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
        The page you are looking for does not exist or has been moved to another URL.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => window.history.back()} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Go Back
        </Button>
        <Link to="/dashboard">
          <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
