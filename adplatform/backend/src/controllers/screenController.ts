import { Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export const getScreens : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // All screens — managed by Bems Group admin
    const isOwner = req.query.my === 'true';
    let query = `SELECT s.*, u.name as owner_name FROM screens s JOIN users u ON s.owner_id = u.id WHERE 1=1`;
    const params: any[] = [];

    if (isOwner) { params.push(authReq.user?.id); query += ` AND s.owner_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND s.status = $${params.length}`; }
    if (type) { params.push(type); query += ` AND s.type = $${params.length}`; }

    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM screens');

    res.json({ screens: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createScreen : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const { name, location, type, size, price_per_sec, impressions_per_day } = req.body;
    const result = await pool.query(
      `INSERT INTO screens (owner_id, name, location, type, size, price_per_sec, impressions_per_day)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [authReq.user?.id, name, location, type, size, price_per_sec, impressions_per_day]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateScreen : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const { name, location, type, size, price_per_sec, impressions_per_day, status } = req.body;
    const result = await pool.query(
      `UPDATE screens SET name=COALESCE($1,name), location=COALESCE($2,location),
       type=COALESCE($3,type), size=COALESCE($4,size), price_per_sec=COALESCE($5,price_per_sec),
       impressions_per_day=COALESCE($6,impressions_per_day), status=COALESCE($7,status)
       WHERE id=$8 AND owner_id=$9 RETURNING *`,
      [name, location, type, size, price_per_sec, impressions_per_day, status, req.params.id, authReq.user?.id]
    );
    if (!result.rows[0]) { res.status(404).json({ message: 'Screen not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteScreen : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const result = await pool.query('DELETE FROM screens WHERE id=$1 AND owner_id=$2 RETURNING id', [req.params.id, authReq.user?.id]);
    if (!result.rows[0]) { res.status(404).json({ message: 'Screen not found' }); return; }
    res.json({ message: 'Screen deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
