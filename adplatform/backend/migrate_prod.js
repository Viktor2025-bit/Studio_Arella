const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://adplatform_db_user:fGj8JTmdOGiKGwFBQfhThXi3WAZqEr1P@dpg-d96na3uq1p3s73d2dqq0-a.oregon-postgres.render.com/adplatform_db',
  ssl: { rejectUnauthorized: false }
});

pool.query('ALTER TABLE users ADD COLUMN terms_accepted BOOLEAN DEFAULT false;')
  .then(() => {
    console.log("Migration successful");
    process.exit(0);
  })
  .catch(err => {
    if (err.code === '42701') {
      console.log("Column already exists. Migration successful.");
      process.exit(0);
    } else {
      console.error("Migration failed:", err);
      process.exit(1);
    }
  });
