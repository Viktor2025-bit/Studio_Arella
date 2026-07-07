const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Krav20%23pool@localhost:5432/adplatform'
});

async function run() {
  await client.connect();
  try {
    await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100)`);
    console.log('Column added');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
