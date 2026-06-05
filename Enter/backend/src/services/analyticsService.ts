import { Appointment } from '../models/Appointment';
import { HospitalQueueEntry } from '../models/HospitalQueueEntry';
import { Doctor } from '../models/Doctor';
import mongoose from 'mongoose';

// Daily analytics
export async function getDailyAnalytics(hospitalId: string, date: string) {
  const objectId = new mongoose.Types.ObjectId(hospitalId);

  const [totalAppointments, completedAppointments, cancelledAppointments, missedAppointments, queueEntries, doctorCount] = await Promise.all([
    Appointment.countDocuments({ hospitalId: objectId, date }),
    Appointment.countDocuments({ hospitalId: objectId, date, status: 'completed' }),
    Appointment.countDocuments({ hospitalId: objectId, date, status: 'cancelled' }),
    Appointment.countDocuments({ hospitalId: objectId, date, status: 'missed' }),
    HospitalQueueEntry.countDocuments({ hospitalId: objectId, status: { $in: ['waiting', 'with-doctor'] } }),
    Doctor.countDocuments({ hospitalId: objectId, isAvailable: true }),
  ]);

  // Department-wise breakdown
  const departmentStats = await Appointment.aggregate([
    { $match: { hospitalId: objectId, date } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);

  return {
    date,
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    missedAppointments,
    activeQueue: queueEntries,
    availableDoctors: doctorCount,
    departmentStats,
    completionRate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0,
  };
}

// Weekly analytics
export async function getWeeklyAnalytics(hospitalId: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const objectId = new mongoose.Types.ObjectId(hospitalId);

  const dailyStats = await Appointment.aggregate([
    { $match: { hospitalId: objectId, date: { $gte: startStr, $lte: endStr } } },
    { $group: { _id: '$date', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
    { $sort: { _id: 1 } },
  ]);

  const totalAppointments = dailyStats.reduce((acc: number, d: any) => acc + d.total, 0);

  return {
    startDate: startStr,
    endDate: endStr,
    totalAppointments,
    dailyStats,
    averagePerDay: Math.round(totalAppointments / 7),
  };
}

// Monthly analytics
export async function getMonthlyAnalytics(hospitalId: string, year: number, month: number) {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const objectId = new mongoose.Types.ObjectId(hospitalId);

  const [totalAppointments, doctorPerformance, peakHours] = await Promise.all([
    Appointment.countDocuments({ hospitalId: objectId, date: { $regex: `^${monthStr}` } }),
    Appointment.aggregate([
      { $match: { hospitalId: objectId, date: { $regex: `^${monthStr}` } } },
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Appointment.aggregate([
      { $match: { hospitalId: objectId, date: { $regex: `^${monthStr}` } } },
      { $group: { _id: '$timeSlot', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return {
    month: monthStr,
    totalAppointments,
    doctorPerformance,
    peakHours,
  };
}
