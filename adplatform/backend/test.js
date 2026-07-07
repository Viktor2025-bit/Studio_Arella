const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Krav20%23pool@localhost:5432/adplatform' });

async function test() {
  try {
    const r1 = await pool.query(`SELECT 
        (SELECT COALESCE(SUM(total_cost), 0) FROM bookings WHERE user_id = 'c12140e6-a078-43d9-aefb-b8957ba4b3cb' AND status != 'cancelled') +
        (SELECT COALESCE(SUM(total_cost), 0) FROM podcast_bookings WHERE user_id = 'c12140e6-a078-43d9-aefb-b8957ba4b3cb' AND status != 'cancelled') 
       AS total`);
    console.log('Query 1 success', r1.rows);
  } catch (e) {
    console.error('Query 1 error:', e.message);
  }
  
  try {
    const r2 = await pool.query(`SELECT start_time, end_time, status 
       FROM podcast_bookings 
       WHERE start_time >= '2025-01-01' AND end_time <= '2026-01-01' 
       AND (status IN ('confirmed', 'completed') OR (status = 'pending' AND created_at >= NOW() - INTERVAL '5 minutes'))`);
    console.log('Query 2 success', r2.rows);
  } catch(e) {
    console.error('Query 2 error:', e.message);
  }
  pool.end();
}
test();
