const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

pool.query(`
  SELECT id, name, email, role, created_at, email_verified
  FROM users
  WHERE role = 'admin'
  ORDER BY created_at ASC
`).then(r => {
  if (r.rows.length === 0) {
    console.log('❌ No admin users found in the database.');
  } else {
    console.log('✅ Admin users found:');
    r.rows.forEach(u => console.log(JSON.stringify(u, null, 2)));
  }
  pool.end();
}).catch(e => { console.error('❌', e.message); pool.end(); });
