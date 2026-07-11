require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT b.id, b.interval_seconds, a.ppm_rate 
      FROM bookings b
      LEFT JOIN ads a ON b.ad_id = a.id
      WHERE b.interval_seconds IS NOT NULL
    `);
    
    let updatedCount = 0;
    for (const row of res.rows) {
      const ppmRate = row.ppm_rate || 1000;
      const totalCost = Math.ceil(row.interval_seconds / 60) * ppmRate;
      const costPerSec = row.interval_seconds > 0 ? totalCost / row.interval_seconds : 0;
      
      await client.query(`
        UPDATE bookings
        SET total_cost = $1, cost_per_sec = $2
        WHERE id = $3
      `, [totalCost, costPerSec, row.id]);
      updatedCount++;
    }
    
    console.log(`Updated ${updatedCount} bookings with correct costs.`);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
