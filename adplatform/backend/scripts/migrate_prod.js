const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://adplatform_db_user:fGj8JTmdOGiKGwFBQfhThXi3WAZqEr1P@dpg-d96na3uq1p3s73d2dqq0-a.oregon-postgres.render.com/adplatform_db',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    // 1. Add ppm_rate column to ads table
    await pool.query('ALTER TABLE ads ADD COLUMN IF NOT EXISTS ppm_rate DECIMAL(10,2) DEFAULT 1000;');
    console.log('Added ppm_rate to ads');

    // 2. Fix the historical booking costs
    const res = await pool.query(`
      UPDATE bookings 
      SET total_cost = CEIL(interval_seconds::numeric / 60.0) * 1000 
      WHERE total_cost < CEIL(interval_seconds::numeric / 60.0) * 1000
        AND interval_seconds IS NOT NULL
        AND interval_seconds > 0;
    `);
    console.log(`Updated ${res.rowCount} bookings to their correct total_cost.`);

    console.log("Migration successful");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
