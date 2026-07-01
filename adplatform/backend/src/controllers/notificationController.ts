import { Request, Response, RequestHandler } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';

// ── Get notifications for current user ───────────────────────────────────────
export const getNotifications: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [authReq.user?.id]
    );
    const unread = result.rows.filter(n => !n.read).length;
    res.json({ notifications: result.rows, unread });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Mark one notification as read ─────────────────────────────────────────────
export const markRead: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    await pool.query(
      `UPDATE notifications SET read = true
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, authReq.user?.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Mark ALL as read ──────────────────────────────────────────────────────────
export const markAllRead: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    await pool.query(
      `UPDATE notifications SET read = true WHERE user_id = $1`,
      [authReq.user?.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Delete a notification ─────────────────────────────────────────────────────
export const deleteNotification: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [req.params.id, authReq.user?.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Unread count only (polled frequently) ─────────────────────────────────────
export const getUnreadCount: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false`,
      [authReq.user?.id]
    );
    res.json({ unread: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
