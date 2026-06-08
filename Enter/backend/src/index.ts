import express from 'express';
import cors from 'cors';
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

const app = express();

// ─── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  env.FRONTEND_URL,                    // from env (trailing slash already stripped)
  'http://localhost:3000',             // local dev
  'http://localhost:3001',
].filter(Boolean).map((o) => o.replace(/\/$/, '')); // normalize all

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (e.g. Postman, server-to-server)
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalized)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin} | allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
}));
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
  });
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

  const httpServer = createServer(app);
  initializeSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`DQMS Server running on port ${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`Frontend URL: ${env.FRONTEND_URL}`);
  });
}

start();
