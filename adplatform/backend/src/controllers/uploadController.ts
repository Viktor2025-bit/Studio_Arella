import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — we stream the buffer to Cloudinary
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported. Please upload JPG, PNG, WebP, GIF, or MP4.'));
    }
  },
});

// Stream a buffer to Cloudinary
const streamToCloudinary = (buffer: Buffer, options: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

export const uploadMedia : RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file provided' });
      return;
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const folder = `bems-screens/${authReq.user?.id}`;

    const result = await streamToCloudinary(req.file.buffer, {
      folder,
      resource_type: isVideo ? 'video' : 'image',
      transformation: isVideo
        ? [{ quality: 'auto' }]
        : [{ quality: 'auto', fetch_format: 'auto' }],
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
      media_type: isVideo ? 'video' : 'image',
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height,
      duration: result.duration || null,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
};
