import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminAuthMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';
import { Wallet } from '../models/Wallet';

const router = Router();

async function getOrCreateWallet(userId: string) {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = new Wallet({ userId, balance: 0, transactions: [] });
    await wallet.save();
  }
  return wallet;
}

router.get('/balance', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wallet = await getOrCreateWallet(req.user!.userId);
    res.json({ balance: wallet.balance });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/history', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wallet = await getOrCreateWallet(req.user!.userId);
    const transactions = [...wallet.transactions].reverse();
    res.json({ transactions });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/recharge-request', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, utr, screenshot } = req.body;

    if (!amount || !utr || !screenshot) {
      res.status(400).json({ error: 'Amount, UTR, and screenshot are required' });
      return;
    }

    if (!/^\d{12}$/.test(utr)) {
      res.status(400).json({ error: 'UTR must be exactly 12 digits' });
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 10 || numAmount > 200) {
      res.status(400).json({ error: 'Amount must be between ₹10 and ₹200' });
      return;
    }

    const wallet = await getOrCreateWallet(req.user!.userId);

    const hasPending = wallet.transactions.some(
      (t) => t.type === 'recharge' && t.status === 'pending'
    );
    if (hasPending) {
      res.status(409).json({ error: 'You already have a pending recharge request' });
      return;
    }

    const existingUtr = await Wallet.findOne({
      'transactions': { $elemMatch: { utr, type: 'recharge', status: { $in: ['pending', 'approved'] } } },
    });
    if (existingUtr) {
      res.status(409).json({ error: 'This UTR number has already been used for a recharge request' });
      return;
    }

    wallet.transactions.push({
      amount: numAmount,
      type: 'recharge',
      utr,
      screenshot,
      status: 'pending',
      description: `Recharge of ₹${numAmount}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await wallet.save();

    res.status(201).json({
      message: 'Recharge request submitted for admin approval',
      transaction: wallet.transactions[wallet.transactions.length - 1],
    });
  } catch (error) {
    console.error('Recharge request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/pending', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wallets = await Wallet.find({
      'transactions': { $elemMatch: { type: 'recharge', status: 'pending' } },
    }).populate('userId', 'name phone');

    const pendingRecharges = wallets.flatMap((wallet) =>
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

    pendingRecharges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ recharges: pendingRecharges });
  } catch (error) {
    console.error('Get pending recharges error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/all', adminAuthMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wallets = await Wallet.find({
      'transactions': { $elemMatch: { type: 'recharge' } },
    }).populate('userId', 'name phone');

    const allRecharges = wallets.flatMap((wallet) =>
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

    allRecharges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ recharges: allRecharges });
  } catch (error) {
    console.error('Get all recharges error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/approve/:transactionId', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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

    txn.status = 'approved';
    txn.updatedAt = new Date();
    wallet.balance += txn.amount;

    wallet.transactions.push({
      amount: txn.amount,
      type: 'credit',
      status: 'approved',
      description: `Recharge approved - ₹${txn.amount} added`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await wallet.save();

    res.json({ message: 'Recharge approved successfully', balance: wallet.balance });
  } catch (error) {
    console.error('Approve recharge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reject/:transactionId', adminAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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
    console.error('Reject recharge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
