'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors, Users, Clock, CheckCircle, MapPin, Search,
  Power, Plus, Trash2, Camera, Save, Calendar,
  TrendingUp, User, Loader2, Navigation,
  Star, Store, Bell, LogOut, Phone, Mail,
  ArrowRight, CreditCard, IndianRupee, AlertCircle,
  Copy, Upload, ExternalLink
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { api, getUser, getToken } from '@/lib/api';
import { useInactivityLogout } from '@/lib/useInactivityLogout';
import { useLanguage } from '@/lib/language-context';

const DynamicMap = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#161616] rounded-2xl border border-white/5 flex items-center justify-center min-h-[300px]">
      <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
    </div>
  ),
});

interface ServiceItem {
  name: string;
  price: number;
  completed: boolean;
}

interface QueueItem {
  _id: string;
  ticket: string;
  customerName: string;
  position: number;
  serviceName: string;
  price: number;
  status: string;
  services?: ServiceItem[];
  totalPrice?: number;
  skipNote?: string;
}

interface SalonData {
  _id: string;
  name: string;
  shopNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  description: string;
  salonType: 'male' | 'female' | 'unisex';
  isOpen: boolean;
  isVerified: boolean;
  lat: number;
  lng: number;
  image: string;
  services: { id: string; name: string; price: number; duration: string }[];
  members: { name: string; specialization: string; experience: string; image?: string }[];
}

type Section = 'dashboard' | 'profile' | 'earnings' | 'shop' | 'subscription';

export default function SalonDashboard() {
  useInactivityLogout('/salon/login');
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" /></div>}>
      <SalonDashboardContent />
    </Suspense>
  );
}

function SalonDashboardContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const section = (searchParams.get('section') as Section) || 'dashboard';

  const [salon, setSalon] = useState<SalonData | null>(null);
  const [noSalon, setNoSalon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [queueData, setQueueData] = useState<{ serving: QueueItem | null; waiting: QueueItem[]; totalWaiting: number } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [toast, setToast] = useState('');
  const [trialExpired, setTrialExpired] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchSalon = useCallback(async () => {
    setLoading(true);
    const [salonRes, statusRes] = await Promise.all([
      api.get<{ salon: SalonData }>('/salons/my'),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/subscriptions/my-status`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      }).then(r => r.json()).catch(() => ({})),
    ]);
    const { data } = salonRes;
    if (data) {
      setSalon(data.salon);
      setNoSalon(false);
      fetchQueue(data.salon._id);
      fetchStats(data.salon._id);
      localStorage.setItem('dqms_shop_name', data.salon.name);
      window.dispatchEvent(new CustomEvent('dqms-shop-name-update', { detail: data.salon.name }));
    } else {
      setNoSalon(true);
    }
    const trial = statusRes?.trial;
    const sub = statusRes?.subscription;
    if (trial && !trial.active && (!sub || sub.status !== 'active')) {
      setTrialExpired(true);
    }
    setLoading(false);
  }, []);

  const fetchQueue = async (salonId: string) => {
    const { data } = await api.get<{ serving: QueueItem | null; waiting: QueueItem[]; totalWaiting: number }>(`/queue/${salonId}`);
    if (data) setQueueData(data);
  };

  const fetchStats = async (salonId: string) => {
    const { data } = await api.get<any>(`/queue/stats/${salonId}`);
    if (data) setStats(data);
  };

  useEffect(() => { fetchSalon(); }, [fetchSalon]);

  useEffect(() => {
    if (!salon) return;
    const interval = setInterval(() => { fetchQueue(salon._id); fetchStats(salon._id); }, 15000);
    return () => clearInterval(interval);
  }, [salon]);

  const toggleOpen = async () => {
    if (!salon) return;
    const { data, error } = await api.put<{ salon: SalonData }>(`/salons/${salon._id}`, { isOpen: !salon.isOpen });
    if (error) { showToast(error); return; }
    if (data) {
      setSalon(data.salon);
      localStorage.setItem('dqms_shop_name', data.salon.name);
      window.dispatchEvent(new CustomEvent('dqms-shop-name-update', { detail: data.salon.name }));
    }
    showToast(salon.isOpen ? t('common.salonClosed') : t('common.salonOpened'));
  };

  const updateSalon = async (updates: Partial<SalonData>) => {
    if (!salon) return;
    const { data, error } = await api.put<{ salon: SalonData }>(`/salons/${salon._id}`, updates);
    if (error) { showToast(error); return; }
    if (data) {
      setSalon(data.salon);
      localStorage.setItem('dqms_shop_name', data.salon.name);
      window.dispatchEvent(new CustomEvent('dqms-shop-name-update', { detail: data.salon.name }));
    }
    showToast(t('common.saved'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (noSalon) {
    return <CreateSalonForm onCreated={(s) => { setSalon(s); setNoSalon(false); fetchQueue(s._id); }} showToast={showToast} />;
  }

  if (!salon) return null;

  return (
    <div>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[100] bg-[#1A1A2E] border border-white/10 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-sm">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {section === 'dashboard' && (
        <DashboardSection salon={salon} queueData={queueData} stats={stats} toggleOpen={toggleOpen} fetchQueue={() => fetchQueue(salon._id)} trialExpired={trialExpired} />
      )}
      {section === 'profile' && <EditProfileSection salon={salon} onUpdate={updateSalon} />}
      {section === 'earnings' && <EarningsSection stats={stats} />}
      {section === 'shop' && <ShopSection salon={salon} onUpdate={updateSalon} />}
      {section === 'subscription' && <SubscriptionSection />}
    </div>
  );
}

function CreateSalonForm({ onCreated, showToast }: {
  onCreated: (s: SalonData) => void;
  showToast: (m: string) => void;
}) {
  const { t } = useLanguage();
  const userData = getUser();
  const [form, setForm] = useState({
    name: (userData?.salonName as string) || '',
    email: (userData?.email as string) || '',
    phone: (userData?.phone as string) || '',
    address: '',
    city: '',
    pincode: '',
    description: ''
  });
  const [customNumber, setCustomNumber] = useState('');
  const [useCustomNumber, setUseCustomNumber] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.pincode.length !== 6) {
      setError(t('dashboard.validationRequired'));
      return;
    }
    if (useCustomNumber && (!customNumber || customNumber.length !== 3)) {
      setError(t('dashboard.validationShopNumber'));
      return;
    }
    setSaving(true); setError('');
    const { data, error: apiErr } = await api.post<{ salon: SalonData }>('/salons', {
      ...form,
      city: form.city || form.address.split(',')[0].trim(),
      salonType: 'unisex',
      customNumber: useCustomNumber ? customNumber : undefined,
    });
    setSaving(false);
    if (apiErr) { setError(apiErr); return; }
    if (data) {
      localStorage.setItem('dqms_shop_name', data.salon.name);
      window.dispatchEvent(new CustomEvent('dqms-shop-name-update', { detail: data.salon.name }));
      showToast(t('common.salonCreated'));
      onCreated(data.salon);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-8 px-4 sm:px-0">
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#D4AF37] to-[#C9A227] rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-[#D4AF37]/20">
          <Store className="w-8 h-8 sm:w-10 sm:h-10 text-[#0D0D0D]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{t('dashboard.createSalon')}</h1>
        <p className="text-xs sm:text-sm text-[#A0A0A0]">{t('dashboard.setupProfile')}</p>
      </div>

      <div className="bg-[#111118] border border-white/5 rounded-2xl p-5 sm:p-8">
        <form onSubmit={handleCreate} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">{t('dashboard.salonName')}</label>
            <input type="text" className="salon-input w-full text-sm" placeholder="e.g. Premium Cuts & Styles"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">{t('dashboard.email')}</label>
              <input type="email" className="salon-input w-full text-sm" placeholder="contact@salon.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">{t('dashboard.phone')}</label>
              <input type="tel" className="salon-input w-full text-sm" placeholder="+91 98765 43210"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">{t('dashboard.pincode')}</label>
              <input type="text" maxLength={6} className="salon-input w-full text-sm" placeholder="144411"
                value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">City</label>
              <input type="text" className="salon-input w-full text-sm" placeholder="e.g. Delhi"
                value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Address</label>
            <input type="text" className="salon-input w-full text-sm" placeholder="e.g. Model Town, near Central Mall"
              value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Description</label>
            <textarea className="salon-input w-full text-sm min-h-[80px]" placeholder="Describe your salon..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="bg-[#1A1A2E] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-[#A0A0A0]">Shop Number</label>
              <button type="button" onClick={() => { setUseCustomNumber(!useCustomNumber); setCustomNumber(''); }}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${useCustomNumber ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#161616] text-[#A0A0A0] hover:text-white'}`}>
                {useCustomNumber ? 'Auto-generate' : 'Choose my own'}
              </button>
            </div>
            {useCustomNumber ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#A0A0A0] font-mono">{form.pincode || '------'}-</span>
                <input type="text" maxLength={3} placeholder="007"
                  className="salon-input w-20 text-sm text-center font-mono tracking-widest"
                  value={customNumber} onChange={(e) => setCustomNumber(e.target.value.replace(/\D/g, ''))} />
                <span className="text-xs text-[#666]">3 digits</span>
              </div>
            ) : (
              <p className="text-xs text-[#666]">A unique number will be assigned automatically</p>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={saving}
            className="salon-btn-gold w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Store className="w-5 h-5" /> Create Salon</>}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function DashboardSection({ salon, queueData, stats, toggleOpen, fetchQueue, trialExpired }: {
  salon: SalonData;
  queueData: { serving: QueueItem | null; waiting: QueueItem[]; totalWaiting: number } | null;
  stats: any;
  toggleOpen: () => void;
  fetchQueue: () => void;
  trialExpired?: boolean;
}) {
  const { t } = useLanguage();
  const [actionLoading, setActionLoading] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string } | null>(null);

  const serviceCompletedCount = (queueData?.serving?.services || [])
    .filter((s: ServiceItem) => s.completed).length;

  const executeAction = async (type: string) => {
    if (!queueData?.serving || !confirmAction) return;
    const id = queueData.serving._id;
    setActionLoading(type);
    setConfirmAction(null);
    await api.patch(`/queue/${id}/${type}`);
    if (type !== 'skip' && queueData.waiting.length > 0) {
      await api.patch(`/queue/${queueData.waiting[0]._id}/serve`);
    }
    setActionLoading('');
    fetchQueue();
  };

  const handleTickService = async (index: number) => {
    if (!queueData?.serving) return;
    await api.patch(`/queue/${queueData.serving._id}/tick-service/${index}`);
    fetchQueue();
  };

  const handleComplete = () => {
    if (!queueData?.serving) return;
    if (serviceCompletedCount === 0) return;
    setConfirmAction({ type: 'complete', id: queueData.serving._id });
  };

  const handleSkip = () => {
    if (!queueData?.serving) return;
    setConfirmAction({ type: 'skip', id: queueData.serving._id });
  };

  const handleDelete = () => {
    if (!queueData?.serving) return;
    setConfirmAction({ type: 'delete', id: queueData.serving._id });
  };

  const handleServe = async (waitingId: string) => {
    setActionLoading(waitingId);
    await api.patch(`/queue/${waitingId}/serve`);
    setActionLoading('');
    fetchQueue();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {trialExpired && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">
            Your free trial has expired.{' '}
            <a href="/salon/dashboard?section=subscription" className="text-[#D4AF37] underline font-semibold hover:no-underline">
              Subscribe now
            </a>{' '}
            to keep your salon listed and continue serving customers.
          </p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{salon.name} <span className="text-[#A0A0A0] text-lg font-normal">({salon.shopNumber})</span></h1>
          <p className="text-[#A0A0A0] text-sm mt-0.5">{salon.city}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={fetchQueue} className="p-3 sm:p-2.5 rounded-xl bg-[#1A1A2E] border border-white/5 text-[#A0A0A0] hover:text-white transition-colors" title="Refresh">
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <button onClick={toggleOpen}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 rounded-xl font-semibold text-sm transition-all ${
              salon.isOpen
                ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                : 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
            }`}>
            <Power className={`w-5 h-5 sm:w-4 sm:h-4 ${salon.isOpen ? 'text-green-400' : 'text-red-400'}`} />
            {salon.isOpen ? 'Open' : 'Closed'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-4">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{queueData?.totalWaiting ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t('queue.inQueue')}</p>
        </div>
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-4">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-3">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{stats?.today ?? '—'}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t('dashboard.today')}</p>
        </div>
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-4">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-bold text-white">₹{stats?.todayEarnings ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t('dashboard.todayEarnings')}</p>
        </div>
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-4">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <p className="text-lg font-bold text-white">₹{stats?.monthEarnings ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t('dashboard.monthEarnings')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-5 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            {t('dashboard.nowServing')}
          </h3>
          {queueData?.serving ? (
            <div className="salon-glass-card rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">{queueData.serving.ticket}</span>
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">{t('dashboard.inProgress')}</span>
              </div>
              <p className="text-white font-semibold text-base sm:text-lg break-words">{queueData.serving.customerName}</p>

              {/* Services list with tick marks */}
              {(queueData.serving.services && queueData.serving.services.length > 0) ? (
                <div className="space-y-1.5 my-3">
                  {queueData.serving.services.map((svc: ServiceItem, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleTickService(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all ${
                        svc.completed
                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                          : 'bg-[#1A1A2E] border-white/5 text-[#A0A0A0] hover:border-white/15'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        svc.completed ? 'bg-green-500 border-green-500' : 'border-[#444]'
                      }`}>
                        {svc.completed && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <span className="text-sm flex-1">{svc.name}</span>
                      <span className="text-xs font-semibold">₹{svc.price}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[#A0A0A0] text-sm mb-4">{queueData.serving.serviceName}</p>
              )}

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={handleComplete}
                  disabled={actionLoading !== '' || serviceCompletedCount === 0}
                  className="flex-1 px-3 py-3 sm:py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-sm font-semibold hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  title={serviceCompletedCount === 0 ? 'Tick at least one service first' : ''}
                >
                  {actionLoading === 'complete' ? '...' : t('queue.complete')}
                </button>
                <button
                  onClick={handleSkip}
                  disabled={actionLoading !== ''}
                  className="flex-1 px-3 py-3 sm:py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm font-semibold hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'skip' ? '...' : t('queue.skip')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading !== ''}
                  className="flex-1 px-3 py-3 sm:py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'delete' ? '...' : t('queue.delete')}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <Scissors className="w-10 h-10 text-[#333] mx-auto mb-3" />
              <p className="text-[#666]">{t('dashboard.noOneServing')}</p>
            </div>
          )}
        </div>

        <div className="bg-[#111118] border border-white/5 rounded-2xl p-5 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            {t('queue.waitingList')} ({queueData?.totalWaiting || 0})
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {queueData?.waiting && queueData.waiting.length > 0 ? (
              queueData.waiting.map((item, idx) => (
                <div key={item._id} className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-[#1A1A2E] border gap-2 sm:gap-3 ${item.skipNote ? 'border-yellow-500/20' : 'border-white/5'}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] font-bold text-sm flex-shrink-0">{item.ticket}</span>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.customerName}</p>
                      <p className="text-[#666] text-xs truncate">{item.serviceName}</p>
                      {item.skipNote && (
                        <p className="text-[10px] text-yellow-400 mt-0.5 leading-tight">{t('skip.note')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-[#A0A0A0] bg-[#161616] px-2.5 sm:px-2 py-1 rounded-full">#{item.position}</span>
                    {idx === 0 && !queueData.serving && (
                      <button
                        onClick={() => handleServe(item._id)}
                        disabled={actionLoading !== ''}
                        className="px-3 sm:px-3.5 py-2 sm:py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === item._id ? '...' : t('dashboard.serve')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Clock className="w-10 h-10 text-[#333] mx-auto mb-3" />
                <p className="text-[#666]">{t('dashboard.queueEmpty')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmAction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setConfirmAction(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-bold text-white mb-2">
              {confirmAction.type === 'complete' ? t('dashboard.completeService') : confirmAction.type === 'skip' ? t('dashboard.skipCustomer') : t('dashboard.deleteCustomer')}
            </h3>
            <p className="text-[#A0A0A0] text-sm mb-6">
              {confirmAction.type === 'complete'
                ? t('dashboard.completeConfirmDesc')
                : confirmAction.type === 'skip'
                ? t('dashboard.skipConfirmDesc')
                : t('dashboard.deleteConfirmDesc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#161616] border border-[#333] text-[#A0A0A0] text-sm font-medium hover:text-white transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => executeAction(confirmAction.type)}
                disabled={actionLoading !== ''}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  confirmAction.type === 'complete'
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                    : confirmAction.type === 'skip'
                    ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                }`}
              >
                {actionLoading !== '' ? '...' : confirmAction.type === 'complete' ? t('queue.complete') : confirmAction.type === 'skip' ? t('queue.skip') : t('queue.delete')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

function EditProfileSection({ salon, onUpdate }: {
  salon: SalonData;
  onUpdate: (u: Partial<SalonData>) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState(salon.name);
  const [description, setDescription] = useState(salon.description || '');
  const [image, setImage] = useState(salon.image || '');
  const [salonType, setSalonType] = useState<'male' | 'female' | 'unisex'>(salon.salonType || 'unisex');
  const [services, setServices] = useState<{ id: string; name: string; price: number; duration: string }[]>(
    salon.services || []
  );
  const [members, setMembers] = useState(salon.members || []);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (file: File, cb: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();
      if (data.url) cb(data.url);
    };
    reader.readAsDataURL(file);
  };

  const addMember = () => setMembers([...members, { name: '', specialization: '', experience: '', image: '' }]);
  const removeMember = (i: number) => setMembers(members.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: string, value: string) => {
    const updated = [...members];
    (updated[i] as any)[field] = value;
    setMembers(updated);
  };

  const addService = () => setServices([...services, { id: `svc_${Date.now()}`, name: '', price: 0, duration: '30 min' }]);
  const removeService = (i: number) => setServices(services.filter((_, idx) => idx !== i));
  const updateService = (i: number, field: string, value: string | number) => {
    const updated = [...services];
    (updated[i] as any)[field] = value;
    setServices(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    const validMembers = members.filter(m => m.name.trim() && m.specialization.trim());
    const validServices = services.filter(s => s.name.trim());
    await onUpdate({ name, description, image, salonType, services: validServices, members: validMembers });
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">{t('dashboard.editProfile')}</h1>
          <p className="text-xs sm:text-sm text-[#A0A0A0] mt-0.5">{t('dashboard.updateDetails')}</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="salon-btn-gold flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50 self-start sm:self-auto">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('common.save')}
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-5">
            <h3 className="text-base sm:text-lg font-bold text-white">{t('dashboard.salonDetails')}</h3>
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">{t('dashboard.shopImage')}</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#1A1A2E] border border-white/10 overflow-hidden flex-shrink-0">
                  {image ? <img src={image} alt="Salon" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-[#333]"><Store className="w-8 h-8" /></div>
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#1A1A2E] border border-white/10 text-sm text-[#A0A0A0] hover:text-white hover:border-[#D4AF37]/30 transition-colors">
                  <Camera className="w-4 h-4 inline mr-2" /> {t('dashboard.upload')}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, setImage);
                  }} />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">{t('dashboard.shopName')}</label>
              <input type="text" className="salon-input w-full text-sm" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-3">Salon Type</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'male', label: '✂️ Male', sub: 'Barbershop', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-300' },
                  { value: 'female', label: '💅 Female', sub: 'Beauty Parlour', color: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-300' },
                  { value: 'unisex', label: '✨ Unisex', sub: 'All Welcome', color: 'from-[#D4AF37]/20 to-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSalonType(opt.value)}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-center transition-all duration-200 ${
                      salonType === opt.value
                        ? `bg-gradient-to-b ${opt.color} scale-[1.02] shadow-lg`
                        : 'bg-[#1A1A2E] border-white/5 text-[#A0A0A0] hover:border-white/15'
                    }`}
                  >
                    <span className="text-lg leading-none">{opt.label.split(' ')[0]}</span>
                    <span className="text-xs font-semibold leading-none">{opt.label.split(' ')[1]}</span>
                    <span className="text-[10px] leading-none opacity-70">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">{t('dashboard.description')}</label>
              <textarea className="salon-input w-full text-sm min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div className="bg-[#111118] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-white">{t('dashboard.peopleWorking')}</h3>
              <button onClick={addMember} className="text-sm text-[#D4AF37] hover:underline flex items-center gap-1">
                <Plus className="w-4 h-4" /> {t('dashboard.addStaff')}
              </button>
            </div>
            <AnimatePresence>
              {members.map((member, i) => (
                <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="bg-[#1A1A2E] border border-white/5 rounded-xl p-4 space-y-3 relative">
                  <button onClick={() => removeMember(i)} className="absolute top-3 right-3 p-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#161616] border border-white/10 overflow-hidden flex-shrink-0">
                      {member.image ? <img src={member.image} alt={member.name} className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full flex items-center justify-center text-[#333]"><User className="w-5 h-5" /></div>
                      )}
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#161616] border border-white/10 text-xs text-[#A0A0A0] hover:text-white transition-colors">
                      <Camera className="w-3 h-3 inline mr-1" /> {t('dashboard.photo')}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, (url) => updateMember(i, 'image', url));
                      }} />
                    </label>
                  </div>
                  <input type="text" className="salon-input w-full text-sm" placeholder="Name" value={member.name} onChange={(e) => updateMember(i, 'name', e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" className="salon-input w-full text-sm" placeholder="Specialization" value={member.specialization} onChange={(e) => updateMember(i, 'specialization', e.target.value)} />
                    <input type="text" className="salon-input w-full text-sm" placeholder="Experience" value={member.experience} onChange={(e) => updateMember(i, 'experience', e.target.value)} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {members.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-[#333] mx-auto mb-2" />
                <p className="text-[#666] text-sm">{t('dashboard.noStaff')}</p>
                <button onClick={addMember} className="mt-3 text-sm text-[#D4AF37] hover:underline">{t('dashboard.addYourTeam')}</button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#111118] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-white">{t('dashboard.servicesPricing')}</h3>
            <button onClick={addService} className="text-sm text-[#D4AF37] hover:underline flex items-center gap-1">
              <Plus className="w-4 h-4" /> {t('dashboard.addService')}
            </button>
          </div>
          <AnimatePresence>
            {services.map((service, i) => (
              <motion.div key={service.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-[#1A1A2E] border border-white/5 rounded-xl p-4 space-y-3 relative">
                <button onClick={() => removeService(i)} className="absolute top-3 right-3 p-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs text-[#A0A0A0] mb-1">{t('dashboard.serviceName')}</label>
                    <input type="text" className="salon-input w-full text-sm" placeholder="e.g. Haircut"
                      value={service.name} onChange={(e) => updateService(i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A0A0A0] mb-1">{t('dashboard.price')}</label>
                    <input type="number" min={0} className="salon-input w-full text-sm" placeholder="499"
                      value={service.price || ''} onChange={(e) => updateService(i, 'price', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A0A0A0] mb-1">{t('dashboard.duration')}</label>
                    <select className="salon-input w-full text-sm" value={service.duration} onChange={(e) => updateService(i, 'duration', e.target.value)}>
                      <option value="15 min">15 min</option>
                      <option value="30 min">30 min</option>
                      <option value="45 min">45 min</option>
                      <option value="1 hr">1 hr</option>
                      <option value="1.5 hr">1.5 hr</option>
                      <option value="2 hr">2 hr</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {services.length === 0 && (
            <div className="text-center py-8">
              <TrendingUp className="w-10 h-10 text-[#333] mx-auto mb-2" />
              <p className="text-[#666] text-sm">No services added yet</p>
              <button onClick={addService} className="mt-3 text-sm text-[#D4AF37] hover:underline">Add your first service</button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EarningsSection({ stats }: { stats: any | null }) {
  const { t } = useLanguage();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('dashboard.earningsHistory')}</h1>
        <p className="text-[#A0A0A0] text-sm mt-0.5">{t('dashboard.trackRevenue')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-5">
          <p className="text-sm text-[#A0A0A0] mb-1">{t('dashboard.today')}</p>
          <p className="text-3xl font-bold text-white">₹{stats?.todayEarnings ?? 0}</p>
        </div>
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-5">
          <p className="text-sm text-[#A0A0A0] mb-1">{t('dashboard.thisMonth')}</p>
          <p className="text-3xl font-bold text-white">₹{stats?.monthEarnings ?? 0}</p>
        </div>
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-5">
          <p className="text-sm text-[#A0A0A0] mb-1">{t('dashboard.allTime')}</p>
          <p className="text-3xl font-bold text-white">₹{stats?.allEarnings ?? 0}</p>
        </div>
      </div>

      <div className="bg-[#111118] border border-white/5 rounded-2xl p-5 sm:p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          {t('dashboard.completedServices')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t('dashboard.thisMonth'), value: stats?.month ?? '—', icon: TrendingUp, color: 'from-purple-500 to-violet-600' },
            { label: t('dashboard.thisYear'), value: stats?.year ?? '—', icon: Clock, color: 'from-cyan-500 to-blue-600' },
            { label: t('dashboard.allTime'), value: stats?.all ?? '—', icon: CheckCircle, color: 'from-pink-500 to-rose-600' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-[#1A1A2E] border border-white/5 rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-[#A0A0A0]">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </motion.div>
  );
}

function SubscriptionSection() {
  const { t } = useLanguage();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const UPI_ID = 'kumar.d3@ptyes';
  const PLANS = [
    { value: '1month', label: '1 Month', price: 30, popular: false },
    { value: '3month', label: '3 Months', price: 85, popular: true },
  ];
  const [selectedPlan, setSelectedPlan] = useState('1month');
  const [utr, setUtr] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [currentTrial, setCurrentTrial] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  });

  const fetchStatus = async () => {
    setPageLoading(true);
    const res = await fetch(`${API}/subscriptions/my-status`, { headers: headers() });
    const data = await res.json();
    if (data.subscription) setCurrentSub(data.subscription);
    if (data.trial) setCurrentTrial(data.trial);
    setPageLoading(false);
  };

  useEffect(() => { fetchStatus(); }, []);

  const getTimeLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!utr.trim()) { setError('UTR number is required'); return; }
    if (!/^\d{12}$/.test(utr.trim())) { setError('UTR must be exactly 12 digits'); return; }
    if (!file) { setError('Payment screenshot is required'); return; }
    setLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      const uploadRes = await fetch(`${API}/upload`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ image: base64 }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) { setError(uploadData.error || 'Upload failed'); setLoading(false); return; }
      const subRes = await fetch(`${API}/subscriptions/request`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ utr: utr.trim(), screenshot: uploadData.url, plan: selectedPlan }),
      });
      const subData = await subRes.json();
      if (!subRes.ok) { setError(subData.error); setLoading(false); return; }
      setSuccess('Subscription request submitted! Admin will review it shortly.');
      setUtr(''); setFile(null);
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
    setLoading(false);
  };

  const price = PLANS.find(p => p.value === selectedPlan)?.price || 30;

  if (pageLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#1A1A2E] rounded-2xl mx-auto mb-4 animate-pulse" />
            <div className="h-7 w-56 bg-[#1A1A2E] rounded-lg mx-auto mb-2 animate-pulse" />
            <div className="h-4 w-24 bg-[#1A1A2E] rounded-lg mx-auto animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-16 bg-[#1A1A2E] rounded-xl animate-pulse" />
            <div className="h-12 bg-[#1A1A2E] rounded-xl animate-pulse" />
            <div className="h-12 bg-[#1A1A2E] rounded-xl animate-pulse" />
          </div>
        </div>
      </motion.div>
    );
  }

  const showNewSubscription = !currentSub || currentSub.status === 'rejected' || (currentSub.status === 'expired' && (!currentTrial || !currentTrial.active));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Salon Subscription</h1>
        <p className="text-[#A0A0A0] text-sm mt-0.5">Choose a plan and pay via UPI</p>
      </div>

      {currentTrial?.active && !currentSub?.status && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-6 text-center">
          <Clock className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <p className="text-blue-400 font-bold text-lg">Free Trial Active</p>
          <p className="text-xs text-slate-400 mt-1">
            {getTimeLeft(currentTrial.endDate)} &middot; Expires {new Date(currentTrial.endDate).toLocaleDateString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-2">Subscribe anytime to keep your salon listed</p>
        </div>
      )}

      {currentTrial && !currentTrial.active && !currentSub?.status && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-bold text-lg">Trial Expired</p>
          <p className="text-xs text-slate-400 mt-1">Your free trial has ended. Subscribe to continue.</p>
        </div>
      )}

      {currentSub?.status === 'active' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-6 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-emerald-400 font-bold text-lg">Subscription Active</p>
          <p className="text-xs text-slate-400 mt-1">
            Valid till {new Date(currentSub.endDate).toLocaleDateString('en-IN')}
          </p>
        </div>
      )}

      {currentSub?.status === 'pending' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mb-6 text-center">
          <Clock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-amber-400 font-bold text-lg">Payment Under Review</p>
          <p className="text-xs text-slate-400 mt-2">Admin will verify your payment. Max wait time: <span className="text-amber-300 font-semibold">8 hours</span>.</p>
          <p className="text-xs text-slate-500 mt-1">You'll be notified once your subscription is activated.</p>
        </div>
      )}

      {showNewSubscription && (
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-6">
          <div className="grid grid-cols-2 gap-3 mb-6">
            {PLANS.map((plan) => (
              <button
                key={plan.value}
                type="button"
                onClick={() => setSelectedPlan(plan.value)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPlan === plan.value
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-white/10 bg-[#1A1A2E] hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 right-3 text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#0D0D0D] font-bold">POPULAR</span>
                )}
                <p className="text-white font-bold text-lg">₹{plan.price}</p>
                <p className="text-[#A0A0A0] text-sm">{plan.label}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Pay to UPI ID</p>
                <p className="text-white font-mono font-semibold">{UPI_ID}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Amount: ₹{price}</p>
                <p className="text-[10px] text-rose-400 mt-0.5">Only payment through UPI</p>
              </div>
              <button type="button" onClick={() => { navigator.clipboard.writeText(UPI_ID); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-2 rounded-lg bg-[#1A1A2E] border border-white/10 text-slate-400 hover:text-rose-400 transition-colors">
                {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">UTR Number</label>
              <input type="text" value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="Enter 12-digit UTR number" maxLength={12} className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rose-500/50 transition-colors" />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Payment Screenshot</label>
              <label className="flex items-center gap-3 w-full bg-[#0D0D0D] border border-white/10 border-dashed rounded-xl px-4 py-3 cursor-pointer hover:border-rose-500/50 transition-colors">
                <Upload className="w-5 h-5 text-slate-500" />
                <span className="text-sm text-slate-500 flex-1 truncate">{file ? file.name : 'Upload screenshot'}</span>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
            </div>

            {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
            {success && <p className="text-green-400 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {success}</p>}

            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-[#0D0D0D] font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : `Pay ₹${price} & Subscribe`}
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
}

function ShopSection({ salon, onUpdate }: {
  salon: SalonData;
  onUpdate: (u: Partial<SalonData>) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [address, setAddress] = useState(salon.address || '');
  const [city, setCity] = useState(salon.city || '');
  const [pincode, setPincode] = useState(salon.pincode || '');
  const [lat, setLat] = useState(salon.lat || 28.65);
  const [lng, setLng] = useState(salon.lng || 77.22);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const handleGetLocation = () => {
    setDetecting(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setDetecting(false); },
        () => setDetecting(false)
      );
    } else setDetecting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({ address, city, pincode, lat, lng });
    setSaving(false);
  };

  const salonsForMap = [{ id: salon._id, slug: 'shop', name: salon.name, address, rating: 5, lat, lng }];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('dashboard.yourShop')}</h1>
          <p className="text-[#A0A0A0] text-sm mt-0.5">{t('dashboard.manageLocation')}</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="salon-btn-gold flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('dashboard.saveLocation')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">{t('dashboard.locationDetails')}</h3>
          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">{t('dashboard.pincodeLabel')}</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0A0A0]" />
              <input type="text" maxLength={6} className="salon-input pl-12 w-full" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">{t('dashboard.cityLabel')}</label>
            <input type="text" className="salon-input w-full" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">{t('dashboard.fullAddress')}</label>
            <textarea className="salon-input w-full min-h-[80px]" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">{t('dashboard.mapCoordinates')}</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[#666] mb-1">{t('dashboard.latitude')}</p>
                <input type="text" className="salon-input w-full text-sm" value={lat} onChange={(e) => setLat(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <p className="text-xs text-[#666] mb-1">{t('dashboard.longitude')}</p>
                <input type="text" className="salon-input w-full text-sm" value={lng} onChange={(e) => setLng(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>
          <button onClick={handleGetLocation} disabled={detecting}
            className="w-full py-3 rounded-xl bg-[#1A1A2E] border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors text-sm font-medium flex items-center justify-center gap-2">
            {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {detecting ? t('dashboard.detecting') : t('dashboard.useMyLocation')}
          </button>
        </div>

        <div className="bg-[#111118] border border-white/5 rounded-2xl overflow-hidden min-h-[400px]">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-lg font-bold text-white">{t('dashboard.mapPreview')}</h3>
            <p className="text-xs text-[#A0A0A0] mt-0.5">{t('dashboard.pinShowsLocation')}</p>
          </div>
          <div className="h-[400px]">
            <DynamicMap salons={salonsForMap as any} userLocation={[lat, lng]} onMarkerClick={() => {}} editable={true} onLocationChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
