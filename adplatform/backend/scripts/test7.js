const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Krav20%23pool@localhost:5432/adplatform' });

async function migrate() {
  try {
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255)');
    console.log('Migration successful');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}
migrate();
