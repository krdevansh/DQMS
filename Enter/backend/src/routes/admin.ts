import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { adminAuthMiddleware } from '../middleware/auth';
import { User } from '../models/User';
import { Salon } from '../models/Salon';
import { Booking } from '../models/Booking';
import { QueueEntry } from '../models/QueueEntry';
import { Wallet } from '../models/Wallet';
import { Subscription } from '../models/Subscription';
import { Hospital } from '../models/Hospital';
import { School } from '../models/School';
import { AuthRequest, AdminLoginBody } from '../types';

const router = Router();

// In-memory admin password (resets on server restart; persists via .env for cold starts)
let adminPassword = env.ADMIN_PASSWORD;

// ─── Admin Login ────────────────────────────────────────────────────────────────
router.post('/login', (req: Request, res: Response): void => {
  const { adminId, password } = req.body as AdminLoginBody;

  if (!adminId || !password) {
    res.status(400).json({ error: 'Admin ID and password are required' });
    return;
  }

  if (adminId !== env.ADMIN_ID || password !== adminPassword) {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }

  const token = jwt.sign({ userId: 'admin', role: 'admin' }, env.JWT_SECRET, {
    expiresIn: '8h',
  });

  res.json({ message: 'Admin login successful', token });
});

// ─── Change Admin Password ───────────────────────────────────────────────────
router.post('/change-password', adminAuthMiddleware, (req: AuthRequest, res: Response): void => {
  const { newPassword } = req.body as { newPassword: string };

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  adminPassword = newPassword;
  res.json({ message: 'Password updated successfully' });
});

