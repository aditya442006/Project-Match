
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { loginSchema, type LoginFormData } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

import {
  AlertCircle,
  Lock,
  Mail,
  ArrowRight,
} from 'lucide-react';

import type { NormalizedError } from '@/types';

export const Login: React.FC = () => {
  const { login } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const result = await login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (!result?.user || !result?.session?.access_token) {
        throw {
          status: 500,
          code: 'INVALID_LOGIN_RESPONSE',
          message: 'Login succeeded but the session was not saved. Please try again.',
        } as NormalizedError;
      }

      if (result.user.is_verified === false) {
        navigate(
          `/verify-email?email=${encodeURIComponent(result.user.email)}`,
          { replace: true }
        );
        return;
      }

      const next = searchParams.get('next');

      // Only allow internal application paths.
      const destination =
        next && next.startsWith('/') && !next.startsWith('//')
          ? next
          : '/dashboard';

      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const error = err as NormalizedError;

      if (
        error?.status === 401 ||
        error?.code === 'BAD_CREDENTIALS'
      ) {
        setServerError('Invalid email or password.');
      } else if (
        error?.status === 403 &&
        error?.code === 'UNVERIFIED'
      ) {
        navigate(
          `/verify-email?email=${encodeURIComponent(data.email)}`
        );
      } else {
        setServerError(
          error?.message ||
            'Unable to log in. Please try again.'
        );
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl items-center justify-center shadow-md mb-3">
            PM
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sign in to continue to your project workspace
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {serverError && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <Input
                label="Email Address"
                type="email"
                placeholder="you@college.edu"
                autoComplete="email"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  {...register('password')}
                />

                <div className="flex justify-end pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
