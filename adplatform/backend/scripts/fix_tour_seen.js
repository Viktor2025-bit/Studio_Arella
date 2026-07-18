const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

pool.query(`
  UPDATE users SET has_seen_tour = true
  WHERE id IN (
    SELECT DISTINCT user_id FROM bookings
    UNION
    SELECT DISTINCT user_id FROM podcast_bookings
  )
  RETURNING email
`).then(r => {
  console.log('✅ Fixed', r.rows.length, 'active users:');
  r.rows.forEach(u => console.log(' -', u.email));
  pool.end();
}).catch(e => { console.error('❌', e.message); pool.end(); });
