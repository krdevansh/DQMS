import { Patient } from '../models/Patient';
import { Appointment } from '../models/Appointment';
import mongoose from 'mongoose';

// Generate unique patient ID
export function generatePatientId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'PAT-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create or update patient profile from user registration
export async function createPatientFromUser(userId: string, data: { fullName: string; phone: string }) {
  const patientId = generatePatientId();
  const patient = new Patient({
    userId: new mongoose.Types.ObjectId(userId),
    patientId,
    fullName: data.fullName,
    phone: data.phone,
  });
  await patient.save();
  return patient;
}

// Get patient profile with appointment stats
export async function getPatientProfile(patientId: string) {
  const patient = await Patient.findById(patientId);
  if (!patient) return null;

  const [totalAppointments, upcomingAppointments, completedAppointments] = await Promise.all([
    Appointment.countDocuments({ patientId: new mongoose.Types.ObjectId(patientId) }),
    Appointment.countDocuments({ patientId: new mongoose.Types.ObjectId(patientId), status: { $in: ['booked', 'waiting'] } }),
    Appointment.countDocuments({ patientId: new mongoose.Types.ObjectId(patientId), status: 'completed' }),
  ]);

  return {
    patient,
    stats: { totalAppointments, upcomingAppointments, completedAppointments },
  };
}

// Update patient medical history
export async function updateMedicalHistory(patientId: string, entry: { condition: string; diagnosedDate: string; notes: string }) {
  return Patient.findByIdAndUpdate(
    patientId,
    { $push: { medicalHistory: entry } },
    { new: true }
  );
}

// Update patient profile
export async function updatePatientProfile(patientId: string, updates: Partial<{
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  emergencyContact: { name: string; phone: string; relation: string };
  allergies: string[];
  profileImage: string;
}>) {
  return Patient.findByIdAndUpdate(patientId, updates, { new: true });
}
