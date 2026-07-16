/**
 * Quick check: verify all expected tables exist in prod
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const client = await pool.connect();
  try {
    const expected = [
      'users','email_verification_tokens','password_reset_tokens',
      'campaigns','screens','bookings','booking_slots',
      'ads','invoices','transactions','notifications',
      'podcast_bookings','creative_requests'
    ];

    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    const existing = rows.map(r => r.table_name);

    console.log('\n📋 Tables in production DB:');
    for (const t of expected) {
      console.log(`  ${existing.includes(t) ? '✅' : '❌ MISSING'} ${t}`);
    }
    console.log('\nExtra tables:', existing.filter(t => !expected.includes(t)).join(', ') || 'none');
  } finally {
    client.release();
    await pool.end();
  }
}
check();
