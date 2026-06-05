import { Router, Response } from 'express';
import { Patient } from '../models/Patient';
import { authMiddleware, roleAuth } from '../middleware/auth';
import { AuthRequest } from '../types';
import * as patientService from '../services/patientService';

const router = Router();

// GET /api/patients/profile - Get my patient profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findOne({ userId: req.user!.userId });
    if (!patient) {
      // Auto-create patient profile
      const newPatient = await patientService.createPatientFromUser(req.user!.userId, {
        fullName: req.user!.name || 'Patient',
        phone: req.user!.phone || '',
      });
      res.json({ patient: newPatient });
      return;
    }
    const profile = await patientService.getPatientProfile(patient._id.toString());
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/patients/profile - Update patient profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findOne({ userId: req.user!.userId });
    if (!patient) { res.status(404).json({ error: 'Patient not found' }); return; }
    const updated = await patientService.updatePatientProfile(patient._id.toString(), req.body);
    res.json({ message: 'Profile updated', patient: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/patients/medical-history - Add medical history entry
router.post('/medical-history', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findOne({ userId: req.user!.userId });
    if (!patient) { res.status(404).json({ error: 'Patient not found' }); return; }
    const { condition, diagnosedDate, notes } = req.body;
    if (!condition) { res.status(400).json({ error: 'Condition is required' }); return; }
    const updated = await patientService.updateMedicalHistory(patient._id.toString(), { condition, diagnosedDate, notes });
    res.json({ message: 'Medical history updated', patient: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