// ─── Get All Salons ──────────────────────────────────────────────────────────
router.get('/salons', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salons = await Salon.find().sort({ createdAt: -1 });
    res.json({ salons, total: salons.length });
  } catch (error) {
    console.error('Admin get salons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Verify Salon ────────────────────────────────────────────────────────────
router.post('/salons/:id/verify', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salon = await Salon.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!salon) {
      res.status(404).json({ error: 'Salon not found' });
      return;
    }
    res.json({ message: 'Salon verified successfully', salon });
  } catch (error) {
    console.error('Admin verify salon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Unverify Salon ──────────────────────────────────────────────────────────
router.post('/salons/:id/unverify', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salon = await Salon.findByIdAndUpdate(req.params.id, { isVerified: false }, { new: true });
    if (!salon) {
      res.status(404).json({ error: 'Salon not found' });
      return;
    }
    res.json({ message: 'Salon unverified', salon });
  } catch (error) {
    console.error('Admin unverify salon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Delete Salon ────────────────────────────────────────────────────────────
router.delete('/salons/:id', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salon = await Salon.findByIdAndDelete(req.params.id);
    if (!salon) {
      res.status(404).json({ error: 'Salon not found' });
      return;
    }
    res.json({ message: 'Salon deleted successfully', shopNumber: salon.shopNumber });
  } catch (error) {
    console.error('Admin delete salon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get All Users ───────────────────────────────────────────────────────────
router.get('/users', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-pin').sort({ createdAt: -1 });
    res.json({ users, total: users.length });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get User By ID ──────────────────────────────────────────────────────────
router.get('/users/:id', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-pin');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Delete User ─────────────────────────────────────────────────────────────
router.delete('/users/:id', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get All Bookings ────────────────────────────────────────────────────────
router.get('/bookings', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await Booking.find()
      .populate('salonId', 'name city')
      .sort({ createdAt: -1 });
    res.json({ bookings, total: bookings.length });
  } catch (error) {
    console.error('Admin get bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Delete Booking ──────────────────────────────────────────────────────────
router.delete('/bookings/:id', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Admin delete booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Get All Queue Entries ───────────────────────────────────────────────────
router.get('/queue', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entries = await QueueEntry.find()
      .populate('salonId', 'name city')
      .sort({ createdAt: -1 });
    res.json({ entries, total: entries.length });
  } catch (error) {
    console.error('Admin get queue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Delete Queue Entry ──────────────────────────────────────────────────────
router.delete('/queue/:id', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await QueueEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      res.status(404).json({ error: 'Queue entry not found' });
      return;
    }
    res.json({ message: 'Queue entry deleted successfully' });
  } catch (error) {
    console.error('Admin delete queue entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Wallet / Recharge Admin Endpoints ──────────────────────────────────────────

router.get('/recharges/pending', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wallets = await Wallet.find({
      'transactions': { $elemMatch: { type: 'recharge', status: 'pending' } },
    }).populate('userId', 'name phone');

    const recharges = wallets.flatMap((wallet) =>
      wallet.transactions
        .filter((t) => t.type === 'recharge' && t.status === 'pending')
        .map((t) => ({
          _id: t._id,
          walletId: wallet._id,
          userId: wallet.userId,
          amount: t.amount,
          utr: t.utr,
          screenshot: t.screenshot,
          status: t.status,
          createdAt: t.createdAt,
        }))
    );

    recharges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ recharges });
  } catch (error) {
    console.error('Admin get pending recharges error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/recharges/all', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wallets = await Wallet.find({
      'transactions': { $elemMatch: { type: 'recharge' } },
    }).populate('userId', 'name phone');

    const recharges = wallets.flatMap((wallet) =>
      wallet.transactions
        .filter((t) => t.type === 'recharge')
        .map((t) => ({
          _id: t._id,
          walletId: wallet._id,
          userId: wallet.userId,
          amount: t.amount,
          utr: t.utr,
          screenshot: t.screenshot,
          status: t.status,
          createdAt: t.createdAt,
        }))
    );

    recharges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ recharges });
  } catch (error) {
    console.error('Admin get all recharges error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/recharges/approve/:transactionId', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const { amount } = req.body as { amount?: number };
    const wallet = await Wallet.findOne({ 'transactions._id': transactionId });

    if (!wallet) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const txn = (wallet.transactions as any).id(transactionId);
    if (!txn || txn.status !== 'pending') {
      res.status(400).json({ error: 'Transaction is not pending' });
      return;
    }

    const creditAmount = amount && amount > 0 && amount <= txn.amount ? amount : txn.amount;

    txn.status = 'approved';
    txn.approvedAmount = creditAmount;
    txn.updatedAt = new Date();
    wallet.balance += creditAmount;

    await wallet.save();
    res.json({ message: 'Recharge approved successfully', balance: wallet.balance });
  } catch (error) {
    console.error('Admin approve recharge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/recharges/reject/:transactionId', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const wallet = await Wallet.findOne({ 'transactions._id': transactionId });

    if (!wallet) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const txn = (wallet.transactions as any).id(transactionId);
    if (!txn || txn.status !== 'pending') {
      res.status(400).json({ error: 'Transaction is not pending' });
      return;
    }

    txn.status = 'rejected';
    txn.updatedAt = new Date();
    await wallet.save();

    res.json({ message: 'Recharge rejected' });
  } catch (error) {
    console.error('Admin reject recharge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Subscription Admin Endpoints ──────────────────────────────────────────────

router.get('/subscriptions/hospitals', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subs = await Subscription.find({ role: 'hospital_admin' })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ subscriptions: subs });
  } catch (error) {
    console.error('Admin get hospital subscriptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/subscriptions/schools', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subs = await Subscription.find({ role: 'school_admin' })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ subscriptions: subs });
  } catch (error) {
    console.error('Admin get school subscriptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/subscriptions/salons', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subs = await Subscription.find({ role: 'salon_admin' })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ subscriptions: subs });
  } catch (error) {
    console.error('Admin get salon subscriptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/subscriptions/approve/:id', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }
    if (sub.status !== 'pending') {
      res.status(400).json({ error: 'Subscription is not pending' });
      return;
    }

    sub.status = 'active';
    sub.startDate = new Date();
    const days = sub.plan === '3month' ? 90 : 30;
    sub.endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await sub.save();

    res.json({ message: 'Subscription approved', subscription: sub });
  } catch (error) {
    console.error('Admin approve subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/subscriptions/reject/:id', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }
    if (sub.status !== 'pending') {
      res.status(400).json({ error: 'Subscription is not pending' });
      return;
    }

    sub.status = 'rejected';
    await sub.save();

    res.json({ message: 'Subscription rejected', subscription: sub });
  } catch (error) {
    console.error('Admin reject subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Screenshot Deletion Endpoints ─────────────────────────────────────────────

router.post('/recharges/delete-screenshot/:transactionId', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wallet = await Wallet.findOne({ 'transactions._id': req.params.transactionId });
    if (!wallet) { res.status(404).json({ error: 'Transaction not found' }); return; }

    const txn = (wallet.transactions as any).id(req.params.transactionId);
    if (!txn) { res.status(404).json({ error: 'Transaction not found' }); return; }

    txn.screenshot = undefined;
    await wallet.save();
    res.json({ message: 'Screenshot removed' });
  } catch (error) {
    console.error('Delete screenshot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/subscriptions/delete-screenshot/:id', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) { res.status(404).json({ error: 'Subscription not found' }); return; }

    sub.screenshot = '';
    await sub.save();
    res.json({ message: 'Screenshot removed' });
  } catch (error) {
    console.error('Delete screenshot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Hospital Admin Endpoints ──────────────────────────────────────────────────

router.get('/hospitals', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospitals = await Hospital.find().sort({ createdAt: -1 });
    res.json({ hospitals, total: hospitals.length });
  } catch (error) {
    console.error('Admin get hospitals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/hospitals/:id/verify', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    res.json({ message: 'Hospital verified', hospital });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/hospitals/:id/unverify', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, { isVerified: false }, { new: true });
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    res.json({ message: 'Hospital unverified', hospital });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/hospitals/:id', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    res.json({ message: 'Hospital deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── School Admin Endpoints ────────────────────────────────────────────────────

router.get('/schools', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schools = await School.find().select('-adminPin').sort({ createdAt: -1 });
    res.json({ schools, total: schools.length });
  } catch (error) {
    console.error('Admin get schools error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/schools/:id', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) { res.status(404).json({ error: 'School not found' }); return; }
    res.json({ message: 'School deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
