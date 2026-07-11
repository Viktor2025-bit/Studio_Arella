const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://adplatform_db_user:fGj8JTmdOGiKGwFBQfhThXi3WAZqEr1P@dpg-d96na3uq1p3s73d2dqq0-a.oregon-postgres.render.com/adplatform_db',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Adding has_seen_tour to users table...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS has_seen_tour BOOLEAN DEFAULT false;');
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
