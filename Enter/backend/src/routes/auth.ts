import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest, RegisterBody, LoginBody } from '../types';
import { sendWhatsAppOtp, waitForReady } from '../services/whatsapp';
import { verifyPhoneToken, isFirebaseConfigured } from '../services/firebase';

const router = Router();

function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

// ─── In-memory OTP stores ──────────────────────────────────────────────────────
// For forgot-pin flow
const otpStore = new Map<string, { otp: string; expiresAt: number }>();
// For register flow — tracks which phones have been OTP-verified
const registerOtpStore = new Map<string, { otp: string; expiresAt: number; verified: boolean }>();

// ─── Register: Send OTP ────────────────────────────────────────────────────────
router.post('/send-register-otp', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone } = req.body as { phone: string };
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      res.status(409).json({ error: 'Phone number already registered' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    registerOtpStore.set(phone, { otp, expiresAt: Date.now() + 10 * 60 * 1000, verified: false });

    try {
      const ready = await waitForReady(20000);
      if (ready) {
        await sendWhatsAppOtp(phone, otp);
      }
    } catch (waErr: any) {
      console.error('WhatsApp OTP error:', waErr.message);
    }

    const isDev = env.NODE_ENV !== 'production';
    res.json({
      message: isDev ? `OTP: ${otp}` : 'OTP sent to your WhatsApp',
      expiresIn: 600,
      ...(isDev ? { otp } : {}),
    });
  } catch (error) {
    console.error('Send register OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Register: Verify OTP ─────────────────────────────────────────────────────
router.post('/verify-register-otp', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body as { phone: string; otp: string };
    if (!phone || !otp) {
      res.status(400).json({ error: 'Phone and OTP are required' });
      return;
    }

    const stored = registerOtpStore.get(phone);
    if (!stored) {
      res.status(400).json({ error: 'No OTP found. Request a new one.' });
      return;
    }
    if (Date.now() > stored.expiresAt) {
      registerOtpStore.delete(phone);
      res.status(400).json({ error: 'OTP has expired. Request a new one.' });
      return;
    }
    if (stored.otp !== otp) {
      res.status(400).json({ error: 'Invalid OTP. Please try again.' });
      return;
    }

    // Mark phone as verified (keep in store until register completes)
    registerOtpStore.set(phone, { ...stored, verified: true });
    res.json({ message: 'Phone verified successfully' });
  } catch (error) {
    console.error('Verify register OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, salonName, email, phone, pin, role } = req.body as RegisterBody;

    if (!phone || !pin) {
      res.status(400).json({ error: 'Phone and PIN are required' });
      return;
    }

    if (pin.length !== 5 || !/^\d{5}$/.test(pin)) {
      res.status(400).json({ error: 'PIN must be a 5-digit number' });
      return;
    }

    // Ensure phone was OTP-verified
    const regEntry = registerOtpStore.get(phone);
    if (!regEntry || !regEntry.verified) {
      res.status(403).json({ error: 'Phone number not verified. Please complete OTP verification.' });
      return;
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      res.status(409).json({ error: 'Phone number already registered' });
      return;
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const user = new User({
      name,
      salonName,
      email,
      phone,
      pin: hashedPin,
      role,
    });

    await user.save();

    // Clean up OTP store after successful registration
    registerOtpStore.delete(phone);

    const token = generateToken(user._id.toString(), role);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        salonName: user.salonName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone, pin, role } = req.body as LoginBody;

    if (!phone || !pin) {
      res.status(400).json({ error: 'Phone and PIN are required' });
      return;
    }

    const user = await User.findOne({ phone, role });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        salonName: user.salonName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Forgot PIN: Send OTP via WhatsApp ────────────────────────────────────────
router.post('/forgot-pin', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone } = req.body as { phone: string };
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const user = await User.findOne({ phone });
    if (!user) {
      res.status(404).json({ error: 'No account found with this phone number' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    try {
      const ready = await waitForReady(20000);
      if (ready) {
        await sendWhatsAppOtp(phone, otp);
      }
    } catch (waErr: any) {
      console.error('WhatsApp OTP error:', waErr.message);
    }

    const isDev = env.NODE_ENV !== 'production';
    res.json({
      message: isDev ? `OTP: ${otp}` : 'OTP sent to your WhatsApp',
      expiresIn: 600,
      ...(isDev ? { otp } : {}),
    });
  } catch (error) {
    console.error('Forgot PIN error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Verify OTP (forgot-pin flow) ─────────────────────────────────────────────
router.post('/verify-otp', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body as { phone: string; otp: string };
    if (!phone || !otp) {
      res.status(400).json({ error: 'Phone and OTP are required' });
      return;
    }

    const stored = otpStore.get(phone);
    if (!stored) {
      res.status(400).json({ error: 'No OTP found. Request a new one.' });
      return;
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      res.status(400).json({ error: 'OTP has expired. Request a new one.' });
      return;
    }

    if (stored.otp !== otp) {
      res.status(400).json({ error: 'Invalid OTP. Please try again.' });
      return;
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Reset PIN ─────────────────────────────────────────────────────────────────
router.post('/reset-pin', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone, otp, newPin } = req.body as { phone: string; otp: string; newPin: string };

    if (!phone || !otp || !newPin) {
      res.status(400).json({ error: 'Phone, OTP, and new PIN are required' });
      return;
    }

    if (newPin.length !== 5 || !/^\d{5}$/.test(newPin)) {
      res.status(400).json({ error: 'PIN must be a 5-digit number' });
      return;
    }

    const stored = otpStore.get(phone);
    if (!stored) {
      res.status(400).json({ error: 'No OTP found. Request a new one.' });
      return;
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      res.status(400).json({ error: 'OTP has expired. Request a new one.' });
      return;
    }

    if (stored.otp !== otp) {
      res.status(400).json({ error: 'Invalid OTP. Please try again.' });
      return;
    }

    otpStore.delete(phone);

    const hashedPin = await bcrypt.hash(newPin, 10);
    const user = await User.findOneAndUpdate({ phone }, { pin: hashedPin }, { new: true });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'PIN reset successfully' });
  } catch (error) {
    console.error('Reset PIN error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Firebase Phone Auth: Verify ID Token ──────────────────────────────────────
router.post('/firebase-verify', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { idToken, purpose } = req.body as { idToken: string; purpose: 'register' | 'forgot-pin' };

    if (!idToken) {
      res.status(400).json({ error: 'ID token is required' });
      return;
    }

    if (!isFirebaseConfigured()) {
      res.status(503).json({ error: 'Firebase is not configured on the server.' });
      return;
    }

    const { phone } = await verifyPhoneToken(idToken);

    if (purpose === 'register') {
      const existing = await User.findOne({ phone });
      if (existing) {
        res.status(409).json({ error: 'Phone number already registered' });
        return;
      }
      registerOtpStore.set(phone, { otp: 'firebase-verified', expiresAt: Date.now() + 10 * 60 * 1000, verified: true });
    }

    res.json({ message: 'Phone verified successfully', phone });
  } catch (error: any) {
    console.error('Firebase verify error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// ─── Get profile ───────────────────────────────────────────────────────────────
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId).select('-pin');
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Update profile ────────────────────────────────────────────────────────────
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, faceShape, gender, age, profilePic } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (faceShape !== undefined) updates.faceShape = faceShape;
    if (gender !== undefined) updates.gender = gender;
    if (age !== undefined) updates.age = age;
    if (profilePic !== undefined) updates.profilePic = profilePic;

    const user = await User.findByIdAndUpdate(req.user!.userId, updates, { new: true }).select('-pin');
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
