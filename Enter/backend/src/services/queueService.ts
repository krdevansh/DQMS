import { HospitalQueueEntry } from '../models/HospitalQueueEntry';
import { Appointment } from '../models/Appointment';
import mongoose from 'mongoose';

// Get queue for a hospital
export async function getHospitalQueue(hospitalId: string, doctorId?: string) {
  const filter: Record<string, unknown> = {
    hospitalId: new mongoose.Types.ObjectId(hospitalId),
    status: { $in: ['waiting', 'with-doctor'] },
  };
  if (doctorId) filter.doctorId = new mongoose.Types.ObjectId(doctorId);

  const entries = await HospitalQueueEntry.find(filter).sort({ position: 1 }).lean();
  const serving = entries.find((e: any) => e.status === 'with-doctor') || null;
  const waiting = entries.filter((e: any) => e.status === 'waiting');

  return { serving, waiting, totalWaiting: waiting.length };
}

// Serve next patient
export async function servePatient(queueEntryId: string) {
  const entry = await HospitalQueueEntry.findByIdAndUpdate(
    queueEntryId,
    { status: 'with-doctor', calledAt: new Date() },
    { new: true }
  );
  if (entry) {
    await Appointment.findByIdAndUpdate(entry.appointmentId, { status: 'waiting' });
  }
  return entry;
}

// Complete patient
export async function completePatient(queueEntryId: string) {
  const entry = await HospitalQueueEntry.findByIdAndUpdate(
    queueEntryId,
    { status: 'completed', completedAt: new Date() },
    { new: true }
  );
  if (entry) {
    const appointment = await Appointment.findById(entry.appointmentId);
    if (appointment) {
      const actualWait = Math.round((new Date().getTime() - new Date(entry.createdAt).getTime()) / 60000);
      await Appointment.findByIdAndUpdate(entry.appointmentId, { status: 'completed', actualWaitTime: actualWait });
    }
  }
  return entry;
}

// Skip patient
export async function skipPatient(queueEntryId: string) {
  const entry = await HospitalQueueEntry.findByIdAndUpdate(queueEntryId, { status: 'skipped' }, { new: true });
  if (entry) {
    await Appointment.findByIdAndUpdate(entry.appointmentId, { status: 'missed' });
  }
  return entry;
}

// Get queue statistics for dashboard
export async function getQueueStats(hospitalId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const [totalWaiting, totalServed, totalSkipped, avgWaitTime] = await Promise.all([
    HospitalQueueEntry.countDocuments({ hospitalId: new mongoose.Types.ObjectId(hospitalId), status: 'waiting' }),
    HospitalQueueEntry.countDocuments({ hospitalId: new mongoose.Types.ObjectId(hospitalId), status: 'completed', createdAt: { $gte: new Date(today) } }),
    HospitalQueueEntry.countDocuments({ hospitalId: new mongoose.Types.ObjectId(hospitalId), status: 'skipped', createdAt: { $gte: new Date(today) } }),
    HospitalQueueEntry.aggregate([
      { $match: { hospitalId: new mongoose.Types.ObjectId(hospitalId), status: 'completed', completedAt: { $ne: null } } },
      { $project: { waitTime: { $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 60000] } } },
      { $group: { _id: null, avg: { $avg: '$waitTime' } } },
    ]),
  ]);

  return { totalWaiting, totalServed, totalSkipped, avgWaitMinutes: Math.round(avgWaitTime[0]?.avg || 0) };
}
