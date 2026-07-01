import cron from 'node-cron';
import pool from '../db/pool';

// Run every hour at the top of the hour
export const startBookingLifecycleCron = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running booking lifecycle check...');
    try {
      // Find all active bookings where end_time has passed
      const result = await pool.query(
        `UPDATE bookings 
         SET status = 'ended', updated_at = NOW() 
         WHERE status = 'active' AND end_time <= NOW()
         RETURNING id, booking_number`
      );

      if (result.rows.length > 0) {
        console.log(`[CRON] Ended ${result.rows.length} expired bookings.`);
      }
    } catch (err) {
      console.error('[CRON] Error updating booking lifecycles:', err);
    }
  });

  // Run every minute to release expired cart slots
  cron.schedule('* * * * *', async () => {
    try {
      const result = await pool.query(
        `DELETE FROM booking_slots 
         WHERE status = 'locked' AND locked_until < NOW()
         RETURNING id`
      );
      if (result.rows.length > 0) {
        console.log(`[CRON] Released ${result.rows.length} expired locked slots.`);
        
        // Cleanup empty pending bookings
        await pool.query(
          `DELETE FROM bookings b
           WHERE b.status = 'pending_payment'
             AND NOT EXISTS (
               SELECT 1 FROM booking_slots s WHERE s.booking_id = b.id
             )`
        );
      }
    } catch (err) {
      console.error('[CRON] Error releasing expired slots:', err);
    }
  });

  console.log('[CRON] Booking lifecycle & cart cron jobs initialized.');
};
