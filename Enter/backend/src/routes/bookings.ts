import { Router, Response } from 'express';
import { Booking } from '../models/Booking';
import { Salon } from '../models/Salon';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { salonId, serviceName, price, date, time, customerName, customerPhone } = req.body;

    if (!salonId || !serviceName || !date || !time) {
      res.status(400).json({ error: 'Salon ID, service name, date, and time are required' });
      return;
    }

    const salon = await Salon.findById(salonId);
    if (!salon) {
      res.status(404).json({ error: 'Salon not found' });
      return;
    }

    const booking = new Booking({
      salonId,
      customerId: req.user!.userId,
      customerName: customerName || 'Guest',
      customerPhone: customerPhone || '',
      serviceName,
      price: price || 0,
      date,
      time,
      status: 'confirmed',
    });

    await booking.save();

    res.status(201).json({
      message: 'Booking confirmed',
      booking: {
        id: booking._id,
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await Booking.find({ customerId: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/salon/:salonId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await Booking.find({ salonId: req.params.salonId })
      .sort({ date: -1 })
      .limit(50);

    res.json({ bookings });
  } catch (error) {
    console.error('Get salon bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
