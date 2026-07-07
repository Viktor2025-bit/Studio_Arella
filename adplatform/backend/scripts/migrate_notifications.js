const { Client } = require('pg');

async function migrate() {
  const c = new Client('postgresql://postgres:Krav20%23pool@localhost:5432/adplatform');
  await c.connect();
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'system',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await c.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);
    console.log('Notifications table created successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await c.end();
  }
}

migrate();
