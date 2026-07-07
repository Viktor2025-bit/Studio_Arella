const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Krav20%23pool@localhost:5432/adplatform'
});

async function test() {
  const client = await pool.connect();
  try {
    const bookingRes = await client.query("SELECT * FROM bookings WHERE status = 'pending_payment' ORDER BY created_at DESC LIMIT 1");
    if (bookingRes.rows.length === 0) {
      console.log('No pending booking found');
      return;
    }
    const booking = bookingRes.rows[0];
    console.log('Testing wallet payment for booking', booking.id, booking.booking_number);

    await client.query('BEGIN');
    const userRes = await client.query('SELECT credits FROM users WHERE id = $1', [booking.user_id]);
    const credits = parseFloat(userRes.rows[0].credits);
    const totalCost = parseFloat(booking.total_cost);
    
    console.log('Credits:', credits, 'Total Cost:', totalCost);

    await client.query('UPDATE users SET credits = credits - $1 WHERE id = $2', [totalCost, booking.user_id]);
    await client.query(`
      INSERT INTO transactions (user_id, type, source, amount, description, reference)
      VALUES ($1, 'debit', 'booking', $2, $3, $4)
    `, [booking.user_id, totalCost, `Paid for booking ${booking.booking_number}`, booking.booking_number]);

    await client.query("UPDATE bookings SET status = 'active', payment_reference = 'WALLET' WHERE id = $1", [booking.id]);
    await client.query("UPDATE booking_slots SET status = 'active', locked_until = NULL WHERE booking_id = $1", [booking.id]);

    await client.query('ROLLBACK');
    console.log('Success (rolled back)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Wallet payment error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

test();
