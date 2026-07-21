import { Request, Response, RequestHandler } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import { sendCreativeApprovedEmail, sendCreativeRejectedEmail, sendAdminNewCreativeAlert } from '../services/emailService';
import { createNotification, notifyAdmins } from '../services/notificationService';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

      try {
        const folder = `bems-screens/${authReq.user?.id}`;
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder,
          resource_type: isVideo ? 'video' : 'image',
          transformation: isVideo ? [{ quality: 'auto' }] : [{ quality: 'auto', fetch_format: 'auto' }],
        });

        file_url = uploadResult.secure_url;
        file_type = isVideo ? 'video' : ext === 'gif' ? 'gif' : 'image';
        file_size = file.size;

        // Delete local temporary file
        fs.unlinkSync(file.path);
      } catch (uploadErr) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        console.error('Cloudinary upload error:', uploadErr);
        res.status(500).json({ message: 'Cloudinary upload failed' });
        return;
      }
    }

    const isVideoFile = file_type === 'video';
    const initialStatus = isVideoFile ? 'pending' : 'approved';
    const reviewedAt = isVideoFile ? null : new Date();

    const result = await pool.query(
      `INSERT INTO ads (user_id, campaign_id, title, media_url, file_url, file_type, file_size,
                        duration_seconds, status, media_type, reviewed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
        initialStatus,
        file_type,
        reviewedAt
      ]
    );

    const createdAd = result.rows[0];

    // Trigger AI moderation webhook if it's a video
    if (isVideoFile && file_url) {
      try {
        await fetch('https://bems003.app.n8n.cloud/webhook-test/moderate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ad_id: createdAd.id,
            title: createdAd.title,
            media_url: createdAd.media_url,
            user_id: createdAd.user_id
          })
        });
      } catch (webhookErr) {
        console.error('Failed to trigger moderation webhook:', webhookErr);
      }
    }

    res.status(201).json({
      ad: createdAd,
      message: isVideoFile
        ? 'Your video has been uploaded successfully and is currently being analyzed by AI for approval.'
        : 'Your creative has been uploaded successfully! It is now approved and ready to be used in your bookings.',
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
