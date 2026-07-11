const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://user:password@localhost:5432/bems_screens' });
pool.query("UPDATE platform_settings SET value = '333.33' WHERE key = 'price_per_minute'", (err) => {
  if (err) console.error(err);
  else console.log('Updated DB rate to 333.33');
  process.exit(0);
});
