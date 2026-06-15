import { Appointment } from '../models/Appointment';
import { HospitalQueueEntry } from '../models/HospitalQueueEntry';
import { Doctor } from '../models/Doctor';
import { Patient } from '../models/Patient';
import mongoose from 'mongoose';

// Get available time slots for a doctor on a given date
export async function getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return [];

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[new Date(date).getDay()];

  const daySlots = doctor.availableSlots.find(
    (s) => s.day.toLowerCase() === dayName && s.isAvailable
  );
  if (!daySlots) return [];

  // Generate slots based on doctor's availability
  const slots: string[] = [];
  const [startH, startM] = daySlots.startTime.split(':').map(Number);
  const [endH, endM] = daySlots.endTime.split(':').map(Number);
  const duration = daySlots.slotDuration || 30;

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + duration <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += duration;
  }

  // Remove already booked slots
  const booked = await Appointment.find({
    doctorId: new mongoose.Types.ObjectId(doctorId),
    date,
    status: { $nin: ['cancelled', 'missed'] },
  });
  const bookedTimes = new Set(booked.map((a) => a.timeSlot));

  return slots.filter((s) => !bookedTimes.has(s));
}

// Generate unique appointment ID
export function generateAppointmentId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'APT-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate ticket number
export function generateTicket(position: number): string {
  return `H-${String(position).padStart(3, '0')}`;
}

// Validate slot availability
export async function validateSlot(doctorId: string, date: string, timeSlot: string): Promise<{ available: boolean; message?: string }> {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return { available: false, message: 'Doctor not found' };
  if (!doctor.isAvailable || doctor.status !== 'available') return { available: false, message: 'Doctor is not available' };

  // Check if slot is already booked
  const existing = await Appointment.findOne({ doctorId: new mongoose.Types.ObjectId(doctorId), date, timeSlot, status: { $nin: ['cancelled', 'missed'] } });
  if (existing) return { available: false, message: 'This slot is already booked' };

  // Check daily limit
  const todayCount = await Appointment.countDocuments({ doctorId: new mongoose.Types.ObjectId(doctorId), date, status: { $nin: ['cancelled', 'missed'] } });
  if (todayCount >= doctor.maxPatientsPerDay) return { available: false, message: 'Doctor has reached maximum patients for today' };

  return { available: true };
}

// Book appointment (creates appointment + queue entry)
export async function bookAppointment(data: {
  hospitalId: string;
  doctorId: string;
  patientId: string;
  departmentId?: string;
  patientName: string;
  patientPhone: string;
  date: string;
  timeSlot: string;
  complaint?: string;
  bookingType?: 'online' | 'walk-in' | 'follow-up';
}) {
  try {
    // Get current queue position
    const todayCount = await Appointment.countDocuments({
      hospitalId: new mongoose.Types.ObjectId(data.hospitalId),
      date: data.date,
      status: { $nin: ['cancelled', 'missed'] },
    });
    
    const queuePosition = todayCount + 1;
    const estimatedWaitTime = queuePosition * 15;

    // Create appointment
    const appointmentId = generateAppointmentId();
    const appointment = new Appointment({
      hospitalId: new mongoose.Types.ObjectId(data.hospitalId),
      doctorId: new mongoose.Types.ObjectId(data.doctorId),
      patientId: new mongoose.Types.ObjectId(data.patientId),
      departmentId: data.departmentId ? new mongoose.Types.ObjectId(data.departmentId) : undefined,
      appointmentId,
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      date: data.date,
      timeSlot: data.timeSlot,
      status: 'booked',
      queuePosition,
      estimatedWaitTime,
      complaint: data.complaint || '',
      bookingType: data.bookingType || 'online',
    });
    await appointment.save();

    // Create queue entry
    const ticket = generateTicket(queuePosition);
    const queueEntry = new HospitalQueueEntry({
      hospitalId: new mongoose.Types.ObjectId(data.hospitalId),
      doctorId: new mongoose.Types.ObjectId(data.doctorId),
      departmentId: data.departmentId ? new mongoose.Types.ObjectId(data.departmentId) : undefined,
      appointmentId: appointment._id,
      patientId: new mongoose.Types.ObjectId(data.patientId),
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      ticket,
      position: queuePosition,
      status: 'waiting',
      department: '',
      complaint: data.complaint || '',
      estimatedWaitMinutes: estimatedWaitTime,
    });
    await queueEntry.save();

    // Update doctor's current patient count
    await Doctor.findByIdAndUpdate(data.doctorId, { $inc: { currentPatientsToday: 1 } });

    return { appointment, queueEntry, ticket, queuePosition, estimatedWaitTime };
  } catch (error) {
    throw error;
  }
}

// Get patient's appointments with pagination
export async function getPatientAppointments(patientId: string, page = 1, limit = 20) {
  const [appointments, total] = await Promise.all([
    Appointment.find({ patientId: new mongoose.Types.ObjectId(patientId) })
      .populate('hospitalId', 'name city slug')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Appointment.countDocuments({ patientId: new mongoose.Types.ObjectId(patientId) }),
  ]);
  return { appointments, total, page, totalPages: Math.ceil(total / limit) };
}

// Get today's appointments for a hospital
export async function getTodayAppointments(hospitalId: string) {
  const today = new Date().toISOString().split('T')[0];
  return Appointment.find({ hospitalId: new mongoose.Types.ObjectId(hospitalId), date: today })
    .populate('doctorId', 'name specialization')
    .sort({ queuePosition: 1 })
    .lean();
}

// Cancel appointment
export async function cancelAppointment(appointmentId: string) {
  const appointment = await Appointment.findByIdAndUpdate(appointmentId, { status: 'cancelled' }, { new: true });
  if (appointment) {
    await HospitalQueueEntry.findOneAndUpdate({ appointmentId: appointment._id }, { status: 'cancelled' });
    await Doctor.findByIdAndUpdate(appointment.doctorId, { $inc: { currentPatientsToday: -1 } });
  }
  return appointment;
}

// Complete appointment
export async function completeAppointment(appointmentId: string) {
  const appointment = await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' }, { new: true });
  if (appointment) {
    await HospitalQueueEntry.findOneAndUpdate({ appointmentId: appointment._id }, { status: 'completed', completedAt: new Date() });
  }
  return appointment;
}

// Mark as missed
export async function missAppointment(appointmentId: string) {
  const appointment = await Appointment.findByIdAndUpdate(appointmentId, { status: 'missed' }, { new: true });
  if (appointment) {
    await HospitalQueueEntry.findOneAndUpdate({ appointmentId: appointment._id }, { status: 'skipped' });
  }
  return appointment;
}
