const { Client } = require('pg');
const c = new Client('postgresql://postgres:Krav20%23pool@localhost:5432/adplatform');

async function fix() {
  await c.connect();
  try {
    await c.query(`DROP TABLE IF EXISTS notifications`);
    await c.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(60) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        link VARCHAR(255),
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Fixed notifications table!');
  } catch (err) {
    console.error(err);
  } finally {
    await c.end();
  }
}

fix();
