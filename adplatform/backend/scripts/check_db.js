const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://adplatform_db_user:fGj8JTmdOGiKGwFBQfhThXi3WAZqEr1P@dpg-d96na3uq1p3s73d2dqq0-a.oregon-postgres.render.com/adplatform_db',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT id, email, has_seen_tour FROM users ORDER BY created_at DESC LIMIT 5');
    console.log(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
