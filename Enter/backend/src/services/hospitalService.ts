import { Hospital } from '../models/Hospital';
import { Doctor } from '../models/Doctor';
import { Department } from '../models/Department';
import { Appointment } from '../models/Appointment';
import { HospitalQueueEntry } from '../models/HospitalQueueEntry';

// Generate unique hospital ID from pincode + sequential number
export async function generateHospitalId(pincode: string): Promise<string> {
  const prefix = pincode.slice(0, 6);
  const existing = await Hospital.find({ hospitalId: new RegExp(`^${prefix}`) })
    .sort({ hospitalId: -1 })
    .limit(1)
    .lean();
  let seq = 1;
  if (existing.length > 0) {
    const last = parseInt(existing[0].hospitalId.slice(-2), 10);
    seq = (last || 0) + 1;
  }
  return `${prefix}${String(seq).padStart(2, '0')}`;
}

// Generate slug from name
export function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Get hospital with full details (doctors, departments, stats)
export async function getHospitalDetails(slug: string) {
  const hospital = await Hospital.findOne({ slug });
  if (!hospital) return null;
  
  const doctors = await Doctor.find({ hospitalId: hospital._id, isAvailable: true });
  const departments = await Department.find({ hospitalId: hospital._id, isActive: true });
  
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = await Appointment.countDocuments({ hospitalId: hospital._id, date: today });
  const activeQueue = await HospitalQueueEntry.countDocuments({ hospitalId: hospital._id, status: { $in: ['waiting', 'with-doctor'] } });
  
  return {
    hospital,
    doctors,
    departments,
    stats: { todayAppointments, activeQueue, totalDoctors: doctors.length, totalDepartments: departments.length },
  };
}

// Search hospitals with filters
export async function searchHospitals(filters: { search?: string; city?: string; pincode?: string; lat?: number; lng?: number; maxDistance?: number }, page = 1, limit = 20) {
  const query: Record<string, unknown> = {};
  
  if (filters.pincode) query.pincode = filters.pincode;
  if (filters.city) query.city = new RegExp(String(filters.city), 'i');
  if (filters.search) {
    const searchRegex = new RegExp(String(filters.search), 'i');
    query.$or = [{ name: searchRegex }, { address: searchRegex }, { city: searchRegex }];
  }
  
  // Geo-near query if lat/lng provided
  let hospitals;
  let total;
  
  if (filters.lat && filters.lng) {
    const maxDistance = (filters.maxDistance || 10) * 1000; // convert km to meters
    hospitals = await Hospital.find({
      ...query,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [filters.lng, filters.lat] },
          $maxDistance: maxDistance,
        },
      },
    })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    total = await Hospital.countDocuments({
      ...query,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [filters.lng, filters.lat] },
          $maxDistance: maxDistance,
        },
      },
    });
  } else {
    hospitals = await Hospital.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
    total = await Hospital.countDocuments(query);
  }
  
  // Get active queue counts for each hospital
  const hospitalsWithQueue = await Promise.all(
    hospitals.map(async (h: any) => {
      const queueCount = await HospitalQueueEntry.countDocuments({ hospitalId: h._id, status: 'waiting' });
      return { ...h, activeQueueCount: queueCount };
    })
  );
  
  return { hospitals: hospitalsWithQueue, total, page, totalPages: Math.ceil(total / limit) };
}

// Get hospital dashboard analytics
export async function getHospitalAnalytics(hospitalId: string) {
  const today = new Date().toISOString().split('T')[0];
  const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(); startOfMonth.setDate(1);
  
  const [todayAppointments, weeklyAppointments, monthlyAppointments, activeQueue, totalDoctors, totalDepartments, totalPatients] = await Promise.all([
    Appointment.countDocuments({ hospitalId, date: today }),
    Appointment.countDocuments({ hospitalId, date: { $gte: startOfWeek.toISOString().split('T')[0] } }),
    Appointment.countDocuments({ hospitalId, date: { $gte: startOfMonth.toISOString().split('T')[0] } }),
    HospitalQueueEntry.countDocuments({ hospitalId, status: { $in: ['waiting', 'with-doctor'] } }),
    Doctor.countDocuments({ hospitalId }),
    Department.countDocuments({ hospitalId }),
    Appointment.distinct('patientId', { hospitalId }),
  ]);
  
  // Doctor-wise load
  const doctors = await Doctor.find({ hospitalId });
  const doctorLoad = await Promise.all(
    doctors.map(async (doc) => {
      const todayCount = await Appointment.countDocuments({ hospitalId, doctorId: doc._id, date: today });
      return { id: doc._id, name: doc.name, specialization: doc.specialization, todayPatients: todayCount, maxPatients: doc.maxPatientsPerDay };
    })
  );
  
  // Peak timings
  const peakTimings = await Appointment.aggregate([
    { $match: { hospitalId: new (require('mongoose').Types.ObjectId)(hospitalId), date: { $gte: startOfMonth.toISOString().split('T')[0] } } },
    { $group: { _id: '$timeSlot', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  
  return {
    today: { appointments: todayAppointments, activeQueue },
    weekly: { appointments: weeklyAppointments },
    monthly: { appointments: monthlyAppointments, uniquePatients: totalPatients.length },
    doctors: { total: totalDoctors, load: doctorLoad },
    departments: totalDepartments,
    peakTimings,
  };
}
