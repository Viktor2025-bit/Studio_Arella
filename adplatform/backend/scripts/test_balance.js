const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Krav20%23pool@localhost:5432/adplatform'
});

async function test() {
  const client = await pool.connect();
  try {
    const userRes = await client.query("SELECT id FROM users WHERE email='advertiser1@example.com'");
    const userId = userRes.rows[0].id;

    console.log('User ID:', userId);

    const result = await client.query('SELECT credits FROM users WHERE id = $1', [userId]);
    console.log('Credits row:', result.rows[0]);

    const salesResult = await client.query(
      `SELECT source, SUM(amount) as total FROM transactions 
       WHERE user_id = $1 AND type = 'credit' GROUP BY source`,
      [userId]
    );
    console.log('Sales result:', salesResult.rows);

    const breakdown = {};
    let grandTotal = 0;
    salesResult.rows.forEach((row) => {
      breakdown[row.source] = parseFloat(row.total);
      grandTotal += parseFloat(row.total);
    });

    console.log({
      credits: parseFloat(result.rows[0]?.credits || 0),
      breakdown,
      grand_total: grandTotal,
      sales_pct: grandTotal > 0 ? Math.round(((breakdown.sales || 0) / grandTotal) * 100) : 0,
      referral_pct: grandTotal > 0 ? Math.round(((breakdown.referral || 0) / grandTotal) * 100) : 0,
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

test();
