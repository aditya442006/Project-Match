import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white shadow-md">
          PM
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Welcome to ProjectMatch
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300">
          Create an account, verify your email, and securely sign in.
        </p>

        <Card className="mx-auto mt-8 max-w-md border-slate-200 text-left shadow-lg dark:border-slate-800">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Email verification
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Confirm your email address to activate your account.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Secure sign-in
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Password recovery is available if you need it.
                </p>
              </div>
            </div>

            {isAuthenticated ? (
              <Link to="/account" className="block pt-2">
                <Button className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Go to your account
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link to="/register" className="flex-1">
                  <Button className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Create account
                  </Button>
                </Link>
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Sign in
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
