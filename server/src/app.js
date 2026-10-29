import express from 'express';
import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { root } from './config.js';
import path from 'node:path';
import { authRouter, optionalAuth } from './auth.js';
import { errorHandler } from './http.js';
import { listingsRouter } from './routes/listings.js';
import { ordersRouter } from './routes/orders.js';
import { uploadsRouter } from './routes/uploads.js';
import { chatRouter, notificationsRouter } from './routes/chat.js';
import { statsRouter, leaderboardRouter, certificatesRouter } from './routes/impact.js';
import { ngosRouter, usersRouter, demandsRouter, reportsRouter } from './routes/community.js';
import { adminRouter } from './routes/admin.js';
export function createApp(databaseMode) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.origins, credentials: true, methods: ['GET','POST','PATCH','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/seed-assets',express.static(path.join(root,'server','seed-assets')));
  app.get('/', (_req, res) => res.json({
    app: 'ShareBite', version, databaseMode,
    message: 'Welcome to the ShareBite API. Open http://localhost:5173 for the app.',
    links: { health: '/api/health' },
  }));
  app.get('/api/health', (_req, res) => {
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ok' : 'unavailable', app: 'ShareBite', version,
      databaseMode, databaseConnected: ready, demo: config.demo,
    });
  });
  app.use('/api', optionalAuth);
  app.use('/api/auth', authRouter);
  app.use('/api/listings', listingsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/uploads', uploadsRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/stats',statsRouter);
  app.use('/api/leaderboard',leaderboardRouter);
  app.use('/api/certificates',certificatesRouter);
  app.use('/api/ngos',ngosRouter);
  app.use('/api/users',usersRouter);
  app.use('/api/demands',demandsRouter);
  app.use('/api/reports',reportsRouter);
  app.use('/api/admin',adminRouter);
  app.use('/api', (_req, res) => res.status(404).json({ message: 'This endpoint does not exist.' }));
  app.use(errorHandler);
  return app;
}
