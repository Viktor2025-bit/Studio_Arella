import { Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';


export const submitCreativeRequest : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const {
      business_name,
      contact_phone,
      ad_type,        // 'image' | 'video' | 'animated'
      description,    // what the ad should say / show
      target_audience,
      preferred_dates,
      budget_range,
      reference_links, // optional inspiration links
    } = req.body;

    if (!business_name || !contact_phone || !description) {
      res.status(400).json({ message: 'Business name, phone, and description are required' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO creative_requests (
        user_id, business_name, contact_phone, ad_type,
        description, target_audience, preferred_dates,
        budget_range, reference_links, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
      RETURNING *`,
      [
        authReq.user?.id,
        business_name,
        contact_phone,
        ad_type || 'image',
        description,
        target_audience,
        preferred_dates,
        budget_range,
        reference_links,
      ]
    );

    res.status(201).json({
      message: 'Creative request submitted! The Bems team will contact you within 24 hours.',
      request: result.rows[0],
    });

    res.status(201).json({
      message: "Creative request submitted! The Bems team will contact you within 24 hours.",
      request: result.rows[0],
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyCreativeRequests : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const result = await pool.query(
      'SELECT * FROM creative_requests WHERE user_id = $1 ORDER BY created_at DESC',
      [authReq.user?.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllCreativeRequests : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  if (authReq.user?.role !== 'admin') { res.status(403).json({ message: 'Admin only' }); return; }
  try {
    const result = await pool.query(
      `SELECT cr.*, u.name as user_name, u.email as user_email
       FROM creative_requests cr
       LEFT JOIN users u ON cr.user_id = u.id
       ORDER BY cr.created_at DESC`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCreativeRequestStatus : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  if (authReq.user?.role !== 'admin') { res.status(403).json({ message: 'Admin only' }); return; }
  try {
    const { status, admin_notes } = req.body;
    const result = await pool.query(
      'UPDATE creative_requests SET status=$1, admin_notes=$2 WHERE id=$3 RETURNING *',
      [status, admin_notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error' });
  }
};
