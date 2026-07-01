import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seedAdmin() {
  const email = 'admin@adplatform.com';
  const plainPassword = 'Admin@1234'; // Change this to your preferred password
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  try {
    await pool.query(
      `UPDATE users SET password = $1 WHERE email = $2`,
      [hashedPassword, email]
    );
    console.log(`✅ Admin password updated successfully!`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${plainPassword}`);
    console.log(`   ⚠️  Change this password after your first login!`);
  } catch (err) {
    console.error('❌ Failed to seed admin:', err);
  } finally {
    await pool.end();
  }
}

seedAdmin();
