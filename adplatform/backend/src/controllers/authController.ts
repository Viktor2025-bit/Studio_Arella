import { Request, Response, RequestHandler } from 'express';
import pool from '../db/pool';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import {
  sendVerificationEmail, sendWelcomeEmail,
  sendPasswordResetEmail,
} from '../services/emailService';

const signToken = (payload: object) =>
  jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);

// ── Register ──────────────────────────────────────────────────────────────────
export const register: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { first_name, last_name, email, password, business_name, phone } = req.body;

    if (!first_name || !last_name || !email || !password) {
      res.status(400).json({ message: 'First name, last name, email, and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ message: 'An account with this email already exists' });
      return;
    }

    const fullName = `${first_name.trim()} ${last_name.trim()}`;
    const hashed = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, first_name, last_name, email, password, role, business_name, phone, email_verified)
       VALUES ($1, $2, $3, $4, $5, 'advertiser', $6, $7, false)
       RETURNING id, name, first_name, last_name, email, role, credits, business_name, phone`,
      [fullName, first_name.trim(), last_name.trim(), email, hashed, business_name || null, phone || null]
    );
    const user = result.rows[0];

    // Create verification token
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [user.id, token]
    );

    // Send verification email (non-blocking)
    sendVerificationEmail(email, first_name.trim(), token).catch(console.error);

    const jwtToken = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.status(201).json({
      token: jwtToken,
      user: { ...user, email_verified: false },
      message: 'Account created! Please check your email to verify your account.',
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

// ── Verify email ──────────────────────────────────────────────────────────────
export const verifyEmail: RequestHandler = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) { res.status(400).json({ message: 'Token is required' }); return; }

    const result = await pool.query(
      `SELECT * FROM email_verification_tokens
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    );
    if (!result.rows[0]) {
      res.status(400).json({ message: 'Invalid or expired verification link. Please request a new one.' });
      return;
    }

    const tokenRow = result.rows[0];

    await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [tokenRow.user_id]);
    await pool.query('UPDATE email_verification_tokens SET used = true WHERE id = $1', [tokenRow.id]);

    // Send welcome email
    const user = await pool.query('SELECT name, email FROM users WHERE id = $1', [tokenRow.user_id]);
    sendWelcomeEmail(user.rows[0].email, user.rows[0].name).catch(console.error);

    res.json({ message: 'Email verified successfully! Your account is now active.' });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed' });
  }
};

// ── Resend verification ───────────────────────────────────────────────────────
export const resendVerification: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!user.rows[0]) { res.json({ message: 'If this email exists, a verification link has been sent.' }); return; }
    if (user.rows[0].email_verified) { res.status(400).json({ message: 'Email is already verified.' }); return; }

    // Invalidate old tokens
    await pool.query('UPDATE email_verification_tokens SET used = true WHERE user_id = $1', [user.rows[0].id]);

    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [user.rows[0].id, token]
    );
    sendVerificationEmail(email, user.rows[0].name, token).catch(console.error);
    res.json({ message: 'Verification email sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ message: 'Email and password are required' }); return; }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) { res.status(401).json({ message: 'Incorrect email or password' }); return; }

    if (user.suspended) {
      res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
      return;
    }
    if (!user.password) {
      res.status(401).json({ message: 'This account uses Google sign-in. Please use "Continue with Google".' });
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) { res.status(401).json({ message: 'Incorrect email or password' }); return; }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
};

// ── Get current user ──────────────────────────────────────────────────────────
export const getMe: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const result = await pool.query(
      `SELECT id, name, first_name, last_name, email, role, credits, business_name, phone, logo_url,
              avatar, email_verified, suspended, language, created_at
       FROM users WHERE id = $1`,
      [authReq.user?.id]
    );
    if (!result.rows[0]) { res.status(404).json({ message: 'User not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Update profile ────────────────────────────────────────────────────────────
export const updateProfile: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { first_name, last_name, business_name, phone, language, logo_url } = req.body;
    const fullName = first_name && last_name ? `${first_name.trim()} ${last_name.trim()}` : undefined;
    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           business_name = COALESCE($4, business_name),
           phone = COALESCE($5, phone),
           language = COALESCE($6, language),
           logo_url = COALESCE($7, logo_url)
       WHERE id = $8
       RETURNING id, name, first_name, last_name, email, role, credits, business_name, phone, logo_url, language`,
      [fullName, first_name, last_name, business_name, phone, language, logo_url, authReq.user?.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
};

// ── Forgot password ───────────────────────────────────────────────────────────
export const forgotPassword: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;
    // Always return success to prevent email enumeration
    res.json({ message: 'If this email is registered, a password reset link has been sent.' });

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!user.rows[0]) return;

    // Invalidate old tokens
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE user_id = $1', [user.rows[0].id]);

    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
      [user.rows[0].id, token]
    );
    sendPasswordResetEmail(email, user.rows[0].name, token).catch(console.error);
  } catch (err) {
    console.error('Forgot password error:', err);
  }
};

// ── Reset password ────────────────────────────────────────────────────────────
export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) { res.status(400).json({ message: 'Token and password are required' }); return; }
    if (password.length < 6) { res.status(400).json({ message: 'Password must be at least 6 characters' }); return; }

    const result = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    );
    if (!result.rows[0]) {
      res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, result.rows[0].user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [result.rows[0].id]);
    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    res.status(500).json({ message: 'Reset failed' });
  }
};
