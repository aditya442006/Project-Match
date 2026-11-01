import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validation';
import { authApi } from '@/api/auth.api';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import type { NormalizedError } from '@/types';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sessionChecking, setSessionChecking] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const exchangeRecoverySession = async () => {
      try {
        // Exchange recovery link tokens from supabase hash/session
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          setSessionError('Password reset link is invalid or expired. Please request a new one.');
          setSessionChecking(false);
          return;
        }

        // Bridge to ProjectMatch backend via POST /auth/session {access_token, refresh_token}
        await authApi.exchangeSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        setSessionChecking(false);
      } catch (err: unknown) {
        const error = err as NormalizedError;
        setSessionError(error?.message || 'Unable to verify reset session.');
        setSessionChecking(false);
      }
    };

    exchangeRecoverySession();
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setGeneralError(null);
    try {
      await authApi.resetPassword(data.password);
      showToast({
        type: 'success',
        title: 'Password updated',
        message: 'Your password has been changed. You can now log in.',
      });
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setGeneralError(error?.message || 'Failed to reset password. Please try again.');
    }
  };

  if (sessionChecking) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Verifying security token...</p>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-rose-200 dark:border-rose-900/60">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invalid Reset Link</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{sessionError}</p>
            <div className="pt-2">
              <Link to="/forgot-password">
                <Button variant="primary" className="w-full">
                  Request New Reset Link
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Choose a new password</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enter a strong password with at least 8 characters
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {generalError && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="Min 8 chars, 1 letter + 1 digit"
                leftIcon={<Lock className="w-4 h-4" />}
                required
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                leftIcon={<Lock className="w-4 h-4" />}
                required
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                size="lg"
                isLoading={isSubmitting}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
