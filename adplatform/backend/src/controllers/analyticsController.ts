import { Request, Response, NextFunction, RequestHandler } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const userId = authReq.user?.id;

    const [revenueRes, campaignRes, screenRes, analyticsRes] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(total_cost), 0) as total FROM bookings WHERE user_id = $1 AND status != 'cancelled'`,
        [userId]
      ),
      pool.query(`SELECT COUNT(*) FROM campaigns WHERE user_id = $1 AND status = 'active'`, [userId]),
      pool.query(`SELECT COUNT(*) FROM screens WHERE owner_id = $1 AND status = 'active'`, [userId]),
      pool.query(
        `SELECT date_trunc('hour', created_at) as hour, SUM(impressions) as impressions
         FROM analytics WHERE user_id = $1 AND date = CURRENT_DATE
         GROUP BY hour ORDER BY hour`,
        [userId]
      ),
    ]);

    res.json({
      total_revenue: parseFloat(revenueRes.rows[0].total),
      active_campaigns: parseInt(campaignRes.rows[0].count),
      active_screens: parseInt(screenRes.rows[0].count),
      hourly_analytics: analyticsRes.rows,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getHourlyAnalytics : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    const { date = 'today', campaign_id } = req.query;
    const targetDate = date === 'today' ? 'CURRENT_DATE' : `'${date}'::date`;

    let query = `SELECT hour, SUM(impressions) as impressions, SUM(views) as views, SUM(clicks) as clicks
      FROM analytics WHERE user_id = $1 AND date = ${targetDate}`;
    const params: any[] = [authReq.user?.id];

    if (campaign_id) { params.push(campaign_id); query += ` AND campaign_id = $${params.length}`; }
    query += ' GROUP BY hour ORDER BY hour';

    const result = await pool.query(query, params);

    // Fill missing hours with 0
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const found = result.rows.find((r) => r.hour === i);
      return { hour: i, impressions: found ? parseInt(found.impressions) : 0, views: found ? parseInt(found.views) : 0 };
    });

    res.json(hourlyData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdvertiserProofOfPlay: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const result = await pool.query(
      `SELECT 
         c.title AS creative_title,
         b.booking_number,
         COUNT(p.id) AS play_count,
         MAX(p.end_timestamp) AS last_played
       FROM proof_of_play_logs p
       JOIN ads c ON p.creative_id = c.id
       JOIN bookings b ON p.booking_id = b.id
       WHERE c.user_id = $1
       GROUP BY c.id, b.id, c.title, b.booking_number
       ORDER BY MAX(p.end_timestamp) DESC`,
      [authReq.user?.id]
    );

    const totalsRes = await pool.query(
      `SELECT COUNT(p.id) AS total_plays
       FROM proof_of_play_logs p
       JOIN ads c ON p.creative_id = c.id
       WHERE c.user_id = $1`,
      [authReq.user?.id]
    );

    res.json({
      breakdown: result.rows,
      total_plays: parseInt(totalsRes.rows[0]?.total_plays || '0')
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};

