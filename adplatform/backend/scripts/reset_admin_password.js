const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const NEW_PASSWORD = 'StudioArella@Admin2026';

bcrypt.hash(NEW_PASSWORD, 12).then(hashed => {
  return pool.query(
    `UPDATE users SET password = $1, email_verified = true WHERE email = 'admin@adplatform.com' RETURNING email, role`,
    [hashed]
  );
}).then(r => {
  console.log('✅ Admin password reset successfully!');
  console.log('');
  console.log('  📧 Email   :', 'admin@adplatform.com');
  console.log('  🔑 Password:', NEW_PASSWORD);
  console.log('  👤 Role    :', r.rows[0].role);
  console.log('');
  console.log('⚠️  Change this password after logging in!');
  pool.end();
}).catch(e => { console.error('❌', e.message); pool.end(); });
