const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Krav20%23pool@localhost:5432/adplatform' });

async function test() {
  try {
    const result = await pool.query(
      `INSERT INTO ads (user_id, campaign_id, title, media_url, file_url, file_type, file_size,
                        duration_seconds, status, media_type, reviewed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CASE WHEN $9 = 'approved' THEN NOW() ELSE NULL END)
       RETURNING *`,
      [
        'c12140e6-a078-43d9-aefb-b8957ba4b3cb', // valid advertiser id from test1
        null,
        'Test Ad',
        '/uploads/123.mp4',
        '/uploads/123.mp4',
        'video',
        16000000,
        30,
        'pending',
        'video',
      ]
    );
    console.log('Success:', result.rows[0].id);
  } catch (err) {
    console.error('Error:', err.message);
  }
  pool.end();
}
test();
