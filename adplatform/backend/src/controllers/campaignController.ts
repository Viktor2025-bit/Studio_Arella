import { Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export const getCampaigns : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `SELECT c.*, 
      COUNT(DISTINCT b.id) as booking_count,
      COUNT(DISTINCT a.id) as ad_count
      FROM campaigns c
      LEFT JOIN bookings b ON b.campaign_id = c.id
      LEFT JOIN ads a ON a.campaign_id = c.id
      WHERE c.user_id = $1`;
    const params: any[] = [authReq.user?.id];

    if (status) {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM campaigns WHERE user_id = $1${status ? ' AND status = $2' : ''}`,
      status ? [authReq.user?.id, status] : [authReq.user?.id]
    );

    res.json({
      campaigns: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCampaign : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(DISTINCT b.id) as booking_count, COUNT(DISTINCT a.id) as ad_count
       FROM campaigns c
       LEFT JOIN bookings b ON b.campaign_id = c.id
       LEFT JOIN ads a ON a.campaign_id = c.id
       WHERE c.id = $1 AND c.user_id = $2
       GROUP BY c.id`,
      [req.params.id, authReq.user?.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCampaign : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const { name, budget, start_date, end_date } = req.body;
    const result = await pool.query(
      `INSERT INTO campaigns (user_id, name, budget, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [authReq.user?.id, name, budget, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCampaign : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const { name, status, budget, start_date, end_date } = req.body;
    const result = await pool.query(
      `UPDATE campaigns SET
        name = COALESCE($1, name),
        status = COALESCE($2, status),
        budget = COALESCE($3, budget),
        start_date = COALESCE($4, start_date),
        end_date = COALESCE($5, end_date)
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [name, status, budget, start_date, end_date, req.params.id, authReq.user?.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCampaign : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const result = await pool.query(
      'DELETE FROM campaigns WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, authReq.user?.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
