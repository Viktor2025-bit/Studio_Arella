const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Krav20%23pool@localhost:5432/adplatform' });

async function check() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'podcast_bookings'");
    console.log(res.rows.map(r => r.column_name));
  } catch(e) {
    console.error(e);
  }
  pool.end();
}
check();
