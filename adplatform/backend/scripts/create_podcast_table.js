require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function run() {
  try {
    await pool.query(`
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
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS podcast_bookings_user_idx ON podcast_bookings(user_id);
      CREATE INDEX IF NOT EXISTS podcast_bookings_status_idx ON podcast_bookings(status);
      CREATE INDEX IF NOT EXISTS podcast_bookings_date_idx ON podcast_bookings(start_time, end_time);
    `);
    console.log('Successfully created podcast_bookings table');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    pool.end();
  }
}
run();
