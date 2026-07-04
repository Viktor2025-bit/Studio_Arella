const pool = require('./backend/src/db/pool').default;

async function test() {
  try {
    const userId = '16a3c617-6ff4-4687-8fb6-d71c4c1613d8'; // We'll query the first advertiser id.
    const res = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['advertiser']);
    const id = res.rows[0].id;
    
    console.log("Advertiser ID:", id);
    
    const [revenueRes, campaignRes, screenRes, analyticsRes] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(total_cost), 0) as total FROM bookings WHERE user_id = $1 AND status != 'cancelled'`,
        [id]
      ),
      pool.query(`SELECT COUNT(*) FROM campaigns WHERE user_id = $1 AND status = 'active'`, [id]),
      pool.query(`SELECT COUNT(*) FROM screens WHERE owner_id = $1 AND status = 'active'`, [id]),
      pool.query(
        `SELECT date_trunc('hour', created_at) as hour, SUM(impressions) as impressions
         FROM analytics WHERE user_id = $1 AND date = CURRENT_DATE
         GROUP BY hour ORDER BY hour`,
        [id]
      ),
    ]);
    console.log("Success");
  } catch (e) {
    console.log("Error in dashboard stats:", e.message);
  }
  
  try {
    const res = await pool.query(`SELECT hour, SUM(impressions) as impressions, SUM(views) as views, SUM(clicks) as clicks
      FROM analytics WHERE user_id = $1 AND date = CURRENT_DATE GROUP BY hour ORDER BY hour`, [1]);
    console.log("Success hourly");
  } catch(e) {
     console.log("Error in hourly analytics:", e.message);
  }
  process.exit(0);
}
test();
