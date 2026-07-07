import { Request, Response } from 'express';
import pool from '../db/pool';

export const getAvailability = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'start_date and end_date are required' });
    }

    const { rows } = await pool.query(
      `SELECT start_time, end_time, status 
       FROM podcast_bookings 
       WHERE start_time >= $1 AND end_time <= $2 
       AND status IN ('pending', 'confirmed', 'completed')`,
      [start_date, end_date]
    );

    res.json({ slots: rows });
  } catch (error: any) {
    console.error('Error fetching podcast availability:', error);
    res.status(500).json({ message: 'Failed to fetch availability' });
  }
};

export const reserveSlot = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { package_type, start_time, end_time, duration_minutes, addons, base_cost, addons_cost, total_cost } = req.body;

    if (!start_time || !end_time || !duration_minutes) {
      return res.status(400).json({ message: 'Missing required time fields' });
    }

    // Check for conflicts
    const conflictCheck = await pool.query(
      `SELECT id FROM podcast_bookings 
       WHERE status IN ('pending', 'confirmed', 'completed') 
       AND (start_time < $2 AND end_time > $1)`,
      [start_time, end_time]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Time slot is already booked or reserved.' });
    }

    // Generate unique booking number
    const booking_number = 'POD-' + Math.random().toString(36).substr(2, 8).toUpperCase();

    const { rows } = await pool.query(
      `INSERT INTO podcast_bookings 
       (booking_number, user_id, package_type, start_time, end_time, duration_minutes, addons, base_cost, addons_cost, total_cost, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 'pending')
       RETURNING id, booking_number`,
      [booking_number, userId, package_type || 'Audio Only', start_time, end_time, duration_minutes, JSON.stringify(addons || []), base_cost || 0, addons_cost || 0, total_cost || 0]
    );

    res.json({ message: 'Slot reserved successfully', booking_id: rows[0].id, booking_number: rows[0].booking_number });
  } catch (error: any) {
    console.error('Error reserving podcast slot:', error);
    res.status(500).json({ message: 'Failed to reserve slot' });
  }
};

export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { rows } = await pool.query(
      `SELECT * FROM podcast_bookings 
       WHERE user_id = $1 
       ORDER BY start_time DESC`,
      [userId]
    );

    res.json({ bookings: rows });
  } catch (error: any) {
    console.error('Error fetching podcast bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};
