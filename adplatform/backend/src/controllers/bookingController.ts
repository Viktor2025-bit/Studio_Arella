import { Request, Response, RequestHandler } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';
import { sendBookingConfirmationEmail, sendCancellationEmail } from '../services/emailService';
import { createNotification, notifyAdmins } from '../services/notificationService';

// ── Get bookings ──────────────────────────────────────────────────────────────
export const getBookings: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { limit = 20, page = 1, screen_id, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const isAdmin = authReq.user?.role === 'admin';

    let query = `
      SELECT b.*,
        s.name as screen_name, s.location as screen_location,
        a.title as creative_title, a.file_url as creative_url, a.file_type,
        c.name as campaign_name,
        u.name as user_name, u.email as user_email,
        i.invoice_number, i.id as invoice_id
      FROM bookings b
      LEFT JOIN screens s ON b.screen_id = s.id
      LEFT JOIN ads a ON b.ad_id = a.id
      LEFT JOIN campaigns c ON b.campaign_id = c.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN invoices i ON i.booking_id = b.id
      WHERE 1=1`;

    const params: any[] = [];
    if (!isAdmin) { params.push(authReq.user?.id); query += ` AND b.user_id = $${params.length}`; }
    if (screen_id) { params.push(screen_id); query += ` AND b.screen_id = $${params.length}`; }
    if (status && status !== 'all') { params.push(status); query += ` AND b.status = $${params.length}`; }
    query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);
    res.json({ bookings: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Get booking slots for calendar ────────────────────────────────────────────
export const getBookingSlots: RequestHandler = async (req, res) => {
  try {
    const { screen_id, start_date, end_date } = req.query;
    if (!screen_id || !start_date || !end_date) {
      res.status(400).json({ message: 'Screen ID, start_date, and end_date are required' });
      return;
    }

    const query = `
      SELECT start_time, end_time 
      FROM booking_slots 
      WHERE screen_id = $1 
        AND status IN ('active', 'locked')
        AND start_time >= $2::timestamptz 
        AND end_time <= $3::timestamptz
    `;
    const result = await pool.query(query, [screen_id, start_date, end_date]);
    res.json({ slots: result.rows });
  } catch (err) {
    console.error('Error fetching booking slots:', err);
    res.status(500).json({ message: 'Server error fetching slots' });
  }
};

// ── Reserve slots (Cart checkout step 1) ──────────────────────────────────────
export const reserveSlots: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const client = await pool.connect();
  try {
    const { screen_id, ad_id, slots } = req.body;
    // slots is now expected to be an array of blocks: { start: string, end: string, mins: number }
    if (!screen_id || !ad_id || !slots || !slots.length) {
      res.status(400).json({ message: 'Screen, ad, and time slots are required' }); return;
    }
    
    const initialAdRes = await client.query('SELECT duration_seconds, ppm_rate FROM ads WHERE id = $1 AND user_id = $2 AND (status = $3 OR status = $4)', [ad_id, authReq.user?.id, 'approved', 'pending']);
    if (initialAdRes.rows.length === 0) {
       res.status(400).json({ message: 'Valid creative not found' }); return;
    }
    
    const adDuration = initialAdRes.rows[0].duration_seconds || 60;
    const ppmRate = initialAdRes.rows[0].ppm_rate || 1000;

    let totalSeconds = 0;
    let totalCost = 0;
    let minStart = new Date(slots[0].start);
    let maxEnd = new Date(slots[0].end);

    for (const block of slots) {
      const startDt = new Date(block.start);
      const endDt = new Date(block.end);
      
      if (startDt < minStart) minStart = startDt;
      if (endDt > maxEnd) maxEnd = endDt;
      
      if (startDt >= endDt) {
         res.status(400).json({ message: 'End time must be after start time' }); return;
      }
      if (startDt.getTime() < Date.now()) {
         res.status(400).json({ message: 'Cannot book slots in the past' }); return;
      }
      
      // Calculate hours in West Africa Time (UTC+1)
      const startHour = new Date(startDt.getTime() + 3600000).getUTCHours();
      const endHour = new Date(endDt.getTime() + 3600000).getUTCHours();
      const endMins = endDt.getUTCMinutes();
      
      // Operating hours are exactly 6:00 AM to 7:00 PM (19:00)
      if (startHour < 6 || startHour >= 19 || (endHour > 19 || (endHour === 19 && endMins > 0))) {
         res.status(400).json({ message: 'Bookings must strictly be between 6:00 AM and 7:00 PM' }); return;
      }
      
      const blockSecs = (endDt.getTime() - startDt.getTime()) / 1000;
      totalSeconds += blockSecs;
      totalCost += Math.ceil(blockSecs / 60) * ppmRate;
    }
    const costPerSec = totalSeconds > 0 ? totalCost / totalSeconds : 0;

    await client.query('BEGIN');

    for (const block of slots) {
      const startDt = new Date(block.start);
      const endDt = new Date(block.end);
      
      const conflict = await client.query(`
        SELECT id FROM booking_slots
        WHERE screen_id = $1
        AND status IN ('active', 'locked')
        AND tstzrange(start_time, end_time) && tstzrange($2::timestamptz, $3::timestamptz)
      `, [screen_id, startDt.toISOString(), endDt.toISOString()]);
      
      if (conflict.rows.length > 0) {
        await client.query('ROLLBACK');
        res.status(409).json({ message: `Time block starting at ${startDt.toLocaleString()} conflicts with an existing booking.` });
        return;
      }
    }

    const bookingNumber = `#SA-${Date.now().toString().slice(-8)}`;
    const bookingRes = await client.query(`
      INSERT INTO bookings (booking_number, user_id, screen_id, ad_id, total_cost, status, start_time, end_time, interval_seconds, cost_per_sec)
      VALUES ($1, $2, $3, $4, $5, 'pending_payment', $6, $7, $8, $9)
      RETURNING id
    `, [bookingNumber, authReq.user?.id, screen_id, ad_id, totalCost, minStart.toISOString(), maxEnd.toISOString(), adDuration, costPerSec]);
    
    const bookingId = bookingRes.rows[0].id;

    for (const block of slots) {
      const startDt = new Date(block.start);
      const endDt = new Date(block.end);
      await client.query(`
        INSERT INTO booking_slots (booking_id, screen_id, start_time, end_time, status, locked_until)
        VALUES ($1, $2, $3, $4, 'locked', NOW() + INTERVAL '5 minutes')
      `, [bookingId, screen_id, startDt.toISOString(), endDt.toISOString()]);
    }

    await client.query('COMMIT');
    res.status(200).json({ 
       booking_id: bookingId, 
       total_cost: totalCost,
       slots_count: slots.length,
       duration_seconds: totalSeconds,
       locked_until: new Date(Date.now() + 5 * 60000)
    });

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Reserve slots error', err);
    res.status(500).json({ message: err.message || 'Failed to reserve slots' });
  } finally {
    client.release();
  }
};

// ── Create booking (webhook will confirm it) ──────────────────────────────────
export const createBooking: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { screen_id, campaign_id, ad_id, start_time, end_time, duration_minutes, total_cost, payment_reference } = req.body;

    if (!screen_id || !start_time || !end_time) {
      res.status(400).json({ message: 'Screen, start time, and end time are required' }); return;
    }

    // Check creative is approved if provided
    if (ad_id) {
      const ad = await pool.query('SELECT status FROM ads WHERE id = $1 AND user_id = $2', [ad_id, authReq.user?.id]);
      if (!ad.rows[0]) { res.status(404).json({ message: 'Creative not found' }); return; }
      if (ad.rows[0].status !== 'approved') {
        res.status(400).json({ message: 'Only approved creatives can be attached to a booking' }); return;
      }
    }

    // Check for double-booking
    const conflict = await pool.query(
      `SELECT id FROM bookings
       WHERE screen_id = $1
         AND status NOT IN ('cancelled', 'failed')
         AND tstzrange(start_time, end_time) &&
             tstzrange($2::timestamptz, $3::timestamptz)`,
      [screen_id, start_time, end_time]
    );
    if (conflict.rows.length > 0) {
      res.status(409).json({ message: 'This time slot is already booked. Please choose a different time.' }); return;
    }

    // Check for admin-blocked slots
    const blocked = await pool.query(
      `SELECT id FROM slot_blocks
       WHERE screen_id = $1
         AND tstzrange(start_time, end_time) &&
             tstzrange($2::timestamptz, $3::timestamptz)`,
      [screen_id, start_time, end_time]
    );
    if (blocked.rows.length > 0) {
      res.status(409).json({ message: 'This time slot has been blocked by the admin.' }); return;
    }

    // Server-side price validation
    const mins = Number(duration_minutes);
    const expectedCost = mins * 1000;
    if (Math.abs(Number(total_cost) - expectedCost) > 1) {
      res.status(400).json({ message: 'Cost mismatch. Please refresh and try again.' }); return;
    }

    const bookingNumber = `#SA-${Date.now().toString(36).toUpperCase()}`;
    const result = await pool.query(
      `INSERT INTO bookings (booking_number, user_id, screen_id, campaign_id, ad_id,
        start_time, end_time, interval_seconds, total_cost, cost_per_sec, status, screen_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending_payment', 1)
       RETURNING *`,
      [
        bookingNumber, authReq.user?.id, screen_id, campaign_id || null, ad_id || null,
        start_time, end_time, mins * 60, total_cost,
        total_cost / (mins * 60),
      ]
    );

    // Notify admins of new booking
    notifyAdmins({
      type: 'new_booking',
      title: 'New booking created',
      body: `Booking ${bookingNumber} was created. Payment pending.`,
      link: '/admin/bookings',
    });

    res.status(201).json({ booking: result.rows[0] });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Booking creation failed' });
  }
};

