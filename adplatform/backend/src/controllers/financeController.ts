import { Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export const getBalance : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const result = await pool.query('SELECT credits FROM users WHERE id = $1', [authReq.user?.id]);
    
    // Get sales vs referral breakdown
    const salesResult = await pool.query(
      `SELECT source, SUM(amount) as total FROM transactions 
       WHERE user_id = $1 AND type = 'credit' GROUP BY source`,
      [authReq.user?.id]
    );

    const breakdown: Record<string, number> = {};
    let grandTotal = 0;
    salesResult.rows.forEach((row) => {
      breakdown[row.source] = parseFloat(row.total);
      grandTotal += parseFloat(row.total);
    });

    res.json({
      credits: parseFloat(result.rows[0]?.credits || 0),
      breakdown,
      grand_total: grandTotal,
      sales_pct: grandTotal > 0 ? Math.round(((breakdown.sales || 0) / grandTotal) * 100) : 0,
      referral_pct: grandTotal > 0 ? Math.round(((breakdown.referral || 0) / grandTotal) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTransactions : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await pool.query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [authReq.user?.id, Number(limit), offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) FROM transactions WHERE user_id = $1', [authReq.user?.id]);

    res.json({ transactions: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const addCredits : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const { amount, reference } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [amount, authReq.user?.id]);
      await client.query(
        `INSERT INTO transactions (user_id, type, source, amount, description, reference)
         VALUES ($1, 'credit', 'top_up', $2, 'Credit top-up', $3)`,
        [authReq.user?.id, amount, reference]
      );
      await client.query('COMMIT');

      const userResult = await pool.query('SELECT credits FROM users WHERE id = $1', [authReq.user?.id]);
      res.json({ message: 'Credits added', credits: parseFloat(userResult.rows[0].credits) });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTotalRevenue : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(total_cost), 0) as total_revenue FROM bookings WHERE user_id = $1 AND status != 'cancelled'`,
      [authReq.user?.id]
    );
    res.json({ total_revenue: parseFloat(result.rows[0].total_revenue) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
