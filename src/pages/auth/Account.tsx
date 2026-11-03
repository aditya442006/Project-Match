import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, LogOut, Mail, UserRound } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export const Account: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-slate-200 dark:border-slate-800 shadow-lg">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white">
              PM
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              You’re signed in
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Your ProjectMatch account is ready.
            </p>
          </div>

          <div className="mt-8 space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
              <UserRound className="h-4 w-4 text-indigo-500" />
              <span>{user.name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
              <Mail className="h-4 w-4 text-indigo-500" />
              <span>{user.email}</span>
            </div>
            {user.is_verified && (
              <div className="flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Email verified</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/forgot-password" className="flex-1">
              <Button variant="outline" className="w-full">
                Change password
              </Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1"
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={() => void logout()}
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
