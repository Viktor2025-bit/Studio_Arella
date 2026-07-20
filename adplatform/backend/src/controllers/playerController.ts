import { Request, Response } from 'express';
import pool from '../db/pool';

/**
 * GET /player/manifest/:screen_id
 * Returns a 24-hour time-ordered JSON playlist of confirmed bookings for the screen.
 */
export const getManifest = async (req: Request, res: Response): Promise<void> => {
  const { screen_id } = req.params;
  try {
    // We want bookings for this screen_id that are 'active' or 'confirmed'
    // Actually the PRD says 'confirmed'. In our DB, bookings have status 'active' by default. Let's select 'active' or 'confirmed'.
    // They must have an associated creative that is 'approved' or 'active'.
    const query = `
      SELECT 
        b.id AS booking_id,
        b.booking_number,
        b.start_time,
        b.end_time,
        a.id AS creative_id,
        a.media_url,
        a.media_type,
        a.duration_seconds
      FROM bookings b
      JOIN ads a ON b.ad_id = a.id
      WHERE b.screen_id = $1 
        AND b.status IN ('active', 'confirmed')
        AND a.status IN ('active', 'approved')
        AND b.end_time >= NOW()
        AND b.start_time <= NOW() + INTERVAL '24 hours'
      ORDER BY b.start_time ASC;
    `;
    
    const result = await pool.query(query, [screen_id]);
    
    // We might need to generate the actual manifest format.
    // A simple array of slots is fine for now.
    const manifest = result.rows.map(row => ({
      booking_reference: row.booking_number,
      booking_id: row.booking_id,
      creative_id: row.creative_id,
      start_time: row.start_time,
      end_time: row.end_time,
      duration: row.duration_seconds,
      media_url: row.media_url,
      media_type: row.media_type
    }));

    res.json({ manifest });
  } catch (err) {
    console.error('Error fetching manifest:', err);
    res.status(500).json({ message: 'Server error generating manifest' });
  }
};

/**
 * POST /player/logs
 * Receives an array of proof-of-play logs from the player and saves them.
 */
export const submitLogs = async (req: Request, res: Response): Promise<void> => {
  const { logs } = req.body;
  if (!logs || !Array.isArray(logs)) {
    res.status(400).json({ message: 'Invalid logs payload' });
    return;
  }

  try {
    // Insert logs in a batch transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const log of logs) {
        await client.query(
          `INSERT INTO proof_of_play_logs 
            (screen_id, booking_id, creative_id, start_timestamp, end_timestamp, completion_status) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            log.screen_id,
            log.booking_id,
            log.creative_id,
            log.start_timestamp,
            log.end_timestamp,
            log.completion_status || 'completed'
          ]
        );

        if ((log.completion_status || 'completed') === 'completed') {
           const logDate = new Date(log.start_timestamp);
           const logHour = logDate.getHours();
           const todayStr = logDate.toISOString().split('T')[0];

           let multiplier = 20;
           if ((logHour >= 7 && logHour <= 9) || (logHour >= 16 && logHour <= 19)) multiplier = 45;
           else if (logHour >= 23 || logHour <= 5) multiplier = 2;

           const bookingRes = await client.query(
             `UPDATE bookings SET views = views + 1, impressions = impressions + $1 WHERE id = $2 RETURNING campaign_id, user_id`,
             [multiplier, log.booking_id]
           );

           if (bookingRes.rows.length > 0) {
             const { campaign_id, user_id } = bookingRes.rows[0];
             
             if (campaign_id) {
               await client.query(
                 `UPDATE campaigns SET impressions = impressions + $1 WHERE id = $2`,
                 [multiplier, campaign_id]
               );
             }

             await client.query(`
                INSERT INTO analytics (booking_id, campaign_id, user_id, impressions, views, date, hour)
                VALUES ($1, $2, $3, $4, 1, $5, $6)
             `, [log.booking_id, campaign_id, user_id, multiplier, todayStr, logHour]);
           }
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ message: 'Logs processed successfully' });
  } catch (err) {
    console.error('Error processing logs:', err);
    res.status(500).json({ message: 'Server error processing logs' });
  }
};
