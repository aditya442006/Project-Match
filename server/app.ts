import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import skillsRoutes from './modules/skills/skills.routes';
import projectsRoutes from './modules/projects/projects.routes';
import teamsRoutes from './modules/teams/teams.routes';
import requestsRoutes from './modules/requests/requests.routes';
import matchingRoutes from './modules/matching/matching.routes';
import chatRoutes from './modules/chat/chat.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import { teamTasksRouter, directTasksRouter } from './modules/tasks/tasks.routes';
import ratingsRoutes from './modules/ratings/ratings.routes';
import adminRoutes from './modules/admin/admin.routes';

export const app = express();

app.set('trust proxy', 1);

const allowedOrigins = (
  process.env.CLIENT_URL ||
  'https://project-match-gilt.vercel.app,http://localhost:3000,http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, !origin || allowedOrigins.includes(origin));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'projectmatch-api', timestamp: new Date().toISOString() });
});

// Mount /api/v1 Domain Routes
const api = express.Router();

api.use('/auth', authRoutes);
api.use('/users', usersRoutes);
api.use('/skills', skillsRoutes);
api.use('/projects', projectsRoutes);
api.use('/teams', teamsRoutes);
api.use('/teams', teamTasksRouter);
api.use('/tasks', directTasksRouter);
api.use('/requests', requestsRoutes);
api.use('/matching', matchingRoutes);
api.use('/conversations', chatRoutes);
api.use('/notifications', notificationsRoutes);
api.use('/ratings', ratingsRoutes);
api.use('/admin', adminRoutes);

app.use('/api/v1', api);

// Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err);
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred.',
      details: err.details,
    },
  });
});
