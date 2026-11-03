
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './modules/auth/auth.routes';

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
// MIDDLEWARE
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
// HEALTH CHECK
// --------------------------------------

app.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({
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
api.use('/auth', authRoutes);

app.use('/api/v1', api);

// Unknown API routes should return JSON; other paths are handled by the frontend.
app.use('/api', (req: Request, res: Response) => {
  return res.status(404).json({
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
    err: Error & { status?: number },
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error('Global Error:', err);

    if (err.message.startsWith('CORS blocked')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CORS_ERROR',
          message: err.message,
        },
      });
    }

    const statusCode = err.status || 500;

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
