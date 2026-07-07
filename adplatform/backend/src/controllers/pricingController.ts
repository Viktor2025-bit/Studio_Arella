import { Request, Response } from 'express';
import pool from '../db/pool';

export const getPlans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM pricing_plans WHERE active = true ORDER BY duration_minutes ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const getBaseRate = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query("SELECT value FROM platform_settings WHERE key = 'price_per_minute'");
    let rate = 333.33; // Default 20,000 NGN per hour
    if (result.rows.length > 0 && !isNaN(parseFloat(result.rows[0].value))) {
      rate = parseFloat(result.rows[0].value);
    }
    res.json({ rate });
  } catch (err) {
    res.json({ rate: 333.33 });
  }
};