// ── Confirm booking (called after Paystack webhook verifies payment) ───────────
export const confirmBooking: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { payment_reference, booking_id } = req.body;

    const booking = await pool.query(
      `UPDATE bookings SET status = 'active', payment_reference = $1
       WHERE id = $2 RETURNING *`,
      [payment_reference, booking_id]
    );
    if (!booking.rows[0]) { res.status(404).json({ message: 'Booking not found' }); return; }

    const b = booking.rows[0];

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    await pool.query(
      `INSERT INTO invoices (booking_id, invoice_number, advertiser_id, amount)
       VALUES ($1, $2, $3, $4) ON CONFLICT (booking_id) DO NOTHING`,
      [b.id, invoiceNumber, b.user_id, b.total_cost]
    );

    // Get user + screen for email
    const [userRes, screenRes] = await Promise.all([
      pool.query('SELECT name, email FROM users WHERE id = $1', [b.user_id]),
      pool.query('SELECT name FROM screens WHERE id = $1', [b.screen_id]),
    ]);

    sendBookingConfirmationEmail(userRes.rows[0].email, userRes.rows[0].name, {
      booking_number: b.booking_number,
      screen_name: screenRes.rows[0]?.name || 'Studio Arella',
      start_time: b.start_time,
      duration_minutes: Math.round(b.interval_seconds / 60),
      total_cost: b.total_cost,
      payment_reference,
    }).catch(console.error);

    res.json({ booking: b, invoice_number: invoiceNumber });
  } catch (err) {
    res.status(500).json({ message: 'Confirmation failed' });
  }
};

