import 'dotenv/config'; // MUST be at the top before other imports that use process.env
import express from 'express'; // nodemon restart trigger 2
import cors from 'cors';
import path from 'path';
import router from './routes';
import { startBookingLifecycleCron } from './cron/bookingLifecycle';

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

import pool from './db/pool';

app.listen(PORT, async () => {
  console.log(`\n🟠 Studio Arella Backend running on port ${PORT}`);
  console.log(`   Platform: Bems Screens — Bems Junction, Umuahia`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  
  // HOTFIX: Ensure booking_slots table exists in production database
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS booking_slots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
        screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        status VARCHAR(50) DEFAULT 'locked',
        locked_until TIMESTAMPTZ,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ booking_slots table verified');
  } catch (err) {
    console.error('❌ Failed to create booking_slots table:', err);
  }

  startBookingLifecycleCron();
});

export default app;
