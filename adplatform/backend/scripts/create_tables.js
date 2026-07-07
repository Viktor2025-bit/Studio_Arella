const { Client } = require('pg');
const c = new Client('postgresql://postgres:Krav20%23pool@localhost:5432/adplatform');

async function seed() {
  await c.connect();
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS proof_of_play_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
        booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
        creative_id UUID REFERENCES ads(id) ON DELETE SET NULL,
        start_timestamp TIMESTAMP NOT NULL,
        end_timestamp TIMESTAMP NOT NULL,
        completion_status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await c.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        admin_name VARCHAR(255),
        action_type VARCHAR(100) NOT NULL,
        target_entity VARCHAR(100),
        target_id VARCHAR(255),
        before_state JSONB,
        after_state JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tables created');
  } catch (err) {
    console.error(err);
  } finally {
    await c.end();
  }
}

seed();