// ── Cancel booking ────────────────────────────────────────────────────────────
export const cancelBooking: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const isAdmin = authReq.user?.role === 'admin';
    const { reason, force_refund } = req.body;

    const bookingRes = await pool.query(
      `SELECT b.*, u.email as user_email, u.name as user_name
       FROM bookings b LEFT JOIN users u ON b.user_id = u.id
       WHERE b.id = $1 ${!isAdmin ? 'AND b.user_id = $2' : ''}`,
      isAdmin ? [req.params.id] : [req.params.id, authReq.user?.id]
    );
    if (!bookingRes.rows[0]) { res.status(404).json({ message: 'Booking not found' }); return; }

    const booking = bookingRes.rows[0];
    if (['cancelled', 'completed'].includes(booking.status)) {
      res.status(400).json({ message: 'This booking cannot be cancelled' }); return;
    }

    // Calculate refund eligibility
    const hoursUntilSlot = (new Date(booking.start_time).getTime() - Date.now()) / (1000 * 60 * 60);
    const cancellationHours = 48;
    const eligibleForRefund = isAdmin ? (force_refund !== false) : hoursUntilSlot >= cancellationHours;
    const refundAmount = eligibleForRefund ? Number(booking.total_cost) : 0;

    await pool.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(),
       cancellation_reason = $1, refund_amount = $2
       WHERE id = $3`,
      [reason || 'Cancelled by user', refundAmount, booking.id]
    );

    // Audit log for admin cancellations
    if (isAdmin) {
      await pool.query(
        `INSERT INTO audit_logs (admin_id, admin_name, action_type, entity_type, entity_id, before_state, after_state)
         VALUES ($1, $2, 'BOOKING_CANCELLED', 'booking', $3, $4, $5)`,
        [authReq.user?.id, 'Admin', booking.id,
          JSON.stringify({ status: booking.status }),
          JSON.stringify({ status: 'cancelled', refund_amount: refundAmount })]
      );
    }

    // In-app notification to advertiser
    createNotification({
      user_id: booking.user_id,
      type: 'booking_cancelled',
      title: 'Booking cancelled',
      body: eligibleForRefund
        ? `Your booking ${booking.booking_number} was cancelled. A refund of ₦${refundAmount.toLocaleString()} will be processed.`
        : `Your booking ${booking.booking_number} was cancelled. No refund applicable (within 48-hour window).`,
      link: '/bookings',
    });

    sendCancellationEmail(booking.user_email, booking.user_name, {
      booking_number: booking.booking_number,
      refund_amount: refundAmount,
    }).catch(console.error);

    res.json({
      message: eligibleForRefund
        ? `Booking cancelled. Refund of ₦${refundAmount.toLocaleString()} will be processed.`
        : 'Booking cancelled. No refund applicable (within 48-hour window).',
      refund_amount: refundAmount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Cancellation failed' });
  }
};

// ── Update booking status (admin) ─────────────────────────────────────────────
export const updateBookingStatus: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ message: 'Booking not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
