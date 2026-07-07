require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function setupAdmin() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    
    // The seed data already created admin@adplatform.com with a fake hash. We just need to update it.
    const result = await pool.query(
      "UPDATE users SET password = $1 WHERE email = 'admin@adplatform.com'",
      [hash]
    );

    if (result.rowCount === 0) {
      // If for some reason it wasn't inserted by seed, insert it
      await pool.query(
        "INSERT INTO users (name, email, password, role, credits) VALUES ('Admin User', 'admin@adplatform.com', $1, 'admin', 5000.00)",
        [hash]
      );
    }
    
    console.log('✅ Admin account configured successfully!');
    console.log('📧 Email: admin@adplatform.com');
    console.log('🔑 Password: admin123');
  } catch (err) {
    console.error('❌ Error configuring admin:', err);
  } finally {
    pool.end();
  }
}

setupAdmin();
