import { Router, Response } from 'express';
import { authMiddleware, roleAuth } from '../middleware/auth';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { Wallet } from '../models/Wallet';

const router = Router();

const PLAN_PRICES: Record<string, Record<string, number>> = {
  hospital_admin: { '1month': 500 },
  school_admin: { '1month': 2000 },
  salon_admin: { '1month': 30, '3month': 85 },
};

router.post('/request', authMiddleware, roleAuth('hospital_admin', 'school_admin', 'salon_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { utr, screenshot, plan } = req.body;
    const role = req.user!.role as 'hospital_admin' | 'school_admin' | 'salon_admin';

    if (!utr || !screenshot) {
      res.status(400).json({ error: 'UTR and screenshot are required' });
      return;
    }

    if (!/^\d{12}$/.test(utr)) {
      res.status(400).json({ error: 'UTR must be exactly 12 digits' });
      return;
    }

    const effectivePlan = plan || '1month';
    const prices = PLAN_PRICES[role];
    if (!prices || !prices[effectivePlan]) {
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }
    const amount = prices[effectivePlan];

    const existingUtrSub = await Subscription.findOne({ utr });
    if (existingUtrSub) {
      res.status(409).json({ error: 'This UTR has already been used for a subscription' });
      return;
    }

    const walletUtr = await Wallet.findOne({ 'transactions.utr': utr });
    if (walletUtr) {
      res.status(409).json({ error: 'This UTR has already been used for a wallet recharge' });
      return;
    }

    const existingActive = await Subscription.findOne({ userId: req.user!.userId, status: 'active' });
    if (existingActive) {
      res.status(409).json({ error: 'You already have an active subscription' });
      return;
    }

    const subscription = new Subscription({
      userId: req.user!.userId,
      role,
      plan: effectivePlan,
      amount,
      utr,
      screenshot,
      status: 'pending',
    });

    await subscription.save();

    res.status(201).json({
      message: 'Subscription request submitted for admin approval',
      subscription,
    });
  } catch (error) {
    console.error('Subscription request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/my-status', authMiddleware, roleAuth('hospital_admin', 'school_admin', 'salon_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const user = await User.findById(req.user!.userId).select('trialStartDate trialEndDate');
    const sub = await Subscription.findOne({ userId: req.user!.userId }).sort({ createdAt: -1 });

    const trialActive = !!(user?.trialEndDate && user.trialEndDate > now);

    res.json({
      subscription: sub || null,
      trial: user ? {
        startDate: user.trialStartDate,
        endDate: user.trialEndDate,
        active: trialActive,
      } : null,
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
