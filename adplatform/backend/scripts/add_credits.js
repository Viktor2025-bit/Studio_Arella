const { Client } = require('pg');

const client = new Client('postgresql://postgres:Krav20%23pool@localhost:5432/adplatform');

async function seed() {
  await client.connect();
  try {
    const res = await client.query("UPDATE users SET credits = COALESCE(credits, 0) + 50000 WHERE email = 'kaluviktor200@gmail.com' RETURNING email, credits");
    if (res.rows.length > 0) {
      console.log('Successfully added 50,000 credits to:', res.rows[0]);
    } else {
      console.log('User not found!');
    }
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
seed();
