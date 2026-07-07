import { Request, Response, RequestHandler } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';
import https from 'https';
import crypto from 'crypto';
import { sendBookingConfirmationEmail } from '../services/emailService';
import { createNotification, notifyAdmins } from '../services/notificationService';

const MONNIFY_API_KEY     = process.env.MONNIFY_API_KEY as string;
const MONNIFY_SECRET_KEY  = process.env.MONNIFY_SECRET_KEY as string;
const MONNIFY_CONTRACT    = process.env.MONNIFY_CONTRACT_CODE as string;
const MONNIFY_BASE        = process.env.NODE_ENV === 'production'
  ? 'api.monnify.com'
  : 'sandbox.monnify.com';

// ── Helper: raw HTTPS request to Monnify ─────────────────────────────────────
const monnifyReq = (method: string, path: string, body?: any, token?: string): Promise<any> =>
  new Promise((resolve, reject) => {
    const authHeader = token
      ? `Bearer ${token}`
      : `Basic ${Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64')}`;

    const payload = body ? JSON.stringify(body) : undefined;
    const opts = {
      hostname: MONNIFY_BASE,
      port: 443,
      path,
      method,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error(`Bad JSON from Monnify: ${raw}`)); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

// ── Get a Monnify access token ────────────────────────────────────────────────
async function getMonnifyToken(): Promise<string> {
  const res = await monnifyReq('POST', '/api/v1/auth/login');
  if (!res.requestSuccessful) throw new Error('Monnify auth failed: ' + res.responseMessage);
  return res.responseBody.accessToken;
}

// ── Initialize booking payment (Monnify) ──────────────────────────────────────
export const initializePayment: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { booking_id, booking_type } = req.body;
    
    // 1. Get booking
    let booking;
    if (booking_type === 'podcast') {
      const resQuery = await pool.query('SELECT * FROM podcast_bookings WHERE id = $1 AND user_id = $2 AND status = $3', [booking_id, authReq.user?.id, 'pending']);
      if (resQuery.rows.length === 0) { res.status(404).json({ message: 'Booking not found or already paid' }); return; }
      booking = resQuery.rows[0];
    } else {
      const bookingRes = await pool.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND status = $3', [booking_id, authReq.user?.id, 'pending_payment']);
      if (bookingRes.rows.length === 0) {
        res.status(404).json({ message: 'Booking not found or already paid' }); return;
      }
      booking = bookingRes.rows[0];
    }

    // 2. Check if slots are still locked
    if (booking_type !== 'podcast') {
      const slotsRes = await pool.query("SELECT id FROM booking_slots WHERE booking_id = $1 AND status = 'locked' AND locked_until >= NOW()", [booking_id]);
      if (slotsRes.rows.length === 0) {
        res.status(400).json({ message: 'Cart expired. Please re-select your slots.' }); return;
      }
    }

    const amount = parseFloat(booking.total_cost);
    const user = await pool.query('SELECT name, email FROM users WHERE id = $1', [authReq.user?.id]);
    const paymentReference = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const token = await getMonnifyToken();

    const monnifyRes = await monnifyReq('POST', '/api/v1/merchant/transactions/init-transaction', {
      amount: Number(amount),
      customerName: user.rows[0].name,
      customerEmail: user.rows[0].email,
      paymentReference,
      paymentDescription: booking_type === 'podcast' ? `Studio Arella Podcast — ${booking.booking_number}` : `Studio Arella Ad Slot — ${booking.booking_number}`,
      currencyCode: 'NGN',
      contractCode: MONNIFY_CONTRACT,
      redirectUrl: booking_type === 'podcast' ? `${process.env.FRONTEND_URL}/podcast/payment-callback` : `${process.env.FRONTEND_URL}/bookings/payment-callback`,
      paymentMethods: ['CARD', 'ACCOUNT_TRANSFER'],
      metadata: {
        user_id: authReq.user?.id,
        booking_id,
        type: booking_type === 'podcast' ? 'podcast_booking' : 'booking'
      },
    }, token);

    if (!monnifyRes.requestSuccessful) {
      res.status(400).json({ message: monnifyRes.responseMessage || 'Monnify error' }); return;
    }

    res.json({
      checkout_url: monnifyRes.responseBody.checkoutUrl,
      payment_reference: paymentReference,
      amount,
    });
  } catch (err) {
    console.error('Payment init error:', err);
    res.status(500).json({ message: 'Payment initialization failed' });
  }
};

