import express from 'express';
import path from 'path';
import { whatsAppRouter } from './server/routes/whatsapp-routes.js';
import { whatsAppManager } from './server/services/whatsapp-manager.js';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// API Routes
app.use('/api/whatsapp', whatsAppRouter);

// Initialize WhatsApp connection manager (checks for reconnecting saved lines)
whatsAppManager.init().catch((err) => {
  console.error('[Server] Failed to initialize WhatsApp Connection Manager:', err);
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`[Silláge Server] Running on http://0.0.0.0:${port} (${isProduction ? 'production' : 'development'})`);
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('[Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
