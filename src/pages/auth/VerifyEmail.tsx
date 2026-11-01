import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MailCheck, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import type { NormalizedError } from '@/types';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setSession, setUser } = useAuth();
  const { showToast } = useToast();

  const emailParam = searchParams.get('email') || user?.email || 'your email';

  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setVerificationError(null);
    try {
      await authApi.resendVerification(emailParam);
      showToast({
        type: 'success',
        title: 'Verification Link Sent',
        message: `A new confirmation link was sent to ${emailParam}.`,
      });
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const error = err as NormalizedError;
      setVerificationError(error?.message || 'Could not resend email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerified = async () => {
    setVerifying(true);
    setVerificationError(null);
    try {
      // POST /auth/refresh then GET /auth/me
      const refreshRes = await authApi.refresh();
      const token = refreshRes.data?.session?.access_token;
      if (token) {
        const meRes = await authApi.getMe();
        if (meRes.data) {
          setSession(meRes.data, token);
          if (meRes.data.is_verified) {
            showToast({
              type: 'success',
              title: 'Email Verified',
              message: 'Your email address has been successfully confirmed!',
            });
            navigate('/dashboard', { replace: true });
            return;
          }
        }
      }
      setVerificationError("Your email has not been confirmed yet. Please click the link in your email inbox and try again.");
    } catch {
      // If refresh fails, try getMe if we already have session
      try {
        const meRes = await authApi.getMe();
        if (meRes.data?.is_verified) {
          setUser(meRes.data);
          navigate('/dashboard', { replace: true });
          return;
        }
        setVerificationError("Email is still pending verification. Please check your inbox or spam folder.");
      } catch {
        setVerificationError("Session expired. Please log in after verifying your email.");
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <MailCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verify your email</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We've sent a confirmation link to:
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-lg inline-block">
                {emailParam}
              </p>
            </div>

            {verificationError && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 text-left">
                {verificationError}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleCheckVerified}
                isLoading={verifying}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                I've verified my email
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                isLoading={resending}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend verification email'}
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <Link to="/login" className="text-indigo-600 hover:underline">
                Back to sign in
              </Link>
              <Link to="/logout" className="text-slate-400 hover:text-slate-600">
                Sign out
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
