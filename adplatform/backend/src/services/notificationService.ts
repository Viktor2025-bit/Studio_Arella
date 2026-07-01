import pool from '../db/pool';

export type NotificationType =
  | 'creative_approved'
  | 'creative_rejected'
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_cancelled'
  | 'payment_received'
  | 'new_creative_review'   // admin only
  | 'new_booking'           // admin only
  | 'account_suspended';

interface CreateNotificationParams {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [params.user_id, params.type, params.title, params.body, params.link || null]
    );
  } catch (err) {
    // Non-blocking — never let notification failure break the main flow
    console.error('Notification insert error:', err);
  }
}

// ── Notify all admins ─────────────────────────────────────────────────────────
export async function notifyAdmins(params: Omit<CreateNotificationParams, 'user_id'>) {
  try {
    const admins = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    await Promise.all(admins.rows.map(a => createNotification({ ...params, user_id: a.id })));
  } catch (err) {
    console.error('notifyAdmins error:', err);
  }
}
