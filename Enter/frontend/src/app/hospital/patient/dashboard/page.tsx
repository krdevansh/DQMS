'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  CalendarCheck,
  User,
  LogOut,
  Hospital,
  Clock,
  ArrowRight,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { getToken, getUser, clearToken, clearUser } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const bottomNavItems = [
  { key: 'home', label: 'Home', icon: Home, href: '/hospital/patient/dashboard' },
  { key: 'search', label: 'Search', icon: Search, href: '/hospital/discover' },
  { key: 'appointments', label: 'Appointments', icon: CalendarCheck, href: '/hospital/patient/dashboard' },
  { key: 'profile', label: 'Profile', icon: User, href: '#' },
];

export default function PatientDashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('home');
  const user = getUser();

  useEffect(() => {
    const token = getToken();
    if (!token || !user) { router.push('/hospital/login'); return; }
    loadAppts();
  }, []);

  async function loadAppts() {
    const token = getToken();
    try {
      const res = await fetch(`${API}/hospitals/appointments/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { clearToken(); clearUser(); router.push('/hospital/login'); return; }
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch { /* ignore */
    } finally { setLoading(false); }
  }

  function logout() { clearToken(); clearUser(); router.push('/'); }

  const upcoming = appointments.filter(
    (a: any) => a.status === 'confirmed' || a.status === 'pending'
  );
  const history = appointments.filter(
    (a: any) => a.status === 'completed' || a.status === 'cancelled'
  );

  return (
    <div className="hospital-page">
      <div className="hospital-container pb-24">
        <div className="pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold text-[#1E293B]">
              Hello, {user?.name ? String(user.name).split(' ')[0] : 'Patient'}
            </h1>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-[#EF4444] transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-[#64748B]">Manage your health appointments</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">
                  Upcoming Appointments
                </h2>
                <div className="space-y-3">
                  {upcoming.map((a: any, i: number) => (
                    <motion.div
                      key={a._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hospital-card p-5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Hospital className="w-4 h-4 text-[#2563EB]" />
                            <h3 className="font-semibold text-[#1E293B] truncate">
                              {a.hospitalId?.name || 'Hospital'}
                            </h3>
                          </div>
                          <p className="text-sm text-[#64748B]">
                            {a.doctorId?.name} — {a.doctorId?.specialization}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-[#64748B]">
                            <span className="flex items-center gap-1">
                              <CalendarCheck className="w-3.5 h-3.5" />
                              {a.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {a.timeSlot}
                            </span>
                          </div>
                          {a.queuePosition && (
                            <div className="mt-3 flex items-center gap-3">
                              <span className="hospital-badge bg-blue-100 text-[#2563EB]">
                                Queue #{a.queuePosition}
                              </span>
                              {a.estimatedWaitTime && (
                                <span className="text-xs text-[#64748B]">
                                  ~{a.estimatedWaitTime} min wait
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {a.hospitalId && (
                          <Link
                            href={`/hospital/patient/queue?hospitalId=${a.hospitalId._id}`}
                            className="flex items-center gap-1 text-[#2563EB] text-sm font-medium hover:underline ml-4 flex-shrink-0"
                          >
                            Track
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/hospital/discover"
                  className="hospital-card p-5 hover:shadow-md transition-shadow group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Search className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <p className="font-medium text-[#1E293B] text-sm">Find Hospitals</p>
                  <p className="text-xs text-[#64748B] mt-1">Book appointments</p>
                </Link>
                {upcoming.length > 0 && (
                  <Link
                    href={`/hospital/patient/queue?hospitalId=${upcoming[0].hospitalId?._id || ''}`}
                    className="hospital-card p-5 hover:shadow-md transition-shadow group"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Clock className="w-5 h-5 text-[#10B981]" />
                    </div>
                    <p className="font-medium text-[#1E293B] text-sm">My Queue</p>
                    <p className="text-xs text-[#64748B] mt-1">Track live status</p>
                  </Link>
                )}
              </div>
            </motion.div>

            {history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">
                  Appointment History
                </h2>
                <div className="space-y-2">
                  {history.map((a: any) => (
                    <div key={a._id} className="hospital-card px-5 py-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#1E293B] truncate">
                          {a.hospitalId?.name || 'Hospital'}
                        </p>
                        <p className="text-xs text-[#64748B]">{a.date} — {a.timeSlot}</p>
                      </div>
                      <span className={`hospital-badge ml-3 flex-shrink-0 ${
                        a.status === 'completed' ? 'bg-green-100 text-[#10B981]' : 'bg-red-100 text-[#EF4444]'
                      }`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {appointments.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hospital-card p-12 text-center"
              >
                <CalendarCheck className="w-12 h-12 text-[#CBD5E1] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#1E293B] mb-2">No appointments yet</h3>
                <p className="text-sm text-[#64748B] mb-6">Find a hospital and book your first appointment</p>
                <Link
                  href="/hospital/discover"
                  className="hospital-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
                >
                  Find Hospitals
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <nav className="hospital-bottom-nav">
        <div className="flex items-center justify-around max-w-lg mx-auto px-4">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeNav;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setActiveNav(item.key)}
                className={`flex flex-col items-center gap-1 py-3 px-4 ${
                  isActive ? 'hospital-bottom-nav-btn-active' : 'hospital-bottom-nav-btn'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                <span className={`text-xs ${isActive ? 'font-medium text-[#2563EB]' : 'text-[#64748B]'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
