'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Building2, MapPin, Clock, CheckCircle,
  Stethoscope, CalendarDays, Home, Search, User,
} from 'lucide-react';
import { getToken } from '@/lib/api';

export default function HospitalDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const [hospital, setHospital] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({ doctorId: '', date: '', timeSlot: '', complaint: '' });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/hospitals/${slug}`);
        const data = await res.json();
        setHospital(data.hospital);
        setDoctors(data.doctors || []);
        setDepartments(data.departments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!form.doctorId || !form.date || !hospital) return;
    setSlotsLoading(true);
    setForm((f) => ({ ...f, timeSlot: '' }));
    fetch(`${API}/hospitals/${hospital._id}/doctors/${form.doctorId}/slots?date=${form.date}`)
      .then((r) => r.json())
      .then((data) => setAvailableSlots(data.slots || []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [form.doctorId, form.date, hospital?._id]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const token = getToken();
    if (!token) { router.push('/hospital/login'); return; }
    setBooking(true);
    try {
      const res = await fetch(`${API}/hospitals/appointments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId: hospital!._id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Booking failed'); return; }
      setResult(data);
    } catch {
      setError('Network error');
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="hospital-page flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#64748B]">Loading hospital details...</p>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="hospital-page flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <h2 className="text-lg font-medium text-[#1E293B] mb-1">Hospital not found</h2>
          <p className="text-sm text-[#64748B] mb-4">This hospital may have been removed</p>
          <Link href="/hospital/discover" className="hospital-btn-primary">Browse Hospitals</Link>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="hospital-page">
        <div className="hospital-container py-6 md:py-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="hospital-card max-w-lg mx-auto p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#1E293B] mb-1">Appointment Booked!</h2>
              <p className="text-sm text-[#64748B] mb-5">Your appointment has been confirmed</p>
              <div className="bg-blue-50 rounded-xl p-4 mb-5">
                <p className="text-xs text-[#64748B] uppercase tracking-wide mb-1">Ticket Number</p>
                <p className="text-3xl font-bold text-blue-600 tracking-wider">{result.ticket}</p>
              </div>
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="text-center">
                  <p className="text-xs text-[#64748B] mb-1">Position in Line</p>
                  <p className="text-xl font-bold text-[#1E293B]">{result.queuePosition}</p>
                  <p className="text-[10px] text-[#64748B] mt-1">↓ Decreases as each person is served</p>
                </div>
                <div className="w-px h-10 bg-[#E2E8F0]" />
                <div className="text-center">
                  <p className="text-xs text-[#64748B] mb-1">Est. Wait</p>
                  <p className="text-xl font-bold text-[#1E293B]">{result.estimatedWaitTime} min</p>
                </div>
              </div>
              {hospital.latitude && hospital.longitude && (
                <div className="mb-4">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hospital-btn-secondary w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    Get Directions
                  </a>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/hospital/patient/queue?hospitalId=${hospital._id}`}
                  className="hospital-btn-primary flex-1 text-center"
                >
                  Track Queue
                </Link>
                <Link
                  href="/hospital/patient/dashboard"
                  className="hospital-btn-secondary flex-1 text-center"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="hospital-page">
      <div className="hospital-container py-6 md:py-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1E293B] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="hospital-card p-5 md:p-6 mb-4 md:mb-5"
          >
            <h1 className="text-xl md:text-2xl font-semibold text-[#1E293B] mb-2">{hospital.name}</h1>
            <p className="text-sm text-[#64748B] mb-1 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {hospital.address}, {hospital.city}
            </p>
            {hospital.description && (
              <p className="text-sm text-[#475569] mt-3 mb-3">{hospital.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className={`hospital-badge ${hospital.isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                <Clock className="w-3.5 h-3.5 mr-1" />
                {hospital.isOpen ? 'Open Now' : 'Closed'}
              </span>
              <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {hospital.openTime} - {hospital.closeTime}
              </span>
            </div>
          </motion.div>

          {departments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="hospital-card p-5 md:p-6 mb-4 md:mb-5"
            >
              <h2 className="font-medium text-[#1E293B] mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Departments
              </h2>
              <div className="flex flex-wrap gap-2">
                {departments.map((d: any) => (
                  <span key={d._id} className="hospital-badge bg-[#F1F5F9] text-[#475569]">
                    {d.name}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="hospital-card p-5 md:p-6 mb-4 md:mb-5"
          >
            <h2 className="font-medium text-[#1E293B] mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              Doctors
            </h2>
            {doctors.filter((d: any) => d.isAvailable).length === 0 ? (
              <p className="text-sm text-[#64748B] text-center py-4">No doctors available at the moment</p>
            ) : (
              <div className="space-y-3">
                {doctors.filter((d: any) => d.isAvailable).map((doc: any, idx: number) => (
                  <motion.div
                    key={doc._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="w-11 h-11 bg-blue-600/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-600">
                        {doc.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#1E293B] text-sm">{doc.name}</h4>
                      <p className="text-xs text-[#64748B]">{doc.specialization}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#1E293B]">₹{doc.fee}</p>
                      <span className="text-xs text-emerald-600 font-medium">Available</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="hospital-card p-5 md:p-6"
          >
            <h2 className="font-medium text-[#1E293B] mb-5 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              Book Appointment
            </h2>
            <form onSubmit={handleBook} className="space-y-5">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <label className="hospital-label">Select Doctor</label>
                  <select
                    required
                    className="hospital-select"
                    value={form.doctorId}
                    onChange={e => setForm({ ...form, doctorId: e.target.value })}
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.filter((d: any) => d.isAvailable).map((doc: any) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.name} - {doc.specialization} (₹{doc.fee})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <label className="hospital-label">Select Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="hospital-input"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                    <label className="hospital-label">Select Time Slot</label>
                  <select
                    required
                    className="hospital-select"
                    value={form.timeSlot}
                    onChange={e => setForm({ ...form, timeSlot: e.target.value })}
                  >
                    <option value="">
                      {slotsLoading ? 'Loading...' : availableSlots.length === 0 && form.doctorId && form.date ? 'No slots available' : 'Choose a time'}
                    </option>
                    {availableSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </div>
                <div className="flex-1">
                  <label className="hospital-label">Reason for Visit <span className="text-[#94A3B8] font-normal">(optional)</span></label>
                  <textarea
                    className="hospital-input min-h-[80px] resize-none"
                    rows={2}
                    placeholder="Describe your symptoms or reason for appointment..."
                    value={form.complaint}
                    onChange={e => setForm({ ...form, complaint: e.target.value })}
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={booking}
                className="hospital-btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {booking ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Booking...
                  </span>
                ) : (
                  'Book Appointment'
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      </div>

      <nav className="hospital-bottom-nav">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <Link href="/hospital" className="hospital-bottom-nav-btn">
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link href="/hospital/discover" className="hospital-bottom-nav-btn">
            <Search className="w-5 h-5" />
            <span>Search</span>
          </Link>
          <Link href="/hospital/patient/dashboard" className="hospital-bottom-nav-btn-active">
            <CalendarDays className="w-5 h-5" />
            <span>Appointments</span>
          </Link>
          <Link href="/hospital/patient/dashboard" className="hospital-bottom-nav-btn">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
