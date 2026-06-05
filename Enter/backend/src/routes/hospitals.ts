import { Router, Response } from 'express';
import { Hospital } from '../models/Hospital';
import { Doctor } from '../models/Doctor';
import { Department } from '../models/Department';
import { Appointment } from '../models/Appointment';
import { authMiddleware, roleAuth } from '../middleware/auth';
import { AuthRequest } from '../types';
import * as hospitalService from '../services/hospitalService';
import * as appointmentService from '../services/appointmentService';
import * as queueService from '../services/queueService';
import * as doctorService from '../services/doctorService';
import * as notificationService from '../services/notificationService';
import { emitQueueUpdate, emitAppointmentBooked, emitDoctorStatusChanged, emitPatientCalled } from '../socket';

const router = Router();

// GET /api/hospitals - List/search hospitals with pagination
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, city, pincode, lat, lng, page, limit } = req.query;
    const result = await hospitalService.searchHospitals(
      {
        search: search as string,
        city: city as string,
        pincode: pincode as string,
        lat: lat ? parseFloat(lat as string) : undefined,
        lng: lng ? parseFloat(lng as string) : undefined,
      },
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );
    res.json(result);
  } catch (error) {
    console.error('List hospitals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospitals/my - Get my hospital
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'hospital_admin') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    const hospital = await Hospital.findOne({ adminId: req.user.userId });
    if (!hospital) {
      res.status(404).json({ error: 'No hospital found for this admin' });
      return;
    }
    res.json({ hospital });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospitals/:slug - Get hospital details
router.get('/:slug', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const details = await hospitalService.getHospitalDetails(req.params.slug);
    if (!details) {
      res.status(404).json({ error: 'Hospital not found' });
      return;
    }
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/hospitals - Create hospital
router.post('/', authMiddleware, roleAuth('hospital_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, address, city, state, pincode, description, latitude, longitude, image, openTime, closeTime, emergencyAvailable } = req.body;
    if (!name || !address || !city || !pincode) {
      res.status(400).json({ error: 'Name, address, city, and pincode are required' });
      return;
    }
    const slug = hospitalService.generateSlug(name);
    const existing = await Hospital.findOne({ slug });
    if (existing) {
      res.status(409).json({ error: 'A hospital with this name already exists' });
      return;
    }
    const hospitalId = await hospitalService.generateHospitalId(pincode);
    const hospital = new Hospital({
      adminId: req.user!.userId,
      hospitalId,
      name, slug, email, phone, address, city, state, pincode,
      description, latitude, longitude,
      location: (latitude && longitude) ? { type: 'Point', coordinates: [longitude, latitude] } : undefined,
      image, openTime, closeTime,
      emergencyAvailable: emergencyAvailable || false,
    });
    await hospital.save();
    res.status(201).json({ message: 'Hospital created', hospital });
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/hospitals/:id - Update hospital
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    if (hospital.adminId.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' }); return;
    }
    const updates = req.body;
    delete updates.adminId; delete updates.slug;
    if (updates.latitude && updates.longitude) {
      updates.location = { type: 'Point', coordinates: [updates.longitude, updates.latitude] };
    }
    Object.assign(hospital, updates);
    await hospital.save();
    res.json({ message: 'Hospital updated', hospital });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospitals/:hospitalId/doctors - List doctors
router.get('/:hospitalId/doctors', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doctors = await doctorService.getHospitalDoctors(req.params.hospitalId);
    res.json({ doctors });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/hospitals/:hospitalId/doctors - Add doctor
router.post('/:hospitalId/doctors', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    if (hospital.adminId.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' }); return;
    }
    const doctorId = doctorService.generateDoctorId();
    const doctor = new Doctor({ ...req.body, hospitalId: req.params.hospitalId, doctorId });
    await doctor.save();
    res.status(201).json({ message: 'Doctor added', doctor });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospitals/:hospitalId/doctors/:doctorId/slots - Get available time slots
router.get('/:hospitalId/doctors/:doctorId/slots', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    if (!date) { res.status(400).json({ error: 'Date query parameter required' }); return; }
    const slots = await appointmentService.getAvailableSlots(req.params.doctorId, date as string);
    res.json({ slots });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/hospitals/:hospitalId/doctors/:doctorId - Update doctor
router.put('/:hospitalId/doctors/:doctorId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    if (hospital.adminId.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' }); return;
    }
    const doctor = await Doctor.findByIdAndUpdate(req.params.doctorId, req.body, { new: true });
    if (!doctor) { res.status(404).json({ error: 'Doctor not found' }); return; }
    if (req.body.status) {
      emitDoctorStatusChanged(req.params.doctorId, { doctorId: req.params.doctorId, status: req.body.status, hospitalId: req.params.hospitalId });
    }
    res.json({ message: 'Doctor updated', doctor });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/hospitals/:hospitalId/doctors/:doctorId - Remove doctor
router.delete('/:hospitalId/doctors/:doctorId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    if (hospital.adminId.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' }); return;
    }
    await Doctor.findByIdAndDelete(req.params.doctorId);
    res.json({ message: 'Doctor removed' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospitals/:hospitalId/departments - List departments
router.get('/:hospitalId/departments', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await Department.find({ hospitalId: req.params.hospitalId, isActive: true });
    res.json({ departments });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/hospitals/:hospitalId/departments - Add department
router.post('/:hospitalId/departments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    if (hospital.adminId.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' }); return;
    }
    const dept = new Department({ ...req.body, hospitalId: req.params.hospitalId });
    await dept.save();
    res.status(201).json({ message: 'Department added', department: dept });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/hospitals/:hospitalId/departments/:deptId - Remove department
router.delete('/:hospitalId/departments/:deptId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    if (hospital.adminId.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' }); return;
    }
    await Department.findByIdAndUpdate(req.params.deptId, { isActive: false });
    res.json({ message: 'Department removed' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/hospitals/appointments - Book appointment
router.post('/appointments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hospitalId, doctorId, date, timeSlot, departmentId, complaint } = req.body;
    if (!hospitalId || !doctorId || !date || !timeSlot) {
      res.status(400).json({ error: 'hospitalId, doctorId, date, and timeSlot are required' });
      return;
    }
    // Validate slot
    const slotCheck = await appointmentService.validateSlot(doctorId, date, timeSlot);
    if (!slotCheck.available) {
      res.status(409).json({ error: slotCheck.message });
      return;
    }
    // Get patient name from user or patient model
    const user = req.user!;
    const patientName = user.name || 'Patient';
    const patientPhone = user.phone || '';

    const result = await appointmentService.bookAppointment({
      hospitalId, doctorId,
      patientId: user.userId,
      departmentId,
      patientName, patientPhone,
      date, timeSlot,
      complaint,
      bookingType: 'online',
    });

    // Create notification
    await notificationService.createNotification({
      hospitalId, recipientId: user.userId,
      recipientRole: 'patient',
      type: 'appointment_confirmed',
      title: 'Appointment Booked',
      message: `Appointment booked for ${date} at ${timeSlot}. Ticket: ${result.ticket}`,
      data: { appointmentId: result.appointment._id.toString(), ticket: result.ticket },
    });

    // Socket emits
    emitAppointmentBooked(user.userId, { appointment: result.appointment, ticket: result.ticket, queuePosition: result.queuePosition });
    emitQueueUpdate(hospitalId, { queuePosition: result.queuePosition, totalWaiting: result.queuePosition });

    res.status(201).json({ message: 'Appointment booked', ...result });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospitals/appointments/my - Get my appointments
router.get('/appointments/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page } = req.query;
    const result = await appointmentService.getPatientAppointments(req.user!.userId, parseInt(page as string) || 1);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospitals/:hospitalId/appointments/today - Today's appointments
router.get('/:hospitalId/appointments/today', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
    if (hospital.adminId.toString() !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' }); return;
    }
    const appointments = await appointmentService.getTodayAppointments(req.params.hospitalId);
    res.json({ appointments, total: appointments.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/hospitals/appointments/:id/status - Update appointment status
router.patch('/appointments/:id/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    let appointment;
    if (status === 'cancelled') appointment = await appointmentService.cancelAppointment(req.params.id);
    else if (status === 'completed') appointment = await appointmentService.completeAppointment(req.params.id);
    else if (status === 'missed') appointment = await appointmentService.missAppointment(req.params.id);
    else appointment = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (!appointment) { res.status(404).json({ error: 'Appointment not found' }); return; }
    emitQueueUpdate(appointment.hospitalId.toString(), { appointmentId: req.params.id, status });
    res.json({ message: 'Status updated', appointment });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospitals/:hospitalId/queue - Get queue
router.get('/:hospitalId/queue', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.query;
    const result = await queueService.getHospitalQueue(req.params.hospitalId, doctorId as string);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/hospitals/queue/:id/serve - Serve patient
router.patch('/queue/:id/serve', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await queueService.servePatient(req.params.id);
    if (!entry) { res.status(404).json({ error: 'Queue entry not found' }); return; }
    emitQueueUpdate(entry.hospitalId.toString(), { queueEntryId: req.params.id, status: 'with-doctor' });
    emitPatientCalled(entry.patientId?.toString() || '', { ticket: entry.ticket, doctorId: entry.doctorId });
    res.json({ message: 'Now serving', entry });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/hospitals/queue/:id/complete - Complete patient
router.patch('/queue/:id/complete', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await queueService.completePatient(req.params.id);
    if (!entry) { res.status(404).json({ error: 'Queue entry not found' }); return; }
    emitQueueUpdate(entry.hospitalId.toString(), { queueEntryId: req.params.id, status: 'completed' });
    res.json({ message: 'Completed', entry });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/hospitals/queue/:id/skip - Skip patient
router.patch('/queue/:id/skip', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await queueService.skipPatient(req.params.id);
    if (!entry) { res.status(404).json({ error: 'Queue entry not found' }); return; }
    emitQueueUpdate(entry.hospitalId.toString(), { queueEntryId: req.params.id, status: 'skipped' });
    res.json({ message: 'Skipped', entry });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
