
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Import all routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import skillsRoutes from './modules/skills/skills.routes';
import projectsRoutes from './modules/projects/projects.routes';
import teamsRoutes from './modules/teams/teams.routes';
import teamTasksRouter from './modules/tasks/teamTasks.routes';
import directTasksRouter from './modules/tasks/tasks.routes';
import requestsRoutes from './modules/requests/requests.routes';
import matchingRoutes from './modules/matching/matching.routes';
import chatRoutes from './modules/chat/chat.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import ratingsRoutes from './modules/ratings/ratings.routes';
import adminRoutes from './modules/admin/admin.routes';

export const app = express();

app.set('trust proxy', 1);

// --------------------------------------
// CORS CONFIGURATION
// --------------------------------------

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
      // Allow requests without an Origin header
      // (for example, health checks and server-to-server requests)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked this origin: ${origin}`)
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
    ],
  })
);

// --------------------------------------
// BODY PARSING AND COOKIES
// --------------------------------------

app.use(express.json({ limit: '10mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

app.use(cookieParser());

// --------------------------------------
// ROOT ROUTE
// --------------------------------------

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Project-Match API is running 🚀',
    version: '1.0.0',
    health: '/health',
    api: '/api/v1',
  });
});

// --------------------------------------
// HEALTH CHECK
// --------------------------------------

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'Project-Match backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// --------------------------------------
// API ROUTES
// --------------------------------------

const api = express.Router();

// Authentication
api.use('/auth', authRoutes);

// Users
api.use('/users', usersRoutes);

// Skills
api.use('/skills', skillsRoutes);

// Projects
api.use('/projects', projectsRoutes);

// Teams
api.use('/teams', teamsRoutes);

// Team tasks
api.use('/teams', teamTasksRouter);

// Direct tasks
api.use('/tasks', directTasksRouter);

// Requests
api.use('/requests', requestsRoutes);

// Matching
api.use('/matching', matchingRoutes);

// Conversations / Chat
api.use('/conversations', chatRoutes);

// Notifications
api.use('/notifications', notificationsRoutes);

// Ratings
api.use('/ratings', ratingsRoutes);

// Admin
api.use('/admin', adminRoutes);

// Mount all API routes
app.use('/api/v1', api);

// --------------------------------------
// 404 ROUTE HANDLER
// --------------------------------------

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
});

// --------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------

app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error('Global Error:', err);

    // CORS error
    if (err.message.startsWith('CORS blocked')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CORS_ERROR',
          message: err.message,
        },
      });
    }

    const statusCode =
      (err as Error & { status?: number }).status || 500;

    return res.status(statusCode).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          statusCode >= 500
            ? 'Internal server error'
            : err.message,
      },
    });
  }
);

export default app;
