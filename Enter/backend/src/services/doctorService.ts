import { Doctor } from '../models/Doctor';
import { Appointment } from '../models/Appointment';
import mongoose from 'mongoose';

// Generate unique doctor ID
export function generateDoctorId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'DOC-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get doctors for a hospital with today's load
export async function getHospitalDoctors(hospitalId: string) {
  const today = new Date().toISOString().split('T')[0];
  const doctors = await Doctor.find({ hospitalId: new mongoose.Types.ObjectId(hospitalId) }).lean();
  
  const doctorsWithLoad = await Promise.all(
    doctors.map(async (doc: any) => {
      const todayPatients = await Appointment.countDocuments({
        doctorId: doc._id,
        date: today,
        status: { $nin: ['cancelled', 'missed'] },
      });
      return { ...doc, todayPatients, available: todayPatients < doc.maxPatientsPerDay };
    })
  );
  
  return doctorsWithLoad;
}

// Update doctor availability
export async function updateDoctorStatus(doctorId: string, status: 'available' | 'busy' | 'offline' | 'on_leave') {
  const doctor = await Doctor.findByIdAndUpdate(doctorId, { status, isAvailable: status === 'available' }, { new: true });
  return doctor;
}

// Check if doctor is available for a given date/time
export async function isDoctorAvailable(doctorId: string, date: string, timeSlot: string): Promise<boolean> {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor || !doctor.isAvailable || doctor.status !== 'available') return false;

  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  const slot = doctor.availableSlots.find((s: any) => s.day === dayName && s.isAvailable);
  if (!slot) return false;

  // Check if time is within working hours
  if (timeSlot < slot.startTime || timeSlot >= slot.endTime) return false;

  // Check max patients
  const todayCount = await Appointment.countDocuments({
    doctorId: new mongoose.Types.ObjectId(doctorId),
    date,
    status: { $nin: ['cancelled', 'missed'] },
  });
  
  return todayCount < doctor.maxPatientsPerDay;
}

// Get doctor's appointments for today
export async function getDoctorTodayAppointments(doctorId: string) {
  const today = new Date().toISOString().split('T')[0];
  return Appointment.find({ doctorId: new mongoose.Types.ObjectId(doctorId), date: today })
    .sort({ queuePosition: 1 })
    .lean();
}
