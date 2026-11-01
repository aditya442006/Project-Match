
import 'dotenv/config';

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from './server/app';
import { initSockets } from './server/sockets';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const httpServer = http.createServer(app);

  // Initialize Socket.IO on the same HTTP server
  initSockets(httpServer);

  if (!isProduction) {
    // Development: run Vite middleware
    const { createServer: createViteServer } = await import('vite');

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production: serve the built React frontend
    const express = (await import('express')).default;
    const distPath = path.resolve(__dirname, 'dist');

    app.use(express.static(distPath));

    // React Router fallback
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }

      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[ProjectMatch Server] Running on port ${PORT} in ${
        isProduction ? 'production' : 'development'
      } mode`
    );

    console.log('[ProjectMatch API] Available at /api/v1/*');
    console.log('[ProjectMatch Sockets] Socket.IO gateway active');
  });
}

startServer().catch((error) => {
  console.error('[Fatal Server Startup Error]:', error);
  process.exit(1);
});
