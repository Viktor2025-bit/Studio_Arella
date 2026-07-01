import { Request, Response, RequestHandler } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import { sendCreativeApprovedEmail, sendCreativeRejectedEmail } from '../services/emailService';
import { createNotification, notifyAdmins } from '../services/notificationService';

const ALLOWED_VIDEO = ['mp4', 'mov'];
const ALLOWED_IMAGE = ['jpg', 'jpeg', 'png', 'gif'];
const MAX_FILE_MB = 500;

// ── Get advertiser's creative library ────────────────────────────────────────
export const getAds: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const result = await pool.query(
      `SELECT a.*, c.name as campaign_name
       FROM ads a
       LEFT JOIN campaigns c ON a.campaign_id = c.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [authReq.user?.id]
    );
    res.json({ ads: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Upload creative (with file) ───────────────────────────────────────────────
export const createAd: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { title, campaign_id, duration_seconds, media_type } = req.body;
    if (!title) { res.status(400).json({ message: 'Ad title is required' }); return; }

    // Handle file upload if present
    let file_url = req.body.media_url || null;
    let file_type = media_type || 'image';
    let file_size = null;

    if ((req as any).file) {
      const file = (req as any).file;
      const ext = path.extname(file.originalname).toLowerCase().slice(1);

      // Validate format
      const isVideo = ALLOWED_VIDEO.includes(ext);
      const isImage = ALLOWED_IMAGE.includes(ext);
      if (!isVideo && !isImage) {
        fs.unlinkSync(file.path);
        res.status(400).json({ message: `Unsupported format. Allowed: ${[...ALLOWED_VIDEO, ...ALLOWED_IMAGE].join(', ')}` });
        return;
      }

      // Validate size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > MAX_FILE_MB) {
        fs.unlinkSync(file.path);
        res.status(400).json({ message: `File too large. Maximum size is ${MAX_FILE_MB}MB.` });
        return;
      }

      file_url = `/uploads/${file.filename}`;
      file_type = isVideo ? 'video' : ext === 'gif' ? 'gif' : 'image';
      file_size = file.size;
    }

    const result = await pool.query(
      `INSERT INTO ads (user_id, campaign_id, title, media_url, file_url, file_type, file_size,
                        duration_seconds, status, media_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
       RETURNING *`,
      [
        authReq.user?.id,
        campaign_id || null,
        title,
        file_url,
        file_url,
        file_type,
        file_size,
        parseInt(duration_seconds) || 30,
        file_type,
      ]
    );

    // Notify all admins a new creative needs review
    notifyAdmins({
      type: 'new_creative_review',
      title: 'New creative awaiting review',
      body: `${result.rows[0].title} was uploaded and is pending your approval.`,
      link: '/admin/review',
    });

    res.status(201).json({
      ad: result.rows[0],
      message: 'Creative uploaded and submitted for admin review. You\'ll be notified when approved.',
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
};

// ── Update ad ─────────────────────────────────────────────────────────────────
export const updateAd: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { title, campaign_id } = req.body;
    const result = await pool.query(
      `UPDATE ads SET title = COALESCE($1, title), campaign_id = COALESCE($2, campaign_id)
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [title, campaign_id, req.params.id, authReq.user?.id]
    );
    if (!result.rows[0]) { res.status(404).json({ message: 'Ad not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Delete ad ─────────────────────────────────────────────────────────────────
export const deleteAd: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const result = await pool.query(
      'DELETE FROM ads WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, authReq.user?.id]
    );
    if (!result.rows[0]) { res.status(404).json({ message: 'Ad not found' }); return; }

    // Delete physical file if exists
    if (result.rows[0].file_url?.startsWith('/uploads/')) {
      const fp = path.join(__dirname, '../../public', result.rows[0].file_url);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    res.json({ message: 'Ad deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Admin: review queue ───────────────────────────────────────────────────────
export const getAdminReviewQueue: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  if (authReq.user?.role !== 'admin') { res.status(403).json({ message: 'Admin only' }); return; }
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as advertiser_name, u.email as advertiser_email
       FROM ads a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY CASE WHEN a.status = 'pending' THEN 0 ELSE 1 END, a.created_at DESC`
    );
    res.json({ queue: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Admin: approve or reject creative ────────────────────────────────────────
export const reviewAd: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  if (authReq.user?.role !== 'admin') { res.status(403).json({ message: 'Admin only' }); return; }
  try {
    const { decision, rejection_reason } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      res.status(400).json({ message: 'Decision must be "approved" or "rejected"' }); return;
    }
    if (decision === 'rejected' && !rejection_reason?.trim()) {
      res.status(400).json({ message: 'Rejection reason is required when rejecting a creative' }); return;
    }

    const result = await pool.query(
      `UPDATE ads SET status = $1, rejection_reason = $2,
                      reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4
       RETURNING *, (SELECT email FROM users WHERE id = ads.user_id) as advertiser_email,
                    (SELECT name FROM users WHERE id = ads.user_id) as advertiser_name`,
      [decision, rejection_reason || null, authReq.user?.id, req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ message: 'Creative not found' }); return; }

    const ad = result.rows[0];

    // Email notification
    if (decision === 'approved') {
      sendCreativeApprovedEmail(ad.advertiser_email, ad.advertiser_name, ad.title).catch(console.error);
    } else {
      sendCreativeRejectedEmail(ad.advertiser_email, ad.advertiser_name, ad.title, rejection_reason).catch(console.error);
    }

    // In-app notification to advertiser
    createNotification({
      user_id: ad.user_id,
      type: decision === 'approved' ? 'creative_approved' : 'creative_rejected',
      title: decision === 'approved' ? 'Creative approved!' : 'Creative not approved',
      body: decision === 'approved'
        ? `Your creative "${ad.title}" has been approved. You can now attach it to a booking.`
        : `Your creative "${ad.title}" was rejected: ${rejection_reason}`,
      link: '/ads',
    });

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (admin_id, admin_name, action_type, entity_type, entity_id, after_state)
       VALUES ($1, $2, $3, 'creative', $4, $5)`,
      [authReq.user?.id, authReq.user?.role, `CREATIVE_${decision.toUpperCase()}`, ad.id, JSON.stringify({ status: decision, rejection_reason })]
    );

    res.json({ ad, message: `Creative ${decision}` });
  } catch (err) {
    res.status(500).json({ message: 'Review failed' });
  }
};
