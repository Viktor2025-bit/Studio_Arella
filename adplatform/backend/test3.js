const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Krav20%23pool@localhost:5432/adplatform' });

async function test() {
  try {
    const r1 = await pool.query(
      `SELECT 
        (SELECT COALESCE(SUM(total_cost), 0) FROM bookings WHERE user_id = $1 AND status != 'cancelled') +
        (SELECT COALESCE(SUM(total_cost), 0) FROM podcast_bookings WHERE user_id = $1 AND status != 'cancelled') 
       AS total`,
      ['c12140e6-a078-43d9-aefb-b8957ba4b3cb']
    );
    console.log('Query 1 success', r1.rows);
  } catch (e) {
    console.error('Query 1 error:', e.message);
  }
  pool.end();
}
test();
