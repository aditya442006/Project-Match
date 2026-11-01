import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validation';
import { authApi } from '@/api/auth.api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await authApi.forgotPassword(data.email);
    } catch {
      // Intentionally neutral: Never reveal whether the account exists
    } finally {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset your password</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enter your college email and we'll send you recovery instructions
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {submitted ? (
              <div className="text-center space-y-4 py-2">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Check your email</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  If an account exists with that email address, you will receive password reset instructions shortly.
                </p>
                <div className="pt-4">
                  <Link to="/login">
                    <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                      Back to sign in
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@college.edu"
                  autoComplete="email"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  size="lg"
                  isLoading={isSubmitting}
                >
                  Send Reset Link
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
