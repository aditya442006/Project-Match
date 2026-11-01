import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterFormData, mapServerErrorsToForm } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertCircle, Lock, Mail, User, GraduationCap, ArrowRight } from 'lucide-react';
import type { NormalizedError } from '@/types';

export const Register: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    // eslint-disable-next-line @any
    resolver: zodResolver(registerSchema) as any,
  });

  const onSubmit = async (data: RegisterFormData) => {
    setGeneralError(null);
    try {
      await signup({
        name: data.name,
        email: data.email,
        password: data.password,
        college: data.college || undefined,
        branch: data.branch || undefined,
        year: data.year ? Number(data.year) : undefined,
      });
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      const error = err as NormalizedError;
      if (error?.status === 422) {
        mapServerErrorsToForm(error, setError);
      } else {
        setGeneralError(error?.message || 'Failed to create account. Please check your details.');
      }
    }
  };

  const yearOptions = [
    { value: '1', label: '1st Year (Freshman)' },
    { value: '2', label: '2nd Year (Sophomore)' },
    { value: '3', label: '3rd Year (Junior)' },
    { value: '4', label: '4th Year (Senior)' },
    { value: '5', label: '5th Year (Dual/Integrated)' },
    { value: '6', label: '6th Year (Masters/PhD)' },
  ];

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl items-center justify-center shadow-md mb-3">
            PM
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Join thousands of college students building projects together
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
                label="Full Name"
                placeholder="Jane Doe"
                leftIcon={<User className="w-4 h-4" />}
                required
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="College Email"
                type="email"
                placeholder="you@university.edu"
                leftIcon={<Mail className="w-4 h-4" />}
                required
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Min 8 chars, 1 letter + 1 digit"
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  error={errors.password?.message}
                  {...register('password')}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Academic Info (Optional)
                </p>

                <Input
                  label="College / University"
                  placeholder="e.g. Stanford University, IIT Bombay"
                  leftIcon={<GraduationCap className="w-4 h-4" />}
                  error={errors.college?.message}
                  {...register('college')}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Branch / Major"
                    placeholder="e.g. Computer Science"
                    error={errors.branch?.message}
                    {...register('branch')}
                  />

                  <Select
                    label="Current Year"
                    placeholder="Select year (1-6)"
                    options={yearOptions}
                    error={errors.year?.message}
                    {...register('year')}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-4"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
