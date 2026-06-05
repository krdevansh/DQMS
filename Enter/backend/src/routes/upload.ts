import { Router, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { authMiddleware } from '../middleware/auth';
import { adminAuthMiddleware } from '../middleware/auth';

const router = Router();

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;

    if (!image) {
      res.status(400).json({ error: 'Image data is required' });
      return;
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'dqms/receipts',
      resource_type: 'image',
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// POST /upload/profile - Upload a profile picture (base64) to Cloudinary
router.post('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;

    if (!image) {
      res.status(400).json({ error: 'Image data is required' });
      return;
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'dqms/profiles',
      resource_type: 'image',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Profile upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

function extractPublicId(url: string): string | null {
  try {
    const u = new URL(url);
    const segments = u.pathname.split('/');
    const uploadIndex = segments.findIndex(s => s === 'upload');
    if (uploadIndex === -1 || uploadIndex + 2 >= segments.length) return null;
    return segments.slice(uploadIndex + 2).join('/').replace(/\.[^.]+$/, '');
  } catch {
    return null;
  }
}

router.post('/delete', adminAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const publicId = extractPublicId(url);
    if (!publicId) {
      res.status(400).json({ error: 'Invalid Cloudinary URL' });
      return;
    }

    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'ok') {
      res.json({ message: 'Screenshot deleted successfully' });
    } else {
      res.status(400).json({ error: 'Failed to delete screenshot' });
    }
  } catch (error) {
    console.error('Delete screenshot error:', error);
    res.status(500).json({ error: 'Failed to delete screenshot' });
  }
});

export default router;
