'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, LogOut, Scissors, Users, CalendarCheck,
  Trash2, RefreshCw, X, Lock, Eye, EyeOff, CheckCircle,
  AlertTriangle, ChevronRight, LayoutDashboard, Clock,
  School, Hospital, Settings, UserCircle, Mail, Phone,
  Calendar, Building, Tag, ExternalLink, MapPin, Phone as PhoneIcon,
  Wallet, ChevronDown, CreditCard, ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { adminApi, clearAdminToken, getAdminToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

type Tab = 'salons' | 'hospitals' | 'school';

interface Salon {
  _id: string;
  name: string;
  shopNumber: string;
  city: string;
  pincode: string;
  address: string;
  phone?: string;
  email?: string;
  salonType?: string;
  rating?: number;
  isOpen?: boolean;
  isVerified?: boolean;
  createdAt: string;
  services?: { name: string; price: number }[];
  ownerId?: string;
}

interface User {
  _id: string;
  name?: string;
  salonName?: string;
  email?: string;
  phone: string;
  role: string;
  createdAt: string;
}

interface Booking {
  _id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  status: string;
  salonId?: { name?: string; city?: string } | string;
  createdAt: string;
}

interface QueueEntry {
  _id: string;
  customerName: string;
  ticket: string;
  position: number;
  serviceName: string;
  price: number;
  status: string;
  salonId?: { name?: string; city?: string } | string;
  createdAt: string;
}

interface HospitalEntry {
  _id: string;
  name: string;
  city: string;
  pincode: string;
  address: string;
  phone: string;
  email: string;
  isOpen: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface SchoolEntry {
  _id: string;
  name: string;
  schoolId: string;
  code: string;
  city: string;
  state: string;
  contactNumber: string;
  principalName: string;
  createdAt: string;
}

type DeleteTarget = { type: 'salon' | 'user' | 'booking' | 'queue' | 'hospital' | 'school'; id: string; name: string };

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('salons');
  const [salons, setSalons] = useState<Salon[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [hospitals, setHospitals] = useState<HospitalEntry[]>([]);
  const [schools, setSchools] = useState<SchoolEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [toast, setToast] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [pendingCounts, setPendingCounts] = useState({ recharges: 0, hospitalSubs: 0, schoolSubs: 0 });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [salonsRes, usersRes, bookingsRes, queueRes, hospitalsRes, schoolsRes, rechargesRes, hospSubsRes, schSubsRes] = await Promise.all([
      adminApi.get<{ salons: Salon[] }>('/admin/salons'),
      adminApi.get<{ users: User[] }>('/admin/users'),
      adminApi.get<{ bookings: Booking[] }>('/admin/bookings'),
      adminApi.get<{ entries: QueueEntry[] }>('/admin/queue'),
      adminApi.get<{ hospitals: HospitalEntry[] }>('/admin/hospitals'),
      adminApi.get<{ schools: SchoolEntry[] }>('/admin/schools'),
      adminApi.get<{ recharges: any[] }>('/admin/recharges/pending'),
      adminApi.get<{ subscriptions: any[] }>('/admin/subscriptions/hospitals'),
      adminApi.get<{ subscriptions: any[] }>('/admin/subscriptions/schools'),
    ]);
    if (salonsRes.data) setSalons(salonsRes.data.salons);
    if (usersRes.data) setUsers(usersRes.data.users);
    if (bookingsRes.data) setBookings(bookingsRes.data.bookings);
    if (queueRes.data) setQueueEntries(queueRes.data.entries);
    if (hospitalsRes.data) setHospitals(hospitalsRes.data.hospitals);
    if (schoolsRes.data) setSchools(schoolsRes.data.schools);
    if (rechargesRes.data) setPendingCounts(prev => ({ ...prev, recharges: rechargesRes.data!.recharges.length }));
    if (hospSubsRes.data) setPendingCounts(prev => ({ ...prev, hospitalSubs: hospSubsRes.data!.subscriptions.filter((s: any) => s.status === 'pending').length }));
    if (schSubsRes.data) setPendingCounts(prev => ({ ...prev, schoolSubs: schSubsRes.data!.subscriptions.filter((s: any) => s.status === 'pending').length }));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!getAdminToken()) {
      window.location.href = '/admin/login';
      return;
    }
    fetchAll();
  }, [fetchAll]);

  const handleLogout = () => {
    clearAdminToken();
    window.location.href = '/';
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const endpointMap: Record<string, string> = {
      salon: `/admin/salons/${deleteTarget.id}`,
      user: `/admin/users/${deleteTarget.id}`,
      booking: `/admin/bookings/${deleteTarget.id}`,
      queue: `/admin/queue/${deleteTarget.id}`,
      hospital: `/admin/hospitals/${deleteTarget.id}`,
      school: `/admin/schools/${deleteTarget.id}`,
    };
    const { error } = await adminApi.delete(endpointMap[deleteTarget.type]);
    if (error) {
      showToast(`Error: ${error}`);
    } else {
      showToast(`${deleteTarget.name} deleted successfully`);
      fetchAll();
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    setPwLoading(true);
    const { error } = await adminApi.post('/admin/change-password', { newPassword });
    if (error) {
      setPwError(error);
    } else {
      setPwSuccess('Password changed successfully!');
      setNewPassword('');
    }
    setPwLoading(false);
  };

  const tabs = [
    { key: 'salons' as Tab, label: 'Salons', icon: Scissors, count: salons.length },
    { key: 'hospitals' as Tab, label: 'Hospitals', icon: Hospital, count: hospitals.length },
    { key: 'school' as Tab, label: 'Schools', icon: School, count: schools.length },
  ];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const getSalonName = (salonId: Booking['salonId'] | QueueEntry['salonId']) => {
    if (!salonId) return 'N/A';
    if (typeof salonId === 'object' && salonId.name) return salonId.name;
    return 'Unknown';
  };

  const getUserInitials = (user: User) => {
    const name = user.name || user.salonName || user.phone;
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-4 right-4 z-[100] flex items-center gap-3 bg-[#1A1A2E] border border-white/10 text-white px-5 py-3 rounded-xl shadow-2xl"
          >
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111118] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-2">Confirm Delete</h3>
              <p className="text-slate-400 text-sm text-center mb-6">
                Are you sure you want to delete <span className="text-white font-semibold">&quot;{deleteTarget.name}&quot;</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1A1A2E] border border-white/10 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Delete</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-md mx-auto shadow-2xl overflow-hidden"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-[#2563EB]/20 to-[#7C3AED]/20 p-6 sm:p-8 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg shadow-blue-500/20 flex-shrink-0">
                    {getUserInitials(selectedUser)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                      {selectedUser.name || selectedUser.salonName || 'No Name'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        selectedUser.role === 'salon' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {selectedUser.role}
                      </span>
                      <span className="text-xs text-slate-500">ID: {selectedUser._id.slice(-8)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 sm:p-8 space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-[#1A1A2E] border border-white/5">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Phone</p>
                      <p className="text-sm sm:text-base font-semibold text-white truncate">{selectedUser.phone}</p>
                    </div>
                  </div>

                  {selectedUser.email && (
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-[#1A1A2E] border border-white/5">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Email</p>
                        <p className="text-sm sm:text-base font-semibold text-white truncate">{selectedUser.email}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.salonName && (
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-[#1A1A2E] border border-white/5">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Salon / Business</p>
                        <p className="text-sm sm:text-base font-semibold text-white truncate">{selectedUser.salonName}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-[#1A1A2E] border border-white/5">
                    <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Role</p>
                      <p className="text-sm sm:text-base font-semibold text-white capitalize">{selectedUser.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-[#1A1A2E] border border-white/5">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Registered On</p>
                      <p className="text-sm sm:text-base font-semibold text-white">{formatDateTime(selectedUser.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setDeleteTarget({ type: 'user', id: selectedUser._id, name: selectedUser.name || selectedUser.phone });
                  }}
                  className="w-full py-2.5 sm:py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Drawer */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#111118] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-xl flex items-center justify-center">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white">Change Password</h3>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPwError(''); setPwSuccess(''); }}
                      placeholder="Min. 6 characters"
                      className="w-full bg-[#1A1A2E] border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pwError && <p className="text-red-400 text-xs mt-1">{pwError}</p>}
                  {pwSuccess && <p className="text-green-400 text-xs mt-1">{pwSuccess}</p>}
                </div>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {pwLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Update Password'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-[#080810]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-[#2563EB] to-[#7C3AED] p-2 rounded-xl shadow-lg shadow-blue-500/20">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold">
                  <span className="text-[#2563EB]">DQMS</span>
                  <span className="text-white ml-1">Admin</span>
                </span>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">System Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {loading && (
                <button
                  onClick={fetchAll}
                  className="p-2 rounded-xl bg-[#111118] border border-white/8 text-slate-500 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </button>
              )}
              <button
                onClick={() => { fetchAll(); showToast('Data refreshed'); }}
                className="hidden sm:flex p-2 rounded-xl bg-[#111118] border border-white/8 text-slate-500 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <div className="relative">
                <button
                  onClick={() => { setMenuOpen(!menuOpen); setExpandedSection(null); }}
                  className={`p-2 rounded-xl border transition-colors ${
                    menuOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#111118] border-white/8 text-slate-500 hover:text-emerald-400'
                  }`}
                  title="Management"
                >
                  <Wallet className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setMenuOpen(false); setExpandedSection(null); }}
                        className="fixed inset-0 z-40"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-[#111118] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                      >
                        {/* Salons */}
                        <div>
                          <div className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-slate-300">
                            <button type="button" onMouseDown={(e) => { e.stopPropagation(); window.open('/admin/recharges', '_blank'); }} className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-sm text-slate-300 font-medium">
                              <Scissors className="w-4 h-4 text-emerald-400" />
                              <span className="font-medium">Salons</span>
                            </button>
                            <div className="flex items-center gap-2">
                              {pendingCounts.recharges > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">{pendingCounts.recharges}</span>
                              )}
                              <button
                                onClick={() => setExpandedSection(expandedSection === 'salons' ? null : 'salons')}
                                className="p-0.5 hover:bg-white/5 rounded-lg transition-colors"
                              >
                                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedSection === 'salons' ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                          <AnimatePresence>
                            {expandedSection === 'salons' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pb-2">
                                  <Link
                                    href="/admin/recharges"
                                    className="flex items-center gap-3 px-8 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                  >
                                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Wallet Recharges</span>
                                    {pendingCounts.recharges > 0 && (
                                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">{pendingCounts.recharges}</span>
                                    )}
                                  </Link>
                                  <Link
                                    href="/admin/recharges"
                                    className="flex items-center gap-3 px-8 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                  >
                                    <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Salon Subscriptions</span>
                                  </Link>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Hospitals */}
                        <div className="border-t border-white/5">
                          <div className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-slate-300">
                            <button type="button" onMouseDown={(e) => { e.stopPropagation(); window.open('/admin/subscriptions/hospitals', '_blank'); }} className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-sm text-slate-300 font-medium">
                              <Hospital className="w-4 h-4 text-rose-400" />
                              <span className="font-medium">Hospitals</span>
                            </button>
                            <div className="flex items-center gap-2">
                              {pendingCounts.hospitalSubs > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold">{pendingCounts.hospitalSubs}</span>
                              )}
                              <button
                                onClick={() => setExpandedSection(expandedSection === 'hospitals' ? null : 'hospitals')}
                                className="p-0.5 hover:bg-white/5 rounded-lg transition-colors"
                              >
                                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedSection === 'hospitals' ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                          <AnimatePresence>
                            {expandedSection === 'hospitals' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pb-2">
                                  <Link
                                    href="/admin/subscriptions/hospitals"
                                    onClick={() => { setMenuOpen(false); setExpandedSection(null); }}
                                    className="flex items-center gap-3 px-8 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                  >
                                    <ClipboardList className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Subscription Requests</span>
                                    {pendingCounts.hospitalSubs > 0 && (
                                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold">{pendingCounts.hospitalSubs}</span>
                                    )}
                                  </Link>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Schools */}
                        <div className="border-t border-white/5">
                          <div className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-slate-300">
                            <button type="button" onMouseDown={(e) => { e.stopPropagation(); window.open('/admin/subscriptions/schools', '_blank'); }} className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-sm text-slate-300 font-medium">
                              <School className="w-4 h-4 text-amber-400" />
                              <span className="font-medium">Schools</span>
                            </button>
                            <div className="flex items-center gap-2">
                              {pendingCounts.schoolSubs > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">{pendingCounts.schoolSubs}</span>
                              )}
                              <button
                                onClick={() => setExpandedSection(expandedSection === 'schools' ? null : 'schools')}
                                className="p-0.5 hover:bg-white/5 rounded-lg transition-colors"
                              >
                                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedSection === 'schools' ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                          <AnimatePresence>
                            {expandedSection === 'schools' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pb-2">
                                  <Link
                                    href="/admin/subscriptions/schools"
                                    onClick={() => { setMenuOpen(false); setExpandedSection(null); }}
                                    className="flex items-center gap-3 px-8 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                  >
                                    <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Subscription Requests</span>
                                    {pendingCounts.schoolSubs > 0 && (
                                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">{pendingCounts.schoolSubs}</span>
                                    )}
                                  </Link>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl bg-[#111118] border border-white/8 text-slate-500 hover:text-[#2563EB] transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111118] border border-white/8 text-slate-400 hover:text-white hover:border-red-500/30 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Salons', value: salons.length, icon: Scissors, color: 'from-emerald-500 to-teal-600' },
            { label: 'Hospitals', value: hospitals.length, icon: Hospital, color: 'from-rose-500 to-pink-600' },
            { label: 'Schools', value: schools.length, icon: School, color: 'from-amber-500 to-orange-600' },
            { label: 'Users', value: users.length, icon: Users, color: 'from-blue-500 to-indigo-600' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-[#111118] border border-white/5 rounded-2xl p-4">
                <div className={`w-9 h-9 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111118] border border-white/5 p-1 rounded-2xl mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-white/5'
                }`}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* SALONS TAB */}
          {activeTab === 'salons' && (
            <motion.div
              key="salons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">All Salons ({salons.length})</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-xs text-slate-500">Salons Module</span>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : salons.length === 0 ? (
                <div className="bg-[#111118] border border-white/5 rounded-2xl p-12 text-center">
                  <Scissors className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No salons registered yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {salons.map((salon, i) => (
                    <motion.div
                      key={salon._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-[#111118] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Scissors className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-white text-sm">{salon.name}</h3>
                              <span className="text-[10px] bg-[#1A1A2E] text-slate-400 px-2 py-0.5 rounded-full font-mono">{salon.shopNumber}</span>
                              {salon.isOpen !== undefined && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${salon.isOpen ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {salon.isOpen ? 'Open' : 'Closed'}
                                </span>
                              )}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${salon.isVerified ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                {salon.isVerified ? 'Verified' : 'Unverified'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                              <span>📍 {salon.city}, {salon.pincode}</span>
                              {salon.phone && <span>📞 {salon.phone}</span>}
                              {salon.email && <span className="truncate">✉️ {salon.email}</span>}
                              <span>📅 {formatDate(salon.createdAt)}</span>
                              {salon.services && salon.services.length > 0 && (
                                <span>✂️ {salon.services.length} service{salon.services.length !== 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={async () => {
                              const endpoint = salon.isVerified ? 'unverify' : 'verify';
                              const { error } = await adminApi.post(`/admin/salons/${salon._id}/${endpoint}`, {});
                              if (error) showToast(error);
                              else { showToast(`${salon.name} ${endpoint}d`); fetchAll(); }
                            }}
                            className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                              salon.isVerified ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-600 hover:text-blue-400 hover:bg-blue-500/10'
                            }`}
                            title={salon.isVerified ? 'Unverify' : 'Verify'}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'salon', id: salon._id, name: salon.name })}
                            className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                            title="Delete salon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Users sub-section */}
              {(() => {
                const salonUsers = users.filter((u) => u.role === 'salon' || u.role === 'customer');
                return salonUsers.length > 0 ? (
                <div className="mt-8">
                  <h2 className="text-lg font-bold text-white mb-4">Registered Users ({salonUsers.length})</h2>
                  <div className="space-y-3">
                    {salonUsers.map((user, i) => (
                      <motion.div
                        key={user._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-[#111118] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-colors group cursor-pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-all">
                              <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                                  {user.name || user.salonName || 'No Name'}
                                </h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${user.role === 'salon' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                  {user.role}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                                <span>📞 {user.phone}</span>
                                {user.email && <span className="truncate">✉️ {user.email}</span>}
                                <span>📅 {formatDate(user.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-4 h-4" />
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({ type: 'user', id: user._id, name: user.name || user.phone });
                              }}
                              className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : null;
              })()}

              {/* Bookings sub-section */}
              {bookings.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-bold text-white mb-4">All Bookings ({bookings.length})</h2>
                  <div className="space-y-3">
                    {bookings.map((booking, i) => (
                      <motion.div
                        key={booking._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-[#111118] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                              <CalendarCheck className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-white text-sm">{booking.customerName}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                                  booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                  'bg-slate-500/10 text-slate-400'
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                                <span>✂️ {booking.serviceName} — ₹{booking.price}</span>
                                <span>📞 {booking.customerPhone}</span>
                                <span>📅 {booking.date} at {booking.time}</span>
                                <span>🏪 {getSalonName(booking.salonId)}</span>
                                <span>🕐 Booked {formatDate(booking.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setDeleteTarget({ type: 'booking', id: booking._id, name: `${booking.customerName}'s booking` })}
                            className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                            title="Delete booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* HOSPITALS TAB */}
          {activeTab === 'hospitals' && (
            <motion.div
              key="hospitals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">All Hospitals ({hospitals.length})</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                  <span className="text-xs text-slate-500">Hospitals Module</span>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : hospitals.length === 0 ? (
                <div className="bg-[#111118] border border-white/5 rounded-2xl p-12 text-center">
                  <Hospital className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No hospitals registered yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hospitals.map((h, i) => (
                    <motion.div
                      key={h._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-[#111118] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Hospital className="w-5 h-5 text-rose-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-white text-sm">{h.name}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${h.isOpen ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {h.isOpen ? 'Open' : 'Closed'}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${h.isVerified ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                {h.isVerified ? 'Verified' : 'Unverified'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                              <span>📍 {h.city}, {h.pincode}</span>
                              {h.phone && <span>📞 {h.phone}</span>}
                              {h.email && <span className="truncate">✉️ {h.email}</span>}
                              <span>📅 {formatDate(h.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={async () => {
                              const endpoint = h.isVerified ? 'unverify' : 'verify';
                              const { error } = await adminApi.post(`/admin/hospitals/${h._id}/${endpoint}`, {});
                              if (error) showToast(error);
                              else { showToast(`${h.name} ${endpoint}d`); fetchAll(); }
                            }}
                            className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                              h.isVerified ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-600 hover:text-blue-400 hover:bg-blue-500/10'
                            }`}
                            title={h.isVerified ? 'Unverify' : 'Verify'}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'hospital', id: h._id, name: h.name })}
                            className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                            title="Delete hospital"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* SCHOOL TAB */}
          {activeTab === 'school' && (
            <motion.div
              key="school"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">All Schools ({schools.length})</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span className="text-xs text-slate-500">Schools Module</span>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : schools.length === 0 ? (
                <div className="bg-[#111118] border border-white/5 rounded-2xl p-12 text-center">
                  <School className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No schools registered yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schools.map((s, i) => (
                    <motion.div
                      key={s._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-[#111118] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <School className="w-5 h-5 text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-white text-sm">{s.name}</h3>
                              <span className="text-[10px] bg-[#1A1A2E] text-slate-400 px-2 py-0.5 rounded-full font-mono">{s.schoolId}</span>
                              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">{s.code}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                              <span>📍 {s.city}, {s.state}</span>
                              <span>📞 {s.contactNumber}</span>
                              <span>👤 Principal: {s.principalName}</span>
                              <span>📅 {formatDate(s.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setDeleteTarget({ type: 'school', id: s._id, name: s.name })}
                          className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                          title="Delete school"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
