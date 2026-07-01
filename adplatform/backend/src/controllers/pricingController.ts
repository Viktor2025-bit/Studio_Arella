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
