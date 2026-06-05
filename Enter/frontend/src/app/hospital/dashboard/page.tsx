'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

import {
  LayoutDashboard,
  Stethoscope,
  CalendarCheck,
  ListOrdered,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Loader2,
  Clock,
  Users,
  UserCheck,
  MapPin,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { getToken, getUser, clearToken, clearUser } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const sidebarItems = [
  { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'doctors', label: 'Doctors', icon: Stethoscope },
  { key: 'appointments', label: 'Appointments', icon: CalendarCheck },
  { key: 'queue', label: 'Queue', icon: ListOrdered },
  { key: 'departments', label: 'Departments', icon: Building2 },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'subscription', label: 'Subscription', icon: Building2, href: '/hospital/subscription' },
];

export default function HospitalDashboard() {
  const router = useRouter();
  const [hospital, setHospital] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchHospital = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push('/hospital/login'); return; }
    try {
      const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await fetch(`${API}/hospitals/my`, { headers: h });
      if (!res.ok) { clearToken(); clearUser(); router.push('/hospital/login'); return; }
      const data = await res.json();
      setHospital(data.hospital);
    } catch { showToast('Failed to load hospital');
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchHospital(); }, [fetchHospital]);

  const logout = () => { clearToken(); clearUser(); router.push('/'); };

  if (loading) {
    return (
      <div className="hospital-page flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="hospital-page flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg">
          <div className="hospital-card p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[#2563EB]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-[#2563EB]" />
              </div>
              <h2 className="text-xl font-bold text-[#1E293B]">Create Your Hospital</h2>
              <p className="text-sm text-[#64748B] mt-1">Set up your hospital profile to get started</p>
            </div>
            <CreateHospitalForm onCreated={() => fetchHospital()} />
          </div>
        </div>
      </div>
    );
  }

function CreateHospitalForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', pincode: '', description: '', openTime: '09:00', closeTime: '18:00', latitude: 0, longitude: 0 });
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const token = getToken();
    const body: any = { ...form };
    if (body.latitude && body.longitude) {
      body.location = { type: 'Point', coordinates: [body.longitude, body.latitude] };
    }
    const res = await fetch(`${API}/hospitals`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) onCreated();
    setSaving(false);
  }

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <div className="space-y-3">
        <input type="text" placeholder="Hospital Name *" required className="hospital-input"
          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input type="text" placeholder="Address *" required className="hospital-input"
          value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input type="text" placeholder="City *" required className="hospital-input"
            value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
          <input type="text" placeholder="State" className="hospital-input"
            value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
        </div>
        <input type="text" placeholder="Pincode *" required className="hospital-input"
          value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input type="time" className="hospital-input" value={form.openTime}
            onChange={e => setForm({ ...form, openTime: e.target.value })} />
          <input type="time" className="hospital-input" value={form.closeTime}
            onChange={e => setForm({ ...form, closeTime: e.target.value })} />
        </div>
        <textarea placeholder="Description" className="hospital-input min-h-[80px]"
          value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <div className="h-[200px] rounded-xl overflow-hidden border border-[#E2E8F0]">
          {typeof window !== 'undefined' && (
            <MapComponent
              salons={[]}
              userLocation={form.latitude ? [form.latitude, form.longitude] : null}
              onMarkerClick={() => {}}
              editable
              onLocationChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
            />
          )}
        </div>
      </div>
      <button type="submit" disabled={saving}
        className="hospital-btn-primary w-full py-3 rounded-lg text-sm font-medium disabled:opacity-50">
        {saving ? 'Creating...' : 'Create Hospital'}
      </button>
    </form>
  );
}

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-white border border-[#E2E8F0] text-[#1E293B] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <span className="text-sm">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex flex-col w-[250px] bg-white border-r border-[#E2E8F0] h-screen sticky top-0 flex-shrink-0">
        <div className="p-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <div className="truncate">
              <p className="font-semibold text-[#1E293B] text-sm truncate">{hospital.name}</p>
              <p className="text-xs text-[#64748B] truncate">{hospital.city}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const active = activeTab === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => { if (item.href) { router.push(item.href); } else { setActiveTab(item.key); setMobileMenu(false); } }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active && !item.href
                    ? 'hospital-nav-link-active'
                    : 'hospital-nav-link'
                }`}
              >
                <Icon className={`w-5 h-5 ${active && !item.href ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[#E2E8F0]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#64748B] hover:bg-red-50 hover:text-[#EF4444] transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenu(true)} className="lg:hidden p-2 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-[#1E293B]">{hospital.name}</h1>
                <p className="text-sm text-[#64748B]">{hospital.address}, {hospital.city}</p>
              </div>
            </div>
            <button onClick={logout} className="lg:hidden p-2 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-[#EF4444]">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <TabContent
            activeTab={activeTab}
            hospital={hospital}
            showToast={showToast}
          />
        </main>
      </div>

      <AnimatePresence>
        {mobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenu(false)}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">H</span>
                  </div>
                  <span className="font-semibold text-[#1E293B]">{hospital.name}</span>
                </div>
                <button onClick={() => setMobileMenu(false)} className="p-2 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {sidebarItems.map((item) => {
                  const active = activeTab === item.key;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { if (item.href) { router.push(item.href); } else { setActiveTab(item.key); setMobileMenu(false); } }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        active && !item.href
                          ? 'hospital-nav-link-active'
                          : 'hospital-nav-link'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active && !item.href ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-[#E2E8F0]">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#64748B] hover:bg-red-50 hover:text-[#EF4444] transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabContent({ activeTab, hospital, showToast }: {
  activeTab: string;
  hospital: any;
  showToast: (msg: string) => void;
}) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [queueData, setQueueData] = useState<{ serving: any; waiting: any[]; totalWaiting: number } | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  const [doctorForm, setDoctorForm] = useState({ name: '', specialization: '', qualification: '', fee: 0, departmentId: '', isAvailable: true });
  const [deptInput, setDeptInput] = useState('');
  const [settingsForm, setSettingsForm] = useState({ name: '', address: '', city: '', state: '', pincode: '', description: '', openTime: '', closeTime: '', latitude: 0, longitude: 0 });
  const [mapReady, setMapReady] = useState(false);

  const fetchData = useCallback(async () => {
    if (!hospital) return;
    setTabLoading(true);
    const token = getToken();
    try {
      const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [docRes, apptRes, qRes, deptRes] = await Promise.all([
        fetch(`${API}/hospitals/${hospital._id}/doctors`),
        fetch(`${API}/hospitals/${hospital._id}/appointments/today`, { headers: h }),
        fetch(`${API}/hospitals/${hospital._id}/queue`),
        fetch(`${API}/hospitals/${hospital._id}/departments`),
      ]);

      if (docRes.ok) { const d = await docRes.json(); setDoctors(d.doctors || []); }
      if (apptRes.ok) { const d = await apptRes.json(); setAppointments(d.appointments || []); }
      if (qRes.ok) { const d = await qRes.json(); setQueueData({ serving: d.serving || null, waiting: d.waiting || [], totalWaiting: d.totalWaiting || 0 }); }
      if (deptRes.ok) { const d = await deptRes.json(); setDepartments(d.departments || []); }
    } catch { showToast('Failed to load data');
    } finally { setTabLoading(false); }
  }, [hospital, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (hospital) {
      setSettingsForm({
        name: hospital.name || '',
        address: hospital.address || '',
        city: hospital.city || '',
        state: hospital.state || '',
        pincode: hospital.pincode || '',
        description: hospital.description || '',
        openTime: hospital.openTime || '09:00',
        closeTime: hospital.closeTime || '18:00',
        latitude: hospital.latitude || 0,
        longitude: hospital.longitude || 0,
      });
    }
  }, [hospital]);

  async function addDoctor(e: React.FormEvent) {
    e.preventDefault();
    if (!hospital) return;
    const token = getToken();
    const body: any = { name: doctorForm.name, specialization: doctorForm.specialization, qualification: doctorForm.qualification, fee: doctorForm.fee, isAvailable: doctorForm.isAvailable };
    if (doctorForm.departmentId) body.departmentId = doctorForm.departmentId;
    const res = await fetch(`${API}/hospitals/${hospital._id}/doctors`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { showToast('Failed to add doctor'); return; }
    setDoctorForm({ name: '', specialization: '', qualification: '', fee: 0, departmentId: '', isAvailable: true });
    fetchData();
    showToast('Doctor added');
  }

  async function toggleDoctorAvailability(docId: string, current: boolean) {
    const token = getToken();
    const res = await fetch(`${API}/hospitals/${hospital._id}/doctors/${docId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !current }),
    });
    if (!res.ok) { showToast('Failed to update'); return; }
    setDoctors(doctors.map((d: any) => d._id === docId ? { ...d, isAvailable: !current } : d));
    showToast(`Doctor ${!current ? 'available' : 'unavailable'}`);
  }

  async function saveHospitalSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!hospital) return;
    const token = getToken();
    const body: any = { ...settingsForm };
    if (body.latitude && body.longitude) {
      body.location = { type: 'Point', coordinates: [body.longitude, body.latitude] };
    }
    const res = await fetch(`${API}/hospitals/${hospital._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { showToast('Failed to save'); return; }
    showToast('Hospital updated');
  }

  async function removeDoctor(id: string) {
    const token = getToken();
    const res = await fetch(`${API}/hospitals/${hospital._id}/doctors/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { showToast('Failed to remove doctor'); return; }
    setDoctors(doctors.filter((d: any) => d._id !== id));
    showToast('Doctor removed');
  }

  async function servePatient(id: string) {
    const token = getToken();
    const res = await fetch(`${API}/hospitals/queue/${id}/serve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) { showToast('Failed to serve patient'); return; }
    fetchData();
    showToast('Patient moved to doctor');
  }

  async function completePatient(id: string) {
    const token = getToken();
    const res = await fetch(`${API}/hospitals/queue/${id}/complete`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) { showToast('Failed to complete'); return; }
    fetchData();
    showToast('Patient completed');
  }

  async function addDepartment() {
    if (!deptInput.trim() || !hospital) return;
    const token = getToken();
    const res = await fetch(`${API}/hospitals/${hospital._id}/departments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: deptInput.trim() }),
    });
    if (!res.ok) { showToast('Failed to add department'); return; }
    setDeptInput('');
    fetchData();
    showToast('Department added');
  }

  async function removeDepartment(id: string) {
    const token = getToken();
    const res = await fetch(`${API}/hospitals/${hospital._id}/departments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { showToast('Failed to remove department'); return; }
    setDepartments(departments.filter((d: any) => d._id !== id));
    showToast('Department removed');
  }

  if (tabLoading && !doctors.length && !appointments.length && !queueData && !departments.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="hospital-stat">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-[#2563EB]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1E293B]">{doctors.length}</p>
          <p className="text-sm text-[#64748B]">Doctors</p>
        </div>
        <div className="hospital-stat">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-[#10B981]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1E293B]">{appointments.length}</p>
          <p className="text-sm text-[#64748B]">Today's Patients</p>
        </div>
        <div className="hospital-stat">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#F59E0B]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1E293B]">{queueData?.totalWaiting || 0}</p>
          <p className="text-sm text-[#64748B]">In Queue</p>
        </div>
        <div className="hospital-stat">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1E293B]">{departments.length}</p>
          <p className="text-sm text-[#64748B]">Departments</p>
        </div>
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="hospital-card p-6">
              <h3 className="font-semibold text-[#1E293B] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                Current Queue
              </h3>
              {queueData?.serving ? (
                <div className="bg-[#F0FDF4] border border-[#10B981]/20 rounded-xl p-4 mb-3">
                  <p className="text-xs text-[#10B981] font-medium">Now Serving</p>
                  <p className="text-xl font-bold text-[#1E293B] mt-1">{queueData.serving.ticket}</p>
                  <p className="text-sm text-[#64748B]">{queueData.serving.patientName}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
                  <p className="text-sm text-[#64748B]">No active queue</p>
                </div>
              )}
              <p className="text-sm text-[#64748B]">{queueData?.totalWaiting || 0} patients waiting</p>
            </div>
            <div className="hospital-card p-6">
              <h3 className="font-semibold text-[#1E293B] mb-4">Today's Appointments</h3>
              {appointments.length > 0 ? (
                <div className="space-y-2">
                  {appointments.slice(0, 5).map((a: any) => (
                    <div key={a._id} className="flex items-center justify-between py-2 border-b border-[#E2E8F0] last:border-0">
                      <div>
                        <p className="text-sm font-medium text-[#1E293B]">{a.patientName}</p>
                        <p className="text-xs text-[#64748B]">{a.timeSlot}</p>
                      </div>
                      <span className={`hospital-badge ${
                        a.status === 'confirmed' ? 'bg-blue-100 text-[#2563EB]' :
                        a.status === 'completed' ? 'bg-green-100 text-[#10B981]' :
                        'bg-red-100 text-[#EF4444]'
                      }`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarCheck className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
                  <p className="text-sm text-[#64748B]">No appointments today</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'doctors' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="hospital-card p-6">
            <h3 className="font-semibold text-[#1E293B] mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#2563EB]" />
              Add Doctor
            </h3>
            <form onSubmit={addDoctor} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input placeholder="Full Name" required className="hospital-input text-sm"
                value={doctorForm.name} onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })} />
              <input placeholder="Specialization" required className="hospital-input text-sm"
                value={doctorForm.specialization} onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })} />
              <input placeholder="Qualification" className="hospital-input text-sm"
                value={doctorForm.qualification} onChange={e => setDoctorForm({ ...doctorForm, qualification: e.target.value })} />
              <input placeholder="Fee (₹)" type="number" className="hospital-input text-sm"
                value={doctorForm.fee || ''} onChange={e => setDoctorForm({ ...doctorForm, fee: Number(e.target.value) })} />
              <select className="hospital-input text-sm"
                value={doctorForm.departmentId} onChange={e => setDoctorForm({ ...doctorForm, departmentId: e.target.value })}>
                <option value="">No department</option>
                {departments.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-[#1E293B] cursor-pointer">
                <input type="checkbox" checked={doctorForm.isAvailable}
                  onChange={e => setDoctorForm({ ...doctorForm, isAvailable: e.target.checked })}
                  className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]" />
                Available
              </label>
              <button type="submit" className="hospital-btn-primary px-4 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity col-span-full sm:col-span-1">
                Add Doctor
              </button>
            </form>
          </div>

          <div className="hospital-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Name</th>
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Department</th>
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Specialization</th>
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Fee</th>
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Status</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {doctors.map((doc: any) => {
                    const dept = departments.find((d: any) => d._id === (doc.departmentId?._id || doc.departmentId));
                    return (
                      <tr key={doc._id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4 font-medium text-[#1E293B]">{doc.name}</td>
                        <td className="px-6 py-4 text-[#64748B]">{dept?.name || '—'}</td>
                        <td className="px-6 py-4 text-[#64748B]">{doc.specialization}</td>
                        <td className="px-6 py-4 text-[#1E293B]">₹{doc.fee}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => toggleDoctorAvailability(doc._id, doc.isAvailable)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                              doc.isAvailable
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}>
                            {doc.isAvailable ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                            {doc.isAvailable ? 'Available' : 'Unavailable'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => removeDoctor(doc._id)}
                            className="text-sm text-[#EF4444] hover:text-red-700 font-medium transition-colors">Remove</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {doctors.length === 0 && (
              <div className="text-center py-12">
                <Stethoscope className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
                <p className="text-[#64748B] text-sm">No doctors added yet</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'appointments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="hospital-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#1E293B]">Today's Appointments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">#</th>
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Patient</th>
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Doctor</th>
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Time Slot</th>
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {appointments.map((a: any, i: number) => (
                    <tr key={a._id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 text-[#64748B]">{i + 1}</td>
                      <td className="px-6 py-4 font-medium text-[#1E293B]">{a.patientName}</td>
                      <td className="px-6 py-4 text-[#64748B]">{a.doctorId?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-[#1E293B]">{a.timeSlot}</td>
                      <td className="px-6 py-4">
                        <span className={`hospital-badge ${
                          a.status === 'confirmed' ? 'bg-blue-100 text-[#2563EB]' :
                          a.status === 'completed' ? 'bg-green-100 text-[#10B981]' :
                          'bg-red-100 text-[#EF4444]'
                        }`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {appointments.length === 0 && (
              <div className="text-center py-12">
                <CalendarCheck className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
                <p className="text-[#64748B] text-sm">No appointments today</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'queue' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="hospital-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="font-semibold text-[#1E293B]">Queue Management</h3>
              <button onClick={fetchData} className="text-sm text-[#2563EB] hover:underline font-medium">Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Ticket #</th>
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Patient</th>
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Status</th>
                    <th className="px-6 py-4 text-left font-medium text-[#64748B]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {queueData?.serving && (
                    <tr className="bg-[#F0FDF4]">
                      <td className="px-6 py-4 font-mono font-bold text-[#10B981]">{queueData.serving.ticket}</td>
                      <td className="px-6 py-4 font-medium text-[#1E293B]">{queueData.serving.patientName}</td>
                      <td className="px-6 py-4">
                        <span className="hospital-badge bg-green-100 text-[#10B981]">With Doctor</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => completePatient(queueData.serving._id)}
                          className="hospital-btn-success px-3 py-1.5 rounded-lg text-xs font-medium"
                        >
                          Complete
                        </button>
                      </td>
                    </tr>
                  )}
                  {(queueData?.waiting || []).map((entry: any) => (
                    <tr key={entry._id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#2563EB]">{entry.ticket}</td>
                      <td className="px-6 py-4 text-[#1E293B]">{entry.patientName}</td>
                      <td className="px-6 py-4">
                        <span className="hospital-badge bg-amber-100 text-[#F59E0B]">Waiting</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => servePatient(entry._id)}
                          className="hospital-btn-primary px-3 py-1.5 rounded-lg text-xs font-medium"
                        >
                          Serve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!queueData?.waiting?.length && !queueData?.serving) && (
              <div className="text-center py-12">
                <ListOrdered className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
                <p className="text-[#64748B] text-sm">Queue is empty</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'departments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="hospital-card p-6">
            <h3 className="font-semibold text-[#1E293B] mb-4">Add Department</h3>
            <div className="flex gap-3">
              <input
                placeholder="Department name"
                className="hospital-input flex-1 text-sm"
                value={deptInput}
                onChange={e => setDeptInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDepartment(); } }}
              />
              <button onClick={addDepartment} className="hospital-btn-primary px-6 py-3 rounded-lg text-sm font-medium">
                Add
              </button>
            </div>
          </div>

          <div className="hospital-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#1E293B]">All Departments</h3>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {departments.map((dept: any) => (
                <div key={dept._id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F8FAFC] transition-colors">
                  <span className="font-medium text-[#1E293B]">{dept.name}</span>
                  <button
                    onClick={() => removeDepartment(dept._id)}
                    className="text-sm text-[#EF4444] hover:text-red-700 font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {departments.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
                  <p className="text-[#64748B] text-sm">No departments added</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'settings' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="hospital-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-[#1E293B]">Hospital Settings</h3>
                <p className="text-xs text-[#64748B] mt-0.5">ID: <span className="font-mono font-medium">{hospital.hospitalId}</span></p>
              </div>
            </div>
            <form onSubmit={saveHospitalSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="hospital-label">Hospital Name</label>
                  <input type="text" className="hospital-input" value={settingsForm.name}
                    onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="hospital-label">Address</label>
                  <input type="text" className="hospital-input" value={settingsForm.address}
                    onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })} />
                </div>
                <div>
                  <label className="hospital-label">City</label>
                  <input type="text" className="hospital-input" value={settingsForm.city}
                    onChange={e => setSettingsForm({ ...settingsForm, city: e.target.value })} />
                </div>
                <div>
                  <label className="hospital-label">State</label>
                  <input type="text" className="hospital-input" value={settingsForm.state}
                    onChange={e => setSettingsForm({ ...settingsForm, state: e.target.value })} />
                </div>
                <div>
                  <label className="hospital-label">Pincode</label>
                  <input type="text" className="hospital-input" value={settingsForm.pincode}
                    onChange={e => setSettingsForm({ ...settingsForm, pincode: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="hospital-label">Open Time</label>
                    <input type="time" className="hospital-input" value={settingsForm.openTime}
                      onChange={e => setSettingsForm({ ...settingsForm, openTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="hospital-label">Close Time</label>
                    <input type="time" className="hospital-input" value={settingsForm.closeTime}
                      onChange={e => setSettingsForm({ ...settingsForm, closeTime: e.target.value })} />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="hospital-label">Description</label>
                  <textarea className="hospital-input min-h-[80px]" value={settingsForm.description}
                    onChange={e => setSettingsForm({ ...settingsForm, description: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="hospital-label flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2563EB]" />
                  Location (click map or drag marker)
                </label>
                <div className="h-[300px] rounded-xl overflow-hidden border border-[#E2E8F0]">
                  {typeof window !== 'undefined' && (
                    <MapComponent
                      salons={[]}
                      userLocation={settingsForm.latitude ? [settingsForm.latitude, settingsForm.longitude] : null}
                      onMarkerClick={() => {}}
                      editable
                      onLocationChange={(lat, lng) => setSettingsForm({ ...settingsForm, latitude: lat, longitude: lng })}
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="submit" className="hospital-btn-primary px-6 py-3 rounded-lg text-sm font-medium">Save Changes</button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
