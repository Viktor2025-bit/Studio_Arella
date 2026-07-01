const { Client } = require('pg');
const c = new Client('postgresql://postgres:Krav20%23pool@localhost:5432/adplatform');

async function fix() {
  await c.connect();
  try {
    await c.query(`DROP TABLE IF EXISTS audit_logs`);
    await c.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_id UUID REFERENCES users(id),
        admin_name VARCHAR(255),
        action_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(100),
        before_state JSONB,
        after_state JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Fixed audit_logs table!');
  } catch (err) {
    console.error(err);
  } finally {
    await c.end();
  }
}

fix();
