import { Router, Response } from 'express';
import { Hospital } from '../models/Hospital';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';
import * as analyticsService from '../services/analyticsService';
import * as queueService from '../services/queueService';

const router = Router();

// GET /api/analytics/daily - Daily analytics
router.get('/daily', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findOne({ adminId: req.user!.userId });
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const analytics = await analyticsService.getDailyAnalytics(hospital._id.toString(), date);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/weekly - Weekly analytics
router.get('/weekly', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findOne({ adminId: req.user!.userId });
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    const analytics = await analyticsService.getWeeklyAnalytics(hospital._id.toString());
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/monthly - Monthly analytics
router.get('/monthly', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findOne({ adminId: req.user!.userId });
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
    const analytics = await analyticsService.getMonthlyAnalytics(hospital._id.toString(), year, month);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/queue - Queue stats
router.get('/queue', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findOne({ adminId: req.user!.userId });
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    const stats = await queueService.getQueueStats(hospital._id.toString());
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/overview - Dashboard overview
router.get('/overview', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findOne({ adminId: req.user!.userId });
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    const [daily, queueStats] = await Promise.all([
      analyticsService.getDailyAnalytics(hospital._id.toString(), new Date().toISOString().split('T')[0]),
      queueService.getQueueStats(hospital._id.toString()),
    ]);
    res.json({ daily, queueStats });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
