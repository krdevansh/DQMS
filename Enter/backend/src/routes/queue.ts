import { Router, Response } from 'express';
import { QueueEntry } from '../models/QueueEntry';
import { Salon } from '../models/Salon';
import { Wallet } from '../models/Wallet';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';
import mongoose from 'mongoose';

const router = Router();

// GET /queue/mine - Get current user's active queue entries with live position
// GET /queue/mine?history=true - Also include recent cancelled entries
router.get('/mine', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const includeHistory = req.query.history === 'true';

    const statusFilter: any = { $in: ['waiting', 'serving'] };
    if (includeHistory) {
      statusFilter.$in.push('cancelled', 'completed');
    }

    const rawEntries = await QueueEntry.find({
      customerId: req.user!.userId,
      status: statusFilter,
    })
      .populate('salonId', 'name slug shopNumber address city lat lng salonType image')
      .sort({ joinedAt: -1 })
      .limit(includeHistory ? 50 : 20)
      .lean();

    const entries = await Promise.all(rawEntries.map(async (entry: any) => {
      if (entry.status !== 'waiting') {
        return { ...entry, currentPosition: entry.position };
      }
      const aheadCount = await QueueEntry.countDocuments({
        salonId: entry.salonId,
        status: { $in: ['waiting', 'serving'] },
        position: { $lt: entry.position },
      });
      return { ...entry, currentPosition: aheadCount + 1 };
    }));

    res.json({ entries });
  } catch (error) {
    console.error('Get my queue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /queue/join - Join queue (self or friend, max 3 per user per salon)
router.post('/join', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { salonId, services, serviceName, price, customerName, customerPhone } = req.body;

    if (!salonId) {
      res.status(400).json({ error: 'Salon ID is required' });
      return;
    }

    const salon = await Salon.findById(salonId);
    if (!salon) {
      res.status(404).json({ error: 'Salon not found' });
      return;
    }

    if (!salon.isOpen) {
      res.status(400).json({ error: 'Salon is currently closed' });
      return;
    }

    const existingCount = await QueueEntry.countDocuments({
      salonId,
      customerId: req.user!.userId,
      status: { $in: ['waiting', 'serving'] },
    });
    if (existingCount >= 3) {
      res.status(409).json({ error: 'Maximum 3 entries per salon reached' });
      return;
    }

    let wallet = await Wallet.findOne({ userId: req.user!.userId });
    if (!wallet || wallet.balance < 3) {
      res.status(402).json({ error: 'Insufficient coins. Please recharge your wallet (minimum 3 coins required to join queue).' });
      return;
    }

    const waitingCount = await QueueEntry.countDocuments({
      salonId,
      status: { $in: ['waiting', 'serving'] },
    });

    const ticketLetter = salon.name.charAt(0).toUpperCase();

    // Count all entries for this salon created today (any status) to get daily-resetting ticket number
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await QueueEntry.countDocuments({
      salonId,
      joinedAt: { $gte: todayStart },
    });
    const ticketNum = todayCount + 1;
    const ticket = `${ticketLetter}${String(ticketNum).padStart(2, '0')}`;

    const entryServices = Array.isArray(services) && services.length > 0
      ? services.map((s: any) => ({ name: s.name, price: s.price, completed: false }))
      : serviceName
        ? [{ name: serviceName, price: price || 0, completed: false }]
        : [{ name: 'Walk-in', price: 0, completed: false }];

    const entry = new QueueEntry({
      salonId,
      customerId: req.user!.userId,
      customerName: customerName || 'Guest',
      customerPhone: customerPhone || undefined,
      ticket,
      position: waitingCount + 1,
      serviceName: entryServices.map((s: any) => s.name).join(', '),
      price: entryServices.reduce((sum: number, s: any) => sum + s.price, 0),
      services: entryServices,
      totalPrice: entryServices.reduce((sum: number, s: any) => sum + s.price, 0),
      status: 'waiting',
    });

    await entry.save();

    wallet.balance -= 3;
    wallet.transactions.push({
      amount: 3,
      type: 'debit',
      status: 'approved',
      description: `Queue join - ${salon.name} (${ticket})`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await wallet.save();

    res.status(201).json({
      message: 'Joined queue successfully',
      queueEntry: {
        id: entry._id,
        ticket: entry.ticket,
        position: entry.position,
        status: entry.status,
        customerName: entry.customerName,
        estimatedWait: `${waitingCount * 15} mins`,
      },
      wallet: { balance: wallet.balance },
    });
  } catch (error) {
    console.error('Join queue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /queue/:id/cancel - Customer cancels own queue entry
router.delete('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await QueueEntry.findById(req.params.id);
    if (!entry) {
      res.status(404).json({ error: 'Queue entry not found' });
      return;
    }
    if (entry.customerId.toString() !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    if (entry.status === 'completed' || entry.status === 'cancelled') {
      res.status(400).json({ error: 'Queue entry already closed' });
      return;
    }

    entry.status = 'cancelled';
    await entry.save();

    res.json({ message: 'Left queue', queueEntry: entry });
  } catch (error) {
    console.error('Cancel queue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /queue/stats/:salonId - Get served people counts (today, month, year, all)
router.get('/stats/:salonId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salon = await Salon.findById(req.params.salonId);
    if (!salon) {
      res.status(404).json({ error: 'Salon not found' });
      return;
    }
    if (salon.ownerId.toString() !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [todayResult, monthResult, yearResult, allResult] = await Promise.all([
      QueueEntry.aggregate([
        { $match: { salonId: new mongoose.Types.ObjectId(req.params.salonId), status: 'completed', completedAt: { $gte: startOfDay } } },
        { $group: { _id: null, count: { $sum: 1 }, earnings: { $sum: '$totalPrice' } } },
      ]),
      QueueEntry.aggregate([
        { $match: { salonId: new mongoose.Types.ObjectId(req.params.salonId), status: 'completed', completedAt: { $gte: startOfMonth } } },
        { $group: { _id: null, count: { $sum: 1 }, earnings: { $sum: '$totalPrice' } } },
      ]),
      QueueEntry.aggregate([
        { $match: { salonId: new mongoose.Types.ObjectId(req.params.salonId), status: 'completed', completedAt: { $gte: startOfYear } } },
        { $group: { _id: null, count: { $sum: 1 }, earnings: { $sum: '$totalPrice' } } },
      ]),
      QueueEntry.aggregate([
        { $match: { salonId: new mongoose.Types.ObjectId(req.params.salonId), status: 'completed' } },
        { $group: { _id: null, count: { $sum: 1 }, earnings: { $sum: '$totalPrice' } } },
      ]),
    ]);

    res.json({
      today: todayResult[0]?.count || 0,
      month: monthResult[0]?.count || 0,
      year: yearResult[0]?.count || 0,
      all: allResult[0]?.count || 0,
      todayEarnings: todayResult[0]?.earnings || 0,
      monthEarnings: monthResult[0]?.earnings || 0,
      yearEarnings: yearResult[0]?.earnings || 0,
      allEarnings: allResult[0]?.earnings || 0,
    });
  } catch (error) {
    console.error('Get salon stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /queue/:salonId - Get queue status for a salon
router.get('/:salonId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entries = await QueueEntry.find({
      salonId: req.params.salonId,
      status: { $ne: 'completed' },
    }).sort({ position: 1 });

    const serving = entries.find((e) => e.status === 'serving');
    const waiting = entries.filter((e) => e.status === 'waiting');

    const mapEntry = (e: any) => ({
      _id: e._id,
      ticket: e.ticket,
      customerName: e.customerName,
      position: e.position,
      serviceName: e.serviceName,
      price: e.price,
      services: e.services || [],
      totalPrice: e.totalPrice || e.price,
      skipNote: e.skipNote,
    });

    res.json({
      serving: serving ? mapEntry(serving) : null,
      waiting: waiting.map(mapEntry),
      totalWaiting: waiting.length,
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function checkOwner(req: AuthRequest, entryId: string): Promise<{ valid: boolean; error?: { status: number; message: string }; entry?: any }> {
  const entry = await QueueEntry.findById(entryId);
  if (!entry) return { valid: false, error: { status: 404, message: 'Queue entry not found' } };
  const salon = await Salon.findById(entry.salonId);
  if (!salon) return { valid: false, error: { status: 404, message: 'Salon not found' } };
  if (salon.ownerId.toString() !== req.user!.userId) return { valid: false, error: { status: 403, message: 'Not authorized' } };
  return { valid: true, entry };
}

// PATCH /queue/:id/serve - Serve a waiting customer
router.patch('/:id/serve', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const check = await checkOwner(req, req.params.id);
    if (!check.valid) { res.status(check.error!.status).json({ error: check.error!.message }); return; }
    const entry = check.entry!;

    entry.status = 'serving';
    entry.servedAt = new Date();
    await entry.save();

    res.json({ message: 'Now serving', queueEntry: entry });
  } catch (error) {
    console.error('Serve error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /queue/:id/tick-service/:index - Toggle a single service as completed
router.patch('/:id/tick-service/:index', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const check = await checkOwner(req, req.params.id);
    if (!check.valid) { res.status(check.error!.status).json({ error: check.error!.message }); return; }
    const entry = check.entry!;
    const index = parseInt(req.params.index, 10);

    if (isNaN(index) || index < 0 || index >= (entry.services || []).length) {
      res.status(400).json({ error: 'Invalid service index' });
      return;
    }

    entry.services[index].completed = !entry.services[index].completed;
    await entry.save();

    res.json({ message: 'Service toggled', queueEntry: entry });
  } catch (error) {
    console.error('Tick service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /queue/:id/complete - Complete current serving (mark all services completed if not already)
router.patch('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const check = await checkOwner(req, req.params.id);
    if (!check.valid) { res.status(check.error!.status).json({ error: check.error!.message }); return; }
    const entry = check.entry!;

    if (entry.services && entry.services.length > 0) {
      entry.services.forEach((s: any) => { s.completed = true; });
    }

    entry.status = 'completed';
    entry.completedAt = new Date();
    await entry.save();

    res.json({ message: 'Service completed', queueEntry: entry });
  } catch (error) {
    console.error('Complete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /queue/:id/skip - Customer didn't arrive → reposition to 3rd
router.patch('/:id/skip', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const check = await checkOwner(req, req.params.id);
    if (!check.valid) { res.status(check.error!.status).json({ error: check.error!.message }); return; }
    const entry = check.entry!;

    entry.status = 'waiting';
    entry.position = 3;
    entry.skipNote = 'As you could not reach on time you are skipped and positioned 3rd';
    await entry.save();

    await QueueEntry.updateMany({
      salonId: entry.salonId,
      _id: { $ne: entry._id },
      status: 'waiting',
      position: { $gte: 3 },
    }, { $inc: { position: 1 } });

    const nextEntry = await QueueEntry.findOne({
      salonId: entry.salonId,
      status: 'waiting',
    }).sort({ position: 1 });

    if (nextEntry) {
      nextEntry.status = 'serving';
      nextEntry.servedAt = new Date();
      await nextEntry.save();
    }

    res.json({ message: 'Customer repositioned to 3rd', queueEntry: entry });
  } catch (error) {
    console.error('Skip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /queue/:id/delete - Remove customer from queue
router.patch('/:id/delete', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const check = await checkOwner(req, req.params.id);
    if (!check.valid) { res.status(check.error!.status).json({ error: check.error!.message }); return; }
    const entry = check.entry!;

    entry.status = 'cancelled';
    await entry.save();

    res.json({ message: 'Customer removed from queue', queueEntry: entry });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
