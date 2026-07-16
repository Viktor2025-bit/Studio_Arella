/**
 * Migration: Add missing columns to production users table
 * Run: node scripts/migrate_prod_users.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running production users table migration...');

    const migrations = [
      { col: 'first_name',     sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255)` },
      { col: 'last_name',      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)` },
      { col: 'avatar',         sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500)` },
      { col: 'google_id',      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)` },
      { col: 'language',       sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en'` },
      { col: 'terms_accepted', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false` },
      { col: 'has_seen_tour',  sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS has_seen_tour BOOLEAN DEFAULT false` },
      { col: 'business_name',  sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(255)` },
      { col: 'phone',          sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)` },
      { col: 'email_verified', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false` },
    ];

    for (const m of migrations) {
      await client.query(m.sql);
      console.log(`  ✅ Column "${m.col}" ensured`);
    }

    // Backfill first_name/last_name from existing "name" column where null
    await client.query(`
      UPDATE users
      SET
        first_name = TRIM(SPLIT_PART(name, ' ', 1)),
        last_name  = TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
      WHERE first_name IS NULL AND name IS NOT NULL AND name != ''
    `);
    console.log('  ✅ Backfilled first_name/last_name from name column');

    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
