require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/adplatform' });

async function fix() {
  try {
    const queries = [
      "ALTER TABLE bookings ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC'",
      "ALTER TABLE bookings ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC'",
      "ALTER TABLE booking_slots ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC'",
      "ALTER TABLE booking_slots ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC'",
      "ALTER TABLE slot_blocks ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC'",
      "ALTER TABLE slot_blocks ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC'",
      "ALTER TABLE podcast_bookings ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC'",
      "ALTER TABLE podcast_bookings ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC'"
    ];
    for (const q of queries) {
      console.log('Running:', q);
      await pool.query(q);
    }
    console.log('Successfully altered columns to TIMESTAMPTZ');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

fix();
