import React, { useState } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/auth.api';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export const EmailVerifiedGate: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // If user is not verified, they can only access /verify-email, /logout
  const isUnverified = user && user.is_verified === false;
  const isAllowedPath = location.pathname.startsWith('/verify-email') || location.pathname.startsWith('/logout');

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await authApi.resendVerification(user?.email);
      showToast({
        type: 'success',
        title: 'Verification email sent',
        message: 'Please check your inbox and click the verification link.',
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
    } catch {
      showToast({
        type: 'error',
        title: 'Failed to send',
        message: 'Please wait a moment before trying again.',
      });
    } finally {
      setResending(false);
    }
  };

  if (isUnverified && !isAllowedPath) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
  }

  return (
    <>
      {isUnverified && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Your email ({user?.email}) is unverified. Please verify your email to unlock all features.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="font-medium underline hover:text-amber-800 dark:hover:text-amber-100 disabled:opacity-50 cursor-pointer"
            >
              {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
            </button>
            <span className="text-amber-400">|</span>
            <Link to="/logout" className="underline hover:text-amber-800 dark:hover:text-amber-100">
              Log out
            </Link>
          </div>
        </div>
      )}
      <Outlet />
    </>
  );
};
