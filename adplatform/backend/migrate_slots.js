const { Client } = require('pg');
require('dotenv').config();

const client = new Client('postgresql://postgres:Krav20%23pool@localhost:5432/adplatform');

async function migrate() {
  await client.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Create booking_slots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS booking_slots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
        screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'locked', -- 'locked', 'active', 'played', 'released'
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // 2. We don't drop start_time/end_time from bookings yet to avoid breaking everything immediately,
    // but we can make them nullable.
    await client.query(`
      ALTER TABLE bookings ALTER COLUMN start_time DROP NOT NULL;
      ALTER TABLE bookings ALTER COLUMN end_time DROP NOT NULL;
    `);

    // 3. Migrate existing bookings to booking_slots if they have a start_time
    await client.query(`
      INSERT INTO booking_slots (booking_id, screen_id, start_time, end_time, status)
      SELECT id, screen_id, start_time, end_time, 'active'
      FROM bookings
      WHERE start_time IS NOT NULL AND end_time IS NOT NULL
      ON CONFLICT DO NOTHING;
    `);

    // 4. Trigger for booking_slots updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_booking_slots_updated_at ON booking_slots;
      CREATE TRIGGER update_booking_slots_updated_at 
      BEFORE UPDATE ON booking_slots 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query('COMMIT');
    console.log('Migration successful');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
