
import express, {
  Request,
  Response,
  NextFunction,
} from 'express';

import cors from 'cors';
import cookieParser from 'cookie-parser';

// Authentication
import authRoutes from './modules/auth/auth.routes';

// User and skill modules
import usersRoutes from './modules/users/users.routes';
import skillsRoutes from './modules/skills/skills.routes';

// Project and team modules
import projectsRoutes from './modules/projects/projects.routes';
import teamsRoutes from './modules/teams/teams.routes';

// Request and matching modules
import requestsRoutes from './modules/requests/requests.routes';
import matchingRoutes from './modules/matching/matching.routes';

// Communication modules
import chatRoutes from './modules/chat/chat.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';

// Task modules
import {
  teamTasksRouter,
  directTasksRouter,
} from './modules/tasks/tasks.routes';

// Rating and admin modules
import ratingsRoutes from './modules/ratings/ratings.routes';
import adminRoutes from './modules/admin/admin.routes';

// --------------------------------------------------
// EXPRESS APPLICATION
// --------------------------------------------------

export const app = express();

app.set('trust proxy', 1);

// --------------------------------------------------
// CORS CONFIGURATION
// --------------------------------------------------

const defaultOrigins = [
  'https://project-match-gilt.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

const allowedOrigins = (
  process.env.CLIENT_URL || defaultOrigins.join(',')
)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as health checks.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn('[CORS Blocked]:', origin);

      return callback(
        new Error('Origin not allowed by CORS')
      );
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
    ],
  })
);

// --------------------------------------------------
// BODY AND COOKIE MIDDLEWARE
// --------------------------------------------------

app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

app.use(cookieParser());

// --------------------------------------------------
// HEALTH CHECK
// GET /health
// --------------------------------------------------

app.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    ok: true,
    service: 'projectmatch-api',
    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------------------
// API ROUTES
// Base URL: /api/v1
// --------------------------------------------------

const api = express.Router();

// Authentication
api.use('/auth', authRoutes);

// Users and skills
api.use('/users', usersRoutes);
api.use('/skills', skillsRoutes);

// Projects and teams
api.use('/projects', projectsRoutes);
api.use('/teams', teamsRoutes);

// Team tasks and direct tasks
api.use('/teams', teamTasksRouter);
api.use('/tasks', directTasksRouter);

// Requests and matching
api.use('/requests', requestsRoutes);
api.use('/matching', matchingRoutes);

// Chat and notifications
api.use('/conversations', chatRoutes);
api.use('/notifications', notificationsRoutes);

// Ratings and administration
api.use('/ratings', ratingsRoutes);
api.use('/admin', adminRoutes);

// Mount all API routes.
app.use('/api/v1', api);

// --------------------------------------------------
// 404 HANDLER
// --------------------------------------------------

app.use(
  (req: Request, res: Response) => {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route not found: ${req.method} ${req.originalUrl}`,
      },
    });
  }
);

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use(
  (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error('[API Error]:', err);

    // CORS errors
    if (err.message === 'Origin not allowed by CORS') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CORS_ERROR',
          message: 'This origin is not allowed to access the API.',
        },
      });
    }

    const status =
      typeof err.status === 'number' &&
      err.status >= 400 &&
      err.status <= 599
        ? err.status
        : 500;

    return res.status(status).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message:
          status === 500
            ? 'An unexpected server error occurred.'
            : err.message || 'An unexpected error occurred.',
        details:
          status === 500 ? undefined : err.details,
      },
    });
  }
);
