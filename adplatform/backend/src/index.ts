import express from 'express'; // nodemon restart trigger
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import router from './routes';
import { startBookingLifecycleCron } from './cron/bookingLifecycle';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Raw body for Paystack webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON body parser for everything else (larger limit for base64 uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Serve uploaded files ──────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', router);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  platform: 'Studio Arella — Bems Screens',
  timestamp: new Date().toISOString(),
}));

app.listen(PORT, () => {
  console.log(`\n🟠 Studio Arella Backend running on port ${PORT}`);
  console.log(`   Platform: Bems Screens — Bems Junction, Umuahia`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  startBookingLifecycleCron();
});

export default app;
