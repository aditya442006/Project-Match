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

  // Initialize real-time Socket.IO gateway on the same HTTP server
  initSockets(httpServer);

  if (!isProduction) {
    // Mount Vite dev server middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const express = (await import('express')).default;
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[ProjectMatch Server] Running at http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
    console.log(`[ProjectMatch API] REST endpoints available at /api/v1/*`);
    console.log(`[ProjectMatch Sockets] Socket.IO gateway active on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Server Startup Error]:', err);
  process.exit(1);
});
