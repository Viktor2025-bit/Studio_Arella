const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Krav20%23pool@localhost:5432/adplatform'
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Starting seed process...');
    await client.query('BEGIN');

    // 1. Create Advertisers
    console.log('Seeding advertisers...');
    const passwordHash = await bcrypt.hash('password123', 10);
    const userIds = [];
    for (let i = 1; i <= 15; i++) {
      const res = await client.query(`
        INSERT INTO users (name, email, password, role, credits, business_name, email_verified)
        VALUES ($1, $2, $3, 'advertiser', 1000000, $4, true)
        ON CONFLICT (email) DO UPDATE SET credits = 1000000
        RETURNING id
      `, [`Test Advertiser ${i}`, `advertiser${i}@example.com`, passwordHash, `Business ${i} Inc.`]);
      userIds.push(res.rows[0].id);
    }

    // 2. Create Campaigns and Creatives
    console.log('Seeding campaigns and creatives...');
    const adIds = [];
    for (const userId of userIds) {
      // 2 campaigns per user
      for (let c = 1; c <= 2; c++) {
        const campRes = await client.query(`
          INSERT INTO campaigns (user_id, name, status, budget)
          VALUES ($1, $2, 'active', 500000)
          RETURNING id
        `, [userId, `Campaign ${c} for ${userId.slice(0, 8)}`]);
        const campaignId = campRes.rows[0].id;

        // 1 ad per campaign
        const durations = [15, 30, 60];
        const duration = durations[Math.floor(Math.random() * durations.length)];
        const adRes = await client.query(`
          INSERT INTO ads (campaign_id, user_id, title, media_url, media_type, duration_seconds, status)
          VALUES ($1, $2, $3, 'https://example.com/video.mp4', 'video', $4, 'approved')
          RETURNING id
        `, [campaignId, userId, `Creative ${c}`, duration]);
        adIds.push({ id: adRes.rows[0].id, userId, campaignId, duration });
      }
    }

    // 3. Get Screen
    const screenRes = await client.query(`SELECT id FROM screens WHERE name ILIKE '%Studio Arella%'`);
    if (screenRes.rows.length === 0) {
      throw new Error('Screen not found. Ensure schema.sql seed is run.');
    }
    const screenId = screenRes.rows[0].id;

    // 4. Distribute Bookings over 30 days
    console.log('Seeding bookings and slots...');
    let currentDate = new Date();
    currentDate.setHours(6, 0, 0, 0); // Start at 6 AM today

    for (let day = 0; day < 30; day++) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(targetDate.getDate() + day);

      // Book 5 random blocks per day, sequentially to avoid overlap easily
      let currentHour = 6;
      for (let b = 0; b < 5; b++) {
        if (currentHour >= 19) break;

        const ad = adIds[Math.floor(Math.random() * adIds.length)];
        
        // Random block duration: 1h to 2h
        const blockDurationHours = Math.floor(Math.random() * 2) + 1;
        
        const startTime = new Date(targetDate);
        startTime.setHours(currentHour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(currentHour + blockDurationHours, 0, 0, 0);

        if (endTime.getHours() > 20) break; // Don't exceed operating hours

        const totalCost = (blockDurationHours * 60) * 1000;
        const bookingNumber = `#SA-${Date.now().toString().slice(-8)}-${day}-${b}`;

        const bookingRes = await client.query(`
          INSERT INTO bookings (booking_number, user_id, screen_id, ad_id, campaign_id, total_cost, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'active')
          RETURNING id
        `, [bookingNumber, ad.userId, screenId, ad.id, ad.campaignId, totalCost]);

        const bookingId = bookingRes.rows[0].id;

        await client.query(`
          INSERT INTO booking_slots (booking_id, screen_id, start_time, end_time, status)
          VALUES ($1, $2, $3, $4, 'active')
        `, [bookingId, screenId, startTime.toISOString(), endTime.toISOString()]);

        currentHour += blockDurationHours + 1; // Leave 1 hour gap between bookings for variation
      }
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
