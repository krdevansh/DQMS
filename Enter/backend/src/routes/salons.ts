import { Router, Response } from 'express';
import { Salon } from '../models/Salon';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function generateShopNumber(pincode: string): Promise<string> {
  const count = await Salon.countDocuments({ pincode });
  return `${pincode}-${String(count + 1).padStart(3, '0')}`;
}

async function getNextAvailableNumber(pincode: string): Promise<string> {
  const existing = await Salon.find({ pincode }).select('shopNumber');
  const used = new Set(existing.map(s => s.shopNumber.split('-')[1]));
  for (let i = 1; i <= 999; i++) {
    const seq = String(i).padStart(3, '0');
    if (!used.has(seq)) return `${pincode}-${seq}`;
  }
  throw new Error('No available shop numbers for this pincode');
}

router.get('/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'salon') {
      res.status(403).json({ error: 'Only salon owners can access this' });
      return;
    }
    const salon = await Salon.findOne({ ownerId: req.user.userId });
    if (!salon) {
      res.status(404).json({ error: 'No salon found for this owner' });
      return;
    }
    const prefix = salon.shopNumber?.split('-')[0];
    if (prefix && prefix !== salon.pincode) {
      salon.shopNumber = await getNextAvailableNumber(salon.pincode);
      await salon.save();
    }
    res.json({ salon });
  } catch (error) {
    console.error('Get my salon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pincode, city, search } = req.query;
    const filter: Record<string, unknown> = {};

    if (pincode) filter.pincode = pincode;
    if (city) filter.city = new RegExp(String(city), 'i');

    if (search) {
      const q = String(search);
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { city: new RegExp(q, 'i') },
        { address: new RegExp(q, 'i') },
        { 'services.name': new RegExp(q, 'i') },
      ];
    }

    const salons = await Salon.find(filter).sort({ rating: -1 });
    if (salons.length === 0) { res.json({ salons: [] }); return; }

    const now = new Date();
    const ownerIds = [...new Set(salons.map(s => s.ownerId.toString()))];

    const [activeTrials, activeSubs] = await Promise.all([
      User.find({ _id: { $in: ownerIds }, trialEndDate: { $gt: now } }).select('_id'),
      Subscription.find({ userId: { $in: ownerIds }, status: 'active' }).select('userId'),
    ]);

    const activeTrialIds = new Set(activeTrials.map(u => u._id.toString()));
    const activeSubIds = new Set(activeSubs.map(s => s.userId.toString()));
    const validOwnerIds = new Set([...activeTrialIds, ...activeSubIds]);

    const visible = salons.filter(s => validOwnerIds.has(s.ownerId.toString()));
    res.json({ salons: visible });
  } catch (error) {
    console.error('List salons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:slug', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salon = await Salon.findOne({ slug: req.params.slug });
    if (!salon) {
      res.status(404).json({ error: 'Salon not found' });
      return;
    }
    res.json({ salon });
  } catch (error) {
    console.error('Get salon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'salon') {
      res.status(403).json({ error: 'Only salon owners can create salons' });
      return;
    }

    const { name, email, phone, address, city, pincode, description, salonType, lat, lng, services, members, image, customNumber } = req.body;

    if (!name || !address || !city || !pincode) {
      res.status(400).json({ error: 'Name, address, city, and pincode are required' });
      return;
    }

    let shopNumber: string;
    if (customNumber) {
      const seq = String(customNumber).padStart(3, '0');
      const candidate = `${pincode}-${seq}`;
      const exists = await Salon.findOne({ shopNumber: candidate });
      if (exists) {
        res.status(409).json({ error: `Shop number ${candidate} is already taken. Please try another.` });
        return;
      }
      shopNumber = candidate;
    } else {
      shopNumber = await getNextAvailableNumber(pincode);
    }
    const slug = generateSlug(name);

    const salon = new Salon({
      ownerId: req.user.userId,
      shopNumber,
      slug,
      name,
      email,
      phone,
      address,
      city,
      pincode,
      description,
      salonType,
      lat,
      lng,
      services: services || [],
      members: members || [],
      image,
    });

    await salon.save();
    res.status(201).json({ message: 'Salon created successfully', salon });
  } catch (error) {
    console.error('Create salon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salon = await Salon.findById(req.params.id);
    if (!salon) {
      res.status(404).json({ error: 'Salon not found' });
      return;
    }

    if (salon.ownerId.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized to update this salon' });
      return;
    }

    const updates = req.body;
    delete updates.ownerId;
    delete updates.shopNumber;
    delete updates.slug;

    Object.assign(salon, updates);

    const prefix = salon.shopNumber?.split('-')[0];
    if (prefix && prefix !== salon.pincode) {
      salon.shopNumber = await getNextAvailableNumber(salon.pincode);
    }

    await salon.save();

    res.json({ message: 'Salon updated successfully', salon });
  } catch (error) {
    console.error('Update salon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
