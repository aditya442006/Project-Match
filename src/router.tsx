import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { GuestRoute } from '@/routes/GuestRoute';
import { EmailVerifiedGate } from '@/routes/EmailVerifiedGate';

import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { VerifyEmail } from '@/pages/auth/VerifyEmail';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { Logout } from '@/pages/auth/Logout';

import { Account } from '@/pages/auth/Account';
import { NotFound } from '@/pages/NotFound';

export const router = createBrowserRouter([
  // Public Marketing & Utility Routes
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <Landing />,
      },
      {
        path: '/verify-email',
        element: <VerifyEmail />,
      },
      {
        path: '/reset-password',
        element: <ResetPassword />,
      },
      // Guest-only routes
      {
        element: <GuestRoute />,
        children: [
          {
            path: '/login',
            element: <Login />,
          },
          {
            path: '/register',
            element: <Register />,
          },
          {
            path: '/forgot-password',
            element: <ForgotPassword />,
          },
        ],
      },
    ],
  },

  // Auth Logout Route
  {
    path: '/logout',
    element: <Logout />,
  },

  // Protected account page
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <EmailVerifiedGate />,
        children: [
          {
            path: '/account',
            element: <Account />,
          },
        ],
      },
    ],
  },

  // Fallback 404 Route
  {
    element: <PublicLayout />,
    children: [
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
