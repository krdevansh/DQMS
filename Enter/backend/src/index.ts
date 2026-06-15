import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initializeSocket } from './socket';
import { errorHandler } from './utils/errors';
import { rateLimit } from './middleware/rateLimit';

import authRoutes from './routes/auth';
import salonRoutes from './routes/salons';
import queueRoutes from './routes/queue';
import bookingRoutes from './routes/bookings';
import adminRoutes from './routes/admin';
import hospitalRoutes from './routes/hospitals';
import schoolRoutes from './routes/schools';
import patientRoutes from './routes/patients';
import notificationRoutes from './routes/notifications';
import analyticsRoutes from './routes/analytics';
import walletRoutes from './routes/wallet';
import uploadRoutes from './routes/upload';
import subscriptionRoutes from './routes/subscriptions';
import { startSubscriptionExpiryCheck } from './cron/checkSubscriptionExpiry';
import { startTicketCounterReset } from './cron/resetTicketCounter';
import { initWhatsApp, isClientReady, getQr } from './services/whatsapp';

const app = express();

// ─── CORS (manual — more reliable than cors npm pkg for credentials + function origin) ───
const ALLOWED_ORIGINS = [
  env.FRONTEND_URL,          // e.g. https://dqms-project.vercel.app
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean).map((o) => o.replace(/\/$/, ''));

console.log('[CORS] Allowed origins:', ALLOWED_ORIGINS);

app.use((req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin as string | undefined;
  const normalized = origin ? origin.replace(/\/$/, '') : '';

  if (!origin || ALLOWED_ORIGINS.includes(normalized)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  } else {
    console.warn(`[CORS] Blocked: ${origin} | Allowed: ${ALLOWED_ORIGINS}`);
    res.status(403).json({ error: 'CORS: origin not allowed' });
  }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit(200, 60000)); // 200 requests per minute

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    whatsapp: {
      ready: isClientReady(),
    },
  });
});

app.get('/api/whatsapp-qr', (_req, res) => {
  const qr = getQr();
  if (isClientReady()) {
    res.send(`<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#111;color:#fff"><h2>✅ WhatsApp is already connected</h2></body></html>`);
  } else if (qr) {
    res.send(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#111;color:#fff"><h2 style="margin-bottom:20px">Scan this QR with WhatsApp</h2><p style="margin-bottom:20px;color:#888">Open WhatsApp → Menu → Linked Devices → Link a Device</p><img src="${qr}" style="width:300px;height:300px;border-radius:12px"/></body></html>`);
  } else {
    res.send(`<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#111;color:#fff"><h2>⏳ QR code not yet generated. Refresh in a moment...</h2></body></html>`);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/salons', salonRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Error handler
app.use(errorHandler);

// Start server
async function start() {
  await connectDB();

  // Start background jobs
  startSubscriptionExpiryCheck();
  startTicketCounterReset();

  initWhatsApp();

  const httpServer = createServer(app);
  initializeSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`DQMS Server running on port ${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`Frontend URL: ${env.FRONTEND_URL}`);
  });
}

start();
