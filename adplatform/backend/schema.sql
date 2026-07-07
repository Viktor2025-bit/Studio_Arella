-- AdPlatform Database Schema
-- Run this file to set up your PostgreSQL database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT '',
  avatar VARCHAR(500),
  google_id VARCHAR(255),
  role VARCHAR(50) DEFAULT 'advertiser', -- 'advertiser' | 'admin'
  credits DECIMAL(10,2) DEFAULT 0.00,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft' | 'active' | 'paused' | 'ended'
  budget DECIMAL(10,2) DEFAULT 0.00,
  spent DECIMAL(10,2) DEFAULT 0.00,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Screens / Listings table
CREATE TABLE IF NOT EXISTS screens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(500),
  type VARCHAR(100), -- 'billboard' | 'digital' | 'indoor' | 'outdoor'
  size VARCHAR(100),
  price_per_sec DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'active', -- 'active' | 'inactive' | 'maintenance'
  impressions_per_day INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  media_url VARCHAR(500),
  media_type VARCHAR(50) DEFAULT 'image', -- 'image' | 'video'
  duration_seconds INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'active'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  screen_id UUID REFERENCES screens(id) ON DELETE SET NULL,
  screen_count INTEGER DEFAULT 1,
  impressions INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  interval_seconds INTEGER DEFAULT 5,
  cost_per_sec DECIMAL(10,2) DEFAULT 0.00,
  total_cost DECIMAL(10,2) DEFAULT 0.00,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active', -- 'active' | 'paused' | 'ended' | 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions / Credits table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'credit' | 'debit' | 'refund'
  source VARCHAR(100), -- 'sales' | 'referral' | 'top_up' | 'booking'
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(500),
  reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics / Impressions log
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  impressions INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  hour INTEGER DEFAULT 0, -- 0-23
  created_at TIMESTAMP DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'completed'
  reward DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_screens_updated_at BEFORE UPDATE ON screens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed sample data (optional)
INSERT INTO users (name, email, password, role, credits) VALUES
  ('Admin User', 'admin@adplatform.com', '$2a$10$placeholder_hashed_password', 'admin', 5000.00)
ON CONFLICT (email) DO NOTHING;

-- Migration: add google_id column if it doesn't exist (run this if you already created the DB)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
-- ALTER TABLE users ALTER COLUMN password SET DEFAULT '';

-- ─── Pricing Plans Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description VARCHAR(500),
  popular BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Seed: Studio Arella Screen at Bems Junction ────────────────────────────
INSERT INTO screens (
  id, name, location, type, size, price_per_sec,
  impressions_per_day, status, owner_id
)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'Studio Arella Screen — Bems Junction',
  'Bems Junction, Finbars by Bende Road, Umuahia, Abia State',
  'digital',
  '10ft x 6ft LED Display',
  16.67,   -- ₦1,000 per minute = ₦16.67 per second
  15000,
  'active',
  id
FROM users WHERE role = 'admin' LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- ─── Seed: Pricing Plans ────────────────────────────────────────────────────
INSERT INTO pricing_plans (name, duration_minutes, price, description, popular) VALUES
  ('Starter',    1,   1000.00,  '1-minute slot — great for a quick announcement or promo',     false),
  ('Standard',   5,   4500.00,  '5-minute slot — ideal for a short brand awareness campaign',  false),
  ('Popular',   10,   8000.00,  '10-minute slot — best value for regular advertisers',         true),
  ('Business',  30,  20000.00,  '30-minute slot — heavy daily visibility for your business',   false),
  ('Premium',   60,  35000.00,  '1-hour slot — maximum screen presence for major campaigns',   false),
  ('Daily',    480,  80000.00,  '8-hour day package — own the screen for the entire business day', false)
ON CONFLICT DO NOTHING;

-- ─── Creative Requests Table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creative_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  ad_type VARCHAR(50) DEFAULT 'image',
  description TEXT NOT NULL,
  target_audience TEXT,
  preferred_dates TEXT,
  budget_range VARCHAR(100),
  reference_links TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending | in_progress | completed | cancelled
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_creative_requests_updated_at
  BEFORE UPDATE ON creative_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Email Verification Tokens ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Password Reset Tokens ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Update users table ───────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- ─── Update ads/creatives table ───────────────────────────────────────────────
ALTER TABLE ads ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS file_type VARCHAR(20); -- 'video' | 'image' | 'gif'
ALTER TABLE ads ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS resolution VARCHAR(20);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- ─── Slot blocks (admin can block time slots) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS slot_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  reason VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Proof of play logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playback_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  screen_id UUID REFERENCES screens(id),
  creative_id UUID REFERENCES ads(id),
  scheduled_start TIMESTAMP,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  duration_played_seconds INTEGER DEFAULT 0,
  completion_status VARCHAR(30) DEFAULT 'pending', -- completed|interrupted|skipped|pending
  interruption_count INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- ─── Audit log ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id),
  admin_name VARCHAR(255),
  action_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(100),
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Platform settings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO platform_settings (key, value) VALUES
  ('price_per_minute', '1000'),
  ('min_duration_minutes', '1'),
  ('max_duration_minutes', '60'),
  ('max_file_size_mb', '500'),
  ('allowed_video_formats', 'mp4,mov'),
  ('allowed_image_formats', 'jpg,jpeg,png,gif'),
  ('booking_cancellation_hours', '48')
ON CONFLICT (key) DO NOTHING;

-- ─── Invoices ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  advertiser_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Update bookings status options ──────────────────────────────────────────
-- Add cancellation fields
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_reference VARCHAR(100);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(60) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  link VARCHAR(255),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(user_id, read);

-- ─── Podcast Bookings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS podcast_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_type VARCHAR(50) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL,
  addons JSONB DEFAULT '[]'::jsonb,
  base_cost DECIMAL(10,2) DEFAULT 0.00,
  addons_cost DECIMAL(10,2) DEFAULT 0.00,
  total_cost DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS podcast_bookings_user_idx ON podcast_bookings(user_id);
CREATE INDEX IF NOT EXISTS podcast_bookings_status_idx ON podcast_bookings(status);
CREATE INDEX IF NOT EXISTS podcast_bookings_date_idx ON podcast_bookings(start_time, end_time);
