const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Krav20%23pool@localhost:5432/adplatform' });

async function fixBookings() {
  try {
    const res = await pool.query(`
      WITH slot_aggs AS (
        SELECT 
          booking_id, 
          MIN(start_time) as min_start, 
          MAX(end_time) as max_end,
          SUM(EXTRACT(EPOCH FROM (end_time - start_time))) as total_secs
        FROM booking_slots
        GROUP BY booking_id
      )
      UPDATE bookings b
      SET 
        start_time = COALESCE(b.start_time, s.min_start),
        end_time = COALESCE(b.end_time, s.max_end),
        cost_per_sec = CASE WHEN s.total_secs > 0 THEN b.total_cost / s.total_secs ELSE b.cost_per_sec END,
        interval_seconds = COALESCE((SELECT duration_seconds FROM ads WHERE id = b.ad_id LIMIT 1), 60)
      FROM slot_aggs s
      WHERE b.id = s.booking_id AND b.start_time IS NULL;
    `);
    console.log('Updated rows:', res.rowCount);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}
fixBookings();
