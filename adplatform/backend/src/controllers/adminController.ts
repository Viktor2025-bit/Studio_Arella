import { Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';

// Guard: admin only — accepts plain Request and casts internally
const adminOnly = (req: Request, res: Response): boolean => {
  const authReq = req as AuthRequest;
  if (authReq.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return false;
  }
  return true;
};

export const getPlatformStats : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  if (!adminOnly(req, res)) return;
  try {
    const [users, campaigns, bookings, screens, revenue, recentUsers] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM campaigns'),
      pool.query('SELECT COUNT(*) FROM bookings'),
      pool.query('SELECT COUNT(*) FROM screens'),
      pool.query(`SELECT COALESCE(SUM(total_cost),0) as total FROM bookings WHERE status != 'cancelled'`),
      pool.query(`SELECT id, name, email, role, credits, created_at FROM users ORDER BY created_at DESC LIMIT 10`),
    ]);

    res.json({
      users: parseInt(users.rows[0].count),
      campaigns: parseInt(campaigns.rows[0].count),
      bookings: parseInt(bookings.rows[0].count),
      screens: parseInt(screens.rows[0].count),
      revenue: parseFloat(revenue.rows[0].total),
      recent_users: recentUsers.rows,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllUsers : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  if (!adminOnly(req, res)) return;
  try {
    const { page = 1, limit = 20, role } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let query = `SELECT id, name, email, role, credits, avatar, created_at FROM users`;
    const params: any[] = [];
    if (role) { params.push(role); query += ` WHERE role = $1`; }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    const count = await pool.query('SELECT COUNT(*) FROM users');
    res.json({ users: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllBookings : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  if (!adminOnly(req, res)) return;
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const result = await pool.query(
      `SELECT b.*, u.name as user_name, u.email as user_email,
       s.name as screen_name, c.name as campaign_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN screens s ON b.screen_id = s.id
       LEFT JOIN campaigns c ON b.campaign_id = c.id
       ORDER BY b.created_at DESC LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );
    const count = await pool.query('SELECT COUNT(*) FROM bookings');
    res.json({ bookings: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllCampaigns : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  if (!adminOnly(req, res)) return;
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const result = await pool.query(
      `SELECT c.*, u.name as user_name, u.email as user_email
       FROM campaigns c
       LEFT JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );
    const count = await pool.query('SELECT COUNT(*) FROM campaigns');
    res.json({ campaigns: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllScreens : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  if (!adminOnly(req, res)) return;
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const result = await pool.query(
      `SELECT s.*, u.name as owner_name, u.email as owner_email
       FROM screens s
       LEFT JOIN users u ON s.owner_id = u.id
       ORDER BY s.created_at DESC LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );
    const count = await pool.query('SELECT COUNT(*) FROM screens');
    res.json({ screens: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserRole : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  if (!adminOnly(req, res)) return;
  try {
    const { role } = req.body;
    const validRoles = ['advertiser', 'admin'];
    if (!validRoles.includes(role)) { res.status(400).json({ message: 'Invalid role' }); return; }
    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role`,
      [role, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ message: 'User not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
