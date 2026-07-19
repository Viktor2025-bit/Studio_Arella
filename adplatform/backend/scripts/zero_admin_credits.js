const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

pool.query(`UPDATE users SET credits = 0 WHERE role = 'admin' RETURNING email, credits`)
  .then(r => {
    console.log('✅ Admin credits zeroed:');
    r.rows.forEach(u => console.log(' -', u.email, '→ credits:', u.credits));
    pool.end();
  })
  .catch(e => { console.error('❌', e.message); pool.end(); });
