const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Krav20%23pool@localhost:5432/adplatform'
});

async function test() {
  const client = await pool.connect();
  try {
    const userRes = await client.query("SELECT id FROM users WHERE email='advertiser1@example.com'");
    const userId = userRes.rows[0].id;

    // Test dashboard stats
    try {
      const stats = await client.query(`
        SELECT 
          (SELECT COALESCE(SUM(total_cost), 0) FROM bookings WHERE user_id = $1 AND status != 'cancelled') as total_revenue,
          (SELECT COUNT(*) FROM campaigns WHERE user_id = $1 AND status = 'active') as active_campaigns,
          (SELECT COUNT(*) FROM bookings WHERE user_id = $1 AND status = 'active') as active_screens
      `, [userId]);
      console.log('Dashboard stats ok');
    } catch(e) { console.error('Stats error:', e); }

    // Test hourly analytics
    try {
      const chart = await client.query(`
        SELECT hour, COALESCE(SUM(impressions), 0) as impressions
        FROM analytics 
        WHERE user_id = $1 AND date = CURRENT_DATE
        GROUP BY hour ORDER BY hour ASC
      `, [userId]);
      console.log('Hourly analytics ok');
    } catch(e) { console.error('Hourly error:', e); }

    // Test bookings
    try {
      const bookings = await client.query(`
        SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 6
      `, [userId]);
      console.log('Bookings ok');
    } catch(e) { console.error('Bookings error:', e); }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

test();
