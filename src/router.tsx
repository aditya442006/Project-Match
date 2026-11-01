import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { GuestRoute } from '@/routes/GuestRoute';
import { AdminRoute } from '@/routes/AdminRoute';
import { EmailVerifiedGate } from '@/routes/EmailVerifiedGate';

import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { VerifyEmail } from '@/pages/auth/VerifyEmail';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { Logout } from '@/pages/auth/Logout';

import { Dashboard } from '@/pages/Dashboard';
import { MyProfile } from '@/pages/profile/MyProfile';
import { EditProfile } from '@/pages/profile/EditProfile';
import { PublicProfile } from '@/pages/profile/PublicProfile';

import { Recommendations } from '@/pages/matching/Recommendations';
import { ProjectList } from '@/pages/projects/ProjectList';
import { ProjectDetail } from '@/pages/projects/ProjectDetail';
import { ProjectForm } from '@/pages/projects/ProjectForm';

import { MyTeams } from '@/pages/teams/MyTeams';
import { TeamWorkspace } from '@/pages/teams/TeamWorkspace';
import { Requests } from '@/pages/requests/Requests';
import { Notifications } from '@/pages/notifications/Notifications';
import { RateTeammates } from '@/pages/ratings/RateTeammates';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';

import { NotFound } from '@/pages/NotFound';
import { Forbidden } from '@/pages/Forbidden';

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
      {
        path: '/403',
        element: <Forbidden />,
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

  // Protected Routes (Session Hydration + Verification Gate + Dashboard Shell)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <EmailVerifiedGate />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              {
                path: '/dashboard',
                element: <Dashboard />,
              },
              {
                path: '/profile/me',
                element: <MyProfile />,
              },
              {
                path: '/profile/edit',
                element: <EditProfile />,
              },
              {
                path: '/profile/:id',
                element: <PublicProfile />,
              },
              {
                path: '/matching',
                element: <Recommendations />,
              },
              {
                path: '/projects',
                element: <ProjectList />,
              },
              {
                path: '/projects/new',
                element: <ProjectForm />,
              },
              {
                path: '/projects/:id',
                element: <ProjectDetail />,
              },
              {
                path: '/projects/:id/edit',
                element: <ProjectForm />,
              },
              {
                path: '/teams',
                element: <MyTeams />,
              },
              {
                path: '/teams/:id',
                element: <TeamWorkspace />,
              },
              {
                path: '/requests',
                element: <Requests />,
              },
              {
                path: '/notifications',
                element: <Notifications />,
              },
              {
                path: '/ratings/:projectId',
                element: <RateTeammates />,
              },
              // Admin only routes
              {
                element: <AdminRoute />,
                children: [
                  {
                    path: '/admin/*',
                    element: <AdminDashboard />,
                  },
                ],
              },
            ],
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
