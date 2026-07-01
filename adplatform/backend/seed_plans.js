const { Client } = require('pg');
const c = new Client('postgresql://postgres:Krav20%23pool@localhost:5432/adplatform');

async function seed() {
  await c.connect();
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        duration_minutes INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description VARCHAR(500),
        popular BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await c.query(`
      INSERT INTO pricing_plans (name, duration_minutes, price, description, popular) VALUES
      ('Starter', 1, 1000.00, '1-minute slot — great for a quick announcement or promo', false),
      ('Standard', 5, 4500.00, '5-minute slot — ideal for a short brand awareness campaign', false),
      ('Popular', 10, 8000.00, '10-minute slot — best value for regular advertisers', true),
      ('Business', 30, 20000.00, '30-minute slot — heavy daily visibility for your business', false),
      ('Premium', 60, 35000.00, '1-hour slot — maximum screen presence for major campaigns', false),
      ('Daily', 480, 80000.00, '8-hour day package — own the screen for the entire business day', false)
      ON CONFLICT DO NOTHING;
    `);

    await c.query(`
      CREATE TABLE IF NOT EXISTS creative_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(50) NOT NULL,
        ad_type VARCHAR(50) DEFAULT 'image',
        description TEXT NOT NULL,
        target_audience TEXT,
        preferred_dates TEXT,
        budget_range VARCHAR(100),
        reference_links TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Plans created');
  } catch (err) {
    console.error(err);
  } finally {
    await c.end();
  }
}

seed();
