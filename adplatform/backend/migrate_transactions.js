const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://adplatform_db_user:fGj8JTmdOGiKGwFBQfhThXi3WAZqEr1P@dpg-d96na3uq1p3s73d2dqq0-a.oregon-postgres.render.com/adplatform_db',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`UPDATE transactions SET amount = 2000 WHERE amount = 1833.00`);
    console.log(`Updated ${res.rowCount} transactions to 2000.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