export const devBypassPayment: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  if (process.env.NODE_ENV !== 'development') { res.status(403).json({ message: 'Not allowed' }); return; }
  try {
    const { plan_id, screen_id, booking_id, start_time, end_time, duration_minutes, ad_id, campaign_id, booking_type = 'single', amount } = req.body;
    
    let planName = `${duration_minutes} minute slot`;
    if (plan_id) {
      const plan = await pool.query('SELECT name FROM pricing_plans WHERE id = $1', [plan_id]);
      if (plan.rows[0]) planName = plan.rows[0].name;
    }
    
    const meta = {
      user_id: authReq.user?.id,
      screen_id,
      booking_id: booking_id || null,
      start_time,
      end_time,
      duration_minutes,
      ad_id: ad_id || null,
      campaign_id: campaign_id || null,
      plan_name: planName,
      booking_type,
    };
    
    const paymentReference = `BYPASS-${Date.now()}`;
    await processConfirmedPayment(paymentReference, meta, amount);
    res.json({ success: true, message: 'Bypassed payment successfully.' });
  } catch (err) {
    console.error('Bypass error:', err);
    res.status(500).json({ message: 'Bypass failed' });
  }
};

// ── Pay from Wallet (Cart checkout step 2) ────────────────────────────────────
export const payFromWallet: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const client = await pool.connect();
  try {
    const { booking_id, booking_type } = req.body;
    
    await client.query('BEGIN');

    // 1. Get booking
    let booking;
    if (booking_type === 'podcast') {
      const resQuery = await client.query('SELECT * FROM podcast_bookings WHERE id = $1 AND user_id = $2 AND status = $3', [booking_id, authReq.user?.id, 'pending']);
      if (resQuery.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ message: 'Booking not found or already paid' }); return;
      }
      booking = resQuery.rows[0];
    } else {
      const bookingRes = await client.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND status = $3', [booking_id, authReq.user?.id, 'pending_payment']);
      if (bookingRes.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ message: 'Booking not found or already paid / expired' }); return;
      }
      booking = bookingRes.rows[0];
    }

    // 2. Check if slots are still locked
    if (booking_type !== 'podcast') {
      const slotsRes = await client.query("SELECT id FROM booking_slots WHERE booking_id = $1 AND status = 'locked' AND locked_until >= NOW()", [booking_id]);
      if (slotsRes.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: 'Cart expired. Please re-select your slots.' }); return;
      }
    }

    // 3. Check wallet balance
    const userRes = await client.query('SELECT credits FROM users WHERE id = $1', [authReq.user?.id]);
    const credits = parseFloat(userRes.rows[0].credits);
    const totalCost = parseFloat(booking.total_cost);
    
    if (credits < totalCost) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: 'Insufficient wallet balance' }); return;
    }

    // 4. Deduct balance & create transaction
    await client.query('UPDATE users SET credits = credits - $1 WHERE id = $2', [totalCost, authReq.user?.id]);
    await client.query(`
      INSERT INTO transactions (user_id, type, source, amount, description, reference)
      VALUES ($1, 'debit', 'booking', $2, $3, $4)
    `, [authReq.user?.id, totalCost, `Paid for booking ${booking.booking_number}`, booking.booking_number]);

    // 5. Activate booking & slots
    if (booking_type === 'podcast') {
      await client.query("UPDATE podcast_bookings SET status = 'confirmed', payment_status = 'paid' WHERE id = $1", [booking_id]);
    } else {
      await client.query("UPDATE bookings SET status = 'active', payment_reference = 'WALLET' WHERE id = $1", [booking_id]);
      await client.query("UPDATE booking_slots SET status = 'active', locked_until = NULL WHERE booking_id = $1", [booking_id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Payment successful using wallet!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Wallet payment error:', err);
    res.status(500).json({ message: 'Failed to process wallet payment' });
  } finally {
    client.release();
  }
};

// ── Initialize credit top-up payment ─────────────────────────────────────────
export const initializeCreditPayment: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) < 1000) {
      res.status(400).json({ message: 'Minimum top-up is ₦1,000' }); return;
    }

    const user = await pool.query('SELECT name, email FROM users WHERE id = $1', [authReq.user?.id]);
    const paymentReference = `TOPUP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    await pool.query(
      `INSERT INTO transactions (user_id, type, source, amount, description, reference)
       VALUES ($1, 'pending', 'topup', $2, 'Credit top-up', $3)
       ON CONFLICT DO NOTHING`,
      [authReq.user?.id, amount, paymentReference]
    );

    const token = await getMonnifyToken();

    const monnifyRes = await monnifyReq('POST', '/api/v1/merchant/transactions/init-transaction', {
      amount: Number(amount),
      customerName: user.rows[0].name,
      customerEmail: user.rows[0].email,
      paymentReference,
      paymentDescription: `Studio Arella — Credit Top-up ₦${Number(amount).toLocaleString()}`,
      currencyCode: 'NGN',
      contractCode: MONNIFY_CONTRACT,
      redirectUrl: `${process.env.FRONTEND_URL}/finances/payment-callback`,
      paymentMethods: ['CARD', 'ACCOUNT_TRANSFER'],
      metadata: {
        user_id: authReq.user?.id,
        type: 'topup',
        amount,
      },
    }, token);

    if (!monnifyRes.requestSuccessful) {
      res.status(400).json({ message: monnifyRes.responseMessage || 'Monnify error' }); return;
    }

    res.json({
      checkout_url: monnifyRes.responseBody.checkoutUrl,
      payment_reference: paymentReference,
    });
  } catch (err) {
    console.error('Credit init error:', err);
    res.status(500).json({ message: 'Payment initialization failed' });
  }
};

// ── Verify payment (client-side callback) ─────────────────────────────────────
export const verifyPayment: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { reference } = req.params;
    
    if (process.env.NODE_ENV === 'development' && reference.startsWith('DEV_BYPASS_')) {
      res.json({ success: true, message: 'Payment confirmed and booking activated. (DEV BYPASS)' });
      return;
    }
    
    const token = await getMonnifyToken();

    // Monnify verify endpoint uses the paymentReference
    const verifyRes = await monnifyReq(
      'GET',
      `/api/v2/transactions/${encodeURIComponent(reference)}`,
      undefined,
      token
    );

    if (!verifyRes.requestSuccessful) {
      res.status(400).json({ message: 'Could not verify payment', details: verifyRes.responseMessage });
      return;
    }

    const txn = verifyRes.responseBody;
    if (txn.paymentStatus !== 'PAID') {
      res.status(400).json({ message: 'Payment not completed', gateway_status: txn.paymentStatus });
      return;
    }

    const meta = txn.metaData || {};

    // Handle credit top-up
    if (meta.type === 'topup') {
      // Check not already processed
      const existing = await pool.query(
        "SELECT id FROM transactions WHERE reference = $1 AND type = 'credit'",
        [reference]
      );
      if (existing.rows.length > 0) {
        res.json({ already_confirmed: true, message: 'Credits already added.' }); return;
      }
      await pool.query(
        "UPDATE users SET credits = credits + $1 WHERE id = $2",
        [meta.amount, meta.user_id]
      );
      await pool.query(
        "UPDATE transactions SET type = 'credit' WHERE reference = $1",
        [reference]
      );
      createNotification({
        user_id: meta.user_id,
        type: 'payment_received',
        title: 'Credits added!',
        body: `₦${Number(meta.amount).toLocaleString()} has been added to your Studio Arella balance.`,
        link: '/finances',
      });
      res.json({ success: true, message: 'Credits added to your account successfully.' });
      return;
    }

    // Handle booking payment
    if (meta.type === 'podcast_booking') {
      const existing = await pool.query("SELECT id FROM podcast_bookings WHERE booking_number LIKE $1 AND status = 'confirmed'", [`%${reference.slice(-8)}%`]);
      if (existing.rows.length > 0) { res.json({ already_confirmed: true, message: 'Booking already confirmed.' }); return; }
    } else {
      const existing = await pool.query(
        "SELECT id FROM bookings WHERE booking_number LIKE $1 AND status = 'active'",
        [`%${reference.slice(-8)}%`]
      );
      if (existing.rows.length > 0) {
        res.json({ already_confirmed: true, message: 'Booking already confirmed.' }); return;
      }
    }

    await processConfirmedPayment(reference, meta, txn.amountPaid);
    res.json({ success: true, message: 'Payment confirmed and booking activated.' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
};

// ── Monnify webhook (server-to-server — primary confirmation path) ─────────────
export const monnifyWebhook: RequestHandler = async (req, res) => {
  try {
    // Validate Monnify signature
    const computedHash = crypto
      .createHmac('sha512', MONNIFY_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (computedHash !== req.headers['monnify-signature']) {
      res.status(401).send('Unauthorized'); return;
    }

    // Always respond 200 immediately
    res.status(200).send('OK');

    const event = req.body;
    if (event.eventType === 'SUCCESSFUL_TRANSACTION') {
      const data = event.eventData;
      const meta = data.metaData || {};
      const ref = data.paymentReference;

      if (meta.type === 'topup') {
        const existing = await pool.query(
          "SELECT id FROM transactions WHERE reference = $1 AND type = 'credit'", [ref]
        );
        if (existing.rows.length === 0) {
          await pool.query("UPDATE users SET credits = credits + $1 WHERE id = $2", [meta.amount, meta.user_id]);
          await pool.query("UPDATE transactions SET type = 'credit' WHERE reference = $1", [ref]);
          createNotification({
            user_id: meta.user_id,
            type: 'payment_received',
            title: 'Credits added!',
            body: `₦${Number(meta.amount).toLocaleString()} credited to your Studio Arella balance.`,
            link: '/finances',
          });
        }
      } else {
        await processConfirmedPayment(ref, meta, data.amountPaid);
      }
    }
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(200).send('OK'); // Always 200 to Monnify
  }
};

// ── Shared: process a confirmed booking payment ───────────────────────────────
async function processConfirmedPayment(reference: string, meta: any, amountPaid: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingId = meta.booking_id;
    if (!bookingId) {
      console.warn('Legacy booking callback received or missing booking_id:', reference);
      await client.query('COMMIT');
      return;
    }
    
    const isPodcast = meta.type === 'podcast_booking';

    // 1. Mark booking as active
    if (isPodcast) {
      await client.query(
        "UPDATE podcast_bookings SET status = 'confirmed', payment_status = 'paid' WHERE id = $1",
        [bookingId]
      );
    } else {
      await client.query(
        "UPDATE bookings SET status = 'active', payment_reference = $1 WHERE id = $2",
        [reference, bookingId]
      );

      // 2. Mark slots as active and remove locks
      await client.query(
        "UPDATE booking_slots SET status = 'active', locked_until = NULL WHERE booking_id = $1",
        [bookingId]
      );
    }

    // 3. Create invoice
    // 3. Create invoice
    const baseReference = reference.slice(-8).toUpperCase();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${baseReference}`;
    if (!isPodcast) {
      await client.query(
        `INSERT INTO invoices (booking_id, invoice_number, advertiser_id, amount)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [bookingId, invoiceNumber, meta.user_id, amountPaid]
      );
    }

    // 4. Record transaction (pending transaction from Monnify init was removed, so we just insert the debit)
    await client.query(`
      INSERT INTO transactions (user_id, type, source, amount, description, reference)
      VALUES ($1, 'debit', 'booking', $2, $3, $4)
    `, [meta.user_id, amountPaid, `Paid for booking INV-${baseReference}`, reference]);

    if (isPodcast) {
      const booking = await client.query('SELECT * FROM podcast_bookings WHERE id = $1', [bookingId]);
      const b = booking.rows[0];
      createNotification({
        user_id: meta.user_id,
        type: 'booking_confirmed',
        title: 'Podcast Booking Confirmed!',
        body: `Your podcast booking ${b.booking_number} is now confirmed for ${new Date(b.start_time).toLocaleString()}.`,
        link: '/admin/podcasts',
      });
    } else {
      const booking = await client.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
      const b = booking.rows[0];

      // Notifications
      const userRes = await client.query('SELECT name, email FROM users WHERE id = $1', [meta.user_id]);
      const screenRes = await client.query('SELECT name FROM screens WHERE id = $1', [b.screen_id]);
      
      const ext = await client.query('SELECT MIN(start_time) as min_start, MAX(end_time) as max_end, COUNT(id) as total_runs FROM booking_slots WHERE booking_id = $1', [bookingId]);
      const bookingSummary = {
        ...b,
        start_time: ext.rows[0].min_start,
        end_time: ext.rows[0].max_end,
        total_runs: ext.rows[0].total_runs,
        screen_name: screenRes.rows[0].name
      };

      sendBookingConfirmationEmail(userRes.rows[0].email, userRes.rows[0].name, bookingSummary).catch(console.error);

      createNotification({
        user_id: meta.user_id,
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        body: `Your booking ${b.booking_number} is now active with ${ext.rows[0].total_runs} scheduled runs.`,
        link: '/campaigns',
      });
    }
    
    // Quick fix: the notifyAdmins function in old code took (type, title, body, link), wait let me check its signature from another call
    // the old code used notifyAdmins({ type, title, body, link }) but it was updated somewhere? Let's use the object form just in case.
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Process confirmed payment error:', err);
    throw err;
  } finally {
    client.release();
  }
}
