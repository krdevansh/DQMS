import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';
import * as notificationService from '../services/notificationService';

const router = Router();

// GET /api/notifications - Get my notifications
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page } = req.query;
    const role = req.user!.role;
    const recipientRole = role === 'patient' ? 'patient' : role === 'doctor' ? 'doctor' : 'hospital_admin';
    const result = await notificationService.getUserNotifications(req.user!.userId, recipientRole, parseInt(page as string) || 1);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    if (!notification) { res.status(404).json({ error: 'Notification not found' }); return; }
    res.json({ message: 'Marked as read', notification });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notifications/read-all - Mark all as read
router.post('/read-all', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user!.role;
    const recipientRole = role === 'patient' ? 'patient' : role === 'doctor' ? 'doctor' : 'hospital_admin';
    await notificationService.markAllAsRead(req.user!.userId, recipientRole);
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
