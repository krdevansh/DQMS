'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Scissors, Clock, MapPin, Star, ArrowLeft, ArrowRight,
  CheckCircle, Sparkles, Hash, Phone,
  Coins, X, UserPlus, Check, ShoppingBag,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import { getCustomerProfile } from '@/lib/storage';
import { useLanguage } from '@/lib/language-context';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
}

interface SalonDetail {
  _id: string;
  shopNumber: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  description: string;
  salonType: string;
  isOpen: boolean;
  rating: number;
  reviews: number;
  lat: number;
  lng: number;
  services: Service[];
  members: { name: string; specialization: string; experience: string }[];
  image: string;
}

// ─── Service Selection Modal ─────────────────────────────────────────────────
function ServicePickerModal({
  services,
  onConfirm,
  onCancel,
}: {
  services: Service[];
  onConfirm: (selected: Service[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedServices = services.filter(s => selected.has(s.id));
  const total = selectedServices.reduce((sum, s) => sum + s.price, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#111118] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              Select Services
            </h3>
            <p className="text-xs text-[#666] mt-0.5">Tap to select · prices paid at salon</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-white/5 text-[#666] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Service list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {services.map(service => {
            const isSelected = selected.has(service.id);
            return (
              <button
                key={service.id}
                onClick={() => toggle(service.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#D4AF37]/8 border-[#D4AF37]/40'
                    : 'bg-[#1A1A2E] border-white/5 hover:border-white/15'
                }`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-[#444]'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-[#0D0D0D]" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isSelected ? 'text-[#F5F5F5]' : 'text-[#A0A0A0]'}`}>{service.name}</p>
                  <span className="text-[#666] text-xs flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {service.duration}
                  </span>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${isSelected ? 'text-[#D4AF37]' : 'text-[#555]'}`}>
                  ₹{service.price}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-white/5 px-5 py-4 space-y-3">
          {selectedServices.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#666]">{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected</span>
              <span className="text-[#D4AF37] font-semibold">₹{total} pay at salon</span>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-[#1A1A2E] border border-white/10 text-[#A0A0A0] hover:text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedServices)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-[#0D0D0D] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-colors"
            >
              <Coins className="w-4 h-4" />
              {selectedServices.length === 0 ? 'Walk-in' : 'Pay 3 coins & Join'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SalonViewPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [joiningQueue, setJoiningQueue] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Modals
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showCoinConfirm, setShowCoinConfirm] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false);

  // Selected services (resolved after picker)
  const [pendingServices, setPendingServices] = useState<Service[]>([]);

  const [friendName, setFriendName] = useState('');
  const [friendServices, setFriendServices] = useState<Service[]>([]);
  const [showFriendServicePicker, setShowFriendServicePicker] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendError, setFriendError] = useState('');
  const [queueData, setQueueData] = useState<{
    serving: { ticket: string; customerName: string } | null;
    waiting: { ticket: string; customerName: string; position: number; serviceName: string }[];
    totalWaiting: number;
  } | null>(null);

  const fetchMyTickets = useCallback(async (salonId: string) => {
    const token = getToken();
    if (!token) return;
    const { data } = await api.get<{ entries: any[] }>('/queue/mine');
    if (data) {
      const filtered = data.entries.filter((e: any) => e.salonId?._id === salonId || e.salonId === salonId);
      setMyTickets(filtered);
    }
  }, []);

  useEffect(() => { fetchSalon(); }, [slug]);

  const fetchSalon = async () => {
    setLoading(true);
    const { data } = await api.get<{ salon: SalonDetail }>(`/salons/${slug}`);
    if (data) {
      setSalon(data.salon);
      fetchQueue(data.salon._id);
      fetchMyTickets(data.salon._id);
    }
    setLoading(false);
  };

  const fetchQueue = async (salonId: string) => {
    const { data } = await api.get<{
      serving: { ticket: string; customerName: string } | null;
      waiting: { ticket: string; customerName: string; position: number; serviceName: string }[];
      totalWaiting: number;
    }>(`/queue/${salonId}`);
    if (data) setQueueData(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <Scissors className="w-16 h-16 text-[#333] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">{t('customer.salonNotFound')}</h2>
          <p className="text-[#A0A0A0] mb-6">{t('customer.salonNotFoundDesc')}</p>
          <Link href="/salon/customer" className="salon-btn-gold px-6 py-3 inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> {t('customer.backToBrowse')}
          </Link>
        </div>
      </div>
    );
  }

  const totalWaiting = queueData?.totalWaiting ?? 0;
  const currentServing = queueData?.serving ?? null;
  const hasServices = salon.services && salon.services.length > 0;

  const pendingTotal = pendingServices.reduce((s, sv) => s + sv.price, 0);
  const pendingServiceName = pendingServices.length > 0
    ? pendingServices.map(sv => sv.name).join(', ')
    : 'Walk-in';

  const handleCancelQueue = async (entryId: string) => {
    setCancelling(entryId);
    await api.delete(`/queue/${entryId}/cancel`);
    setCancelling(null);
    if (salon) fetchMyTickets(salon._id);
  };

  // Step 1: check auth + balance → then branch
  const initiateJoin = async () => {
    if (!salon) return;
    const token = getToken();
    if (!token) {
      router.push(`/salon/login?role=customer&redirect=${encodeURIComponent(`/salon/customer/${slug}`)}`);
      return;
    }
    const { data: balData } = await api.get<{ balance: number }>('/wallet/balance');
    const balance = balData?.balance ?? 0;
    setWalletBalance(balance);
    if (balance < 3) {
      setJoinError(t('customer.insufficientCoins'));
      return;
    }
    setJoinError('');
    if (hasServices) {
      setShowServicePicker(true);
    } else {
      setPendingServices([]);
      setShowCoinConfirm(true);
    }
  };

  // Step 2a: services confirmed → show coin modal
  const handleServicesConfirmed = (selected: Service[]) => {
    setPendingServices(selected);
    setShowServicePicker(false);
    setShowCoinConfirm(true);
  };

  // Step 2b / Step 3: pay coins → join queue
  const handleJoinQueue = async () => {
    if (!salon) return;
    setJoinError('');
    setShowCoinConfirm(false);
    setJoiningQueue(true);

    const profile = getCustomerProfile();

    const { data, error } = await api.post<{
      queueEntry: { ticket: string; position: number; id: string };
    }>('/queue/join', {
      salonId: salon._id,
      serviceName: pendingServiceName,
      price: pendingTotal,
      customerName: profile?.name || 'Guest',
    });

    setJoiningQueue(false);

    if (error) {
      if (error.includes('closed')) setJoinError(t('customer.salonClosed'));
      else if (error.includes('Maximum')) setJoinError(t('customer.maxEntries'));
      else setJoinError(error);
      return;
    }

    if (data) {
      setPendingServices([]);
      fetchQueue(salon._id);
      fetchMyTickets(salon._id);
    }
  };

  const handleFriendServicesConfirmed = (selected: Service[]) => {
    setFriendServices(selected);
    setShowFriendServicePicker(false);
    setShowFriendModal(true);
  };

  const handleAddFriend = async () => {
    if (!salon || !friendName.trim()) {
      setFriendError(t('customer.enterName'));
      return;
    }
    setFriendError('');
    setAddingFriend(true);

    const friendTotal = friendServices.reduce((s, sv) => s + sv.price, 0);
    const friendServiceName = friendServices.length > 0
      ? friendServices.map(sv => sv.name).join(', ')
      : 'Walk-in';

    const { data, error } = await api.post<{
      queueEntry: { ticket: string; position: number; id: string };
    }>('/queue/join', {
      salonId: salon._id,
      serviceName: friendServiceName,
      price: friendTotal,
      customerName: friendName.trim(),
    });

    setAddingFriend(false);

    if (error) {
      if (error.includes('coins') || error.includes('wallet')) setFriendError(t('customer.insufficientCoinsFriend'));
      else if (error.includes('Maximum')) setFriendError(t('customer.maxEntriesFriend'));
      else setFriendError(error);
      return;
    }

    if (data) {
      setFriendName('');
      setFriendServices([]);
      setShowFriendModal(false);
      fetchQueue(salon._id);
      fetchMyTickets(salon._id);
    }
  };

  return (
    <>
      {/* ── Service Picker Modal ── */}
      <AnimatePresence>
        {showServicePicker && salon && (
          <ServicePickerModal
            services={salon.services}
            onConfirm={handleServicesConfirmed}
            onCancel={() => setShowServicePicker(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Friend Service Picker Modal ── */}
      <AnimatePresence>
        {showFriendServicePicker && salon && (
          <ServicePickerModal
            services={salon.services}
            onConfirm={handleFriendServicesConfirmed}
            onCancel={() => { setShowFriendServicePicker(false); if (friendServices.length > 0) setShowFriendModal(true); }}
          />
        )}
      </AnimatePresence>

      {/* ── Coin Confirmation Modal ── */}
      <AnimatePresence>
        {showCoinConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111118] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#C9A227] rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Coins className="w-7 h-7 text-[#0D0D0D]" />
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-1">Confirm Booking</h3>

              {/* Selected services — compact list */}
              {pendingServices.length > 0 && (
                <div className="bg-[#1A1A2E] border border-white/5 rounded-xl px-4 py-3 mb-4 space-y-1">
                  {pendingServices.map(sv => (
                    <div key={sv.id} className="flex justify-between text-xs">
                      <span className="text-[#A0A0A0]">{sv.name}</span>
                      <span className="text-[#D4AF37]">₹{sv.price} at salon</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <span className="text-[#D4AF37] font-semibold text-sm flex items-center gap-1.5">
                  <Coins className="w-4 h-4" /> Queue booking fee
                </span>
                <span className="text-white font-bold">3 coins</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCoinConfirm(false); setJoinError(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#1A1A2E] border border-white/10 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleJoinQueue}
                  disabled={joiningQueue}
                  className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] text-[#0D0D0D] font-semibold text-sm transition-colors hover:bg-[#C9A227] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {joiningQueue ? (
                    <div className="w-4 h-4 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Coins className="w-4 h-4" /> Pay 3 coins &amp; Join</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Friend Modal ── */}
      <AnimatePresence>
        {showFriendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111118] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#C9A227] rounded-xl flex items-center justify-center mb-4 mx-auto">
                <UserPlus className="w-7 h-7 text-[#0D0D0D]" />
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-2">{t('queue.addFriend')}</h3>
              <p className="text-slate-400 text-sm text-center mb-4" dangerouslySetInnerHTML={{
                __html: t('customer.addFriendCost')
                  .replace('{slots}', `${3 - myTickets.length} slot${myTickets.length === 2 ? '' : 's'}`)
                  .replace(/<span>/g, '<span class="text-[#D4AF37] font-semibold">')
              }} />

              {/* Friend's selected services */}
              {friendServices.length > 0 && (
                <div className="bg-[#1A1A2E] border border-white/5 rounded-xl px-4 py-3 mb-3 space-y-1">
                  {friendServices.map(sv => (
                    <div key={sv.id} className="flex justify-between text-xs">
                      <span className="text-[#A0A0A0]">{sv.name}</span>
                      <span className="text-[#D4AF37]">₹{sv.price} at salon</span>
                    </div>
                  ))}
                  <button
                    onClick={() => { setShowFriendModal(false); setShowFriendServicePicker(true); }}
                    className="text-[#D4AF37] text-xs mt-1 hover:underline"
                  >
                    Change services
                  </button>
                </div>
              )}
              {friendServices.length === 0 && (
                <button
                  onClick={() => { setShowFriendModal(false); setShowFriendServicePicker(true); }}
                  className="w-full mb-3 px-4 py-2 bg-[#1A1A2E] border border-dashed border-white/10 rounded-xl text-[#A0A0A0] text-xs hover:text-white hover:border-[#D4AF37]/30 transition-colors"
                >
                  + Select services (optional)
                </button>
              )}

              <div className="mb-4">
                <label className="block text-xs text-slate-500 mb-1.5">{t('customer.friendsName')}</label>
                <input
                  type="text"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  placeholder={t('customer.enterFriendsName')}
                  className="w-full px-4 py-2.5 bg-[#1A1A2E] border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                />
                {friendError && <p className="text-xs text-red-400 mt-1.5">{friendError}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowFriendModal(false); setFriendName(''); setFriendServices([]); setFriendError(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#1A1A2E] border border-white/10 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddFriend}
                  disabled={addingFriend || !friendName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] text-[#0D0D0D] font-semibold text-sm transition-colors hover:bg-[#C9A227] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addingFriend ? (
                    <div className="w-4 h-4 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Coins className="w-4 h-4" /> {t('customer.payAndAdd')}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Page ── */}
      <div className="min-h-screen relative overflow-hidden bg-[#0D0D0D]">
        <div className="salon-noise-overlay"></div>
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF8C42]/5 rounded-full blur-[150px]"></div>
        </div>

        <nav className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/salon/customer" className="flex items-center gap-3 group">
                <div className="bg-gradient-to-br from-[#D4AF37] to-[#C9A227] p-2 rounded-xl">
                  <Scissors className="w-5 h-5 text-[#0D0D0D]" />
                </div>
                <span className="text-lg font-bold">
                  <span className="text-[#D4AF37]">DQMS</span>
                  <span className="text-[#F5F5F5] ml-1">{t('landing.dqmsSalons')}</span>
                </span>
              </Link>
              {myTickets.length === 0 && (
                <Link href="/salon/customer" className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.back')}</span>
                </Link>
              )}
            </div>
          </div>
        </nav>

        <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {myTickets.length === 0 ? (
              <motion.div
                key="salon-details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Salon card */}
                <div className="salon-glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 mb-8">
                  <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                    <div className="w-full md:w-32 h-32 bg-[#161616] rounded-2xl flex items-center justify-center border border-[#D4AF37]/20 flex-shrink-0 relative overflow-hidden">
                      {salon.image && <img src={salon.image} alt={salon.name} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                      <Scissors className="w-10 h-10 text-[#D4AF37] relative z-10" />
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                        <div>
                          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-2">{salon.name}</h1>
                          <div className="flex items-center gap-4 text-sm mb-2 flex-wrap">
                            <div className="flex items-center gap-1 bg-[#D4AF37]/10 px-2 py-1 rounded text-[#D4AF37]">
                              <Star className="w-4 h-4 fill-[#D4AF37]" />
                              <span className="font-bold">{salon.rating}</span>
                              <span className="text-[#A0A0A0]">({salon.reviews})</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#666] text-xs">
                              <Hash className="w-3 h-3" />
                              {salon.shopNumber}
                            </div>
                            {salon.salonType && (() => {
                              const typeMap: Record<string, { label: string; emoji: string; cls: string }> = {
                                male: { label: 'Barbershop', emoji: '✂️', cls: 'bg-blue-500/10 text-blue-300 border border-blue-500/20' },
                                female: { label: 'Beauty Parlour', emoji: '💅', cls: 'bg-pink-500/10 text-pink-300 border border-pink-500/20' },
                                unisex: { label: 'Unisex Salon', emoji: '✨', cls: 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20' },
                              };
                              const info = typeMap[salon.salonType];
                              return info ? (
                                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${info.cls}`}>
                                  {info.emoji} {info.label}
                                </span>
                              ) : null;
                            })()}
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full font-medium ${salon.isOpen ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              <span className={`w-2 h-2 rounded-full ${salon.isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span>
                              {salon.isOpen ? t('salon.open') : t('salon.closed')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[#A0A0A0] text-sm">
                            <MapPin className="w-4 h-4 text-[#D4AF37]" />
                            {salon.address}, {salon.city} - {salon.pincode}
                          </div>
                          <div className="flex items-center gap-2 text-[#A0A0A0] text-sm mt-1">
                            <Phone className="w-4 h-4 text-[#D4AF37]" />
                            {salon.phone}
                          </div>
                          {salon.lat && salon.lng && (
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${salon.lat},${salon.lng}&travelmode=driving`}
                              target="_blank" rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline">
                              <MapPin className="w-3.5 h-3.5" /> {t('salon.getDirections')}
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="text-[#A0A0A0] text-sm sm:text-base leading-relaxed max-w-2xl">{salon.description}</p>
                    </div>
                  </div>

                  {/* Stats + Join row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#161616] rounded-2xl border border-[#333]">
                    <div className="text-center border-r border-[#333]">
                      <p className="text-[#A0A0A0] text-xs uppercase mb-1">{t('salon.queueLoad')}</p>
                      <p className="text-xl font-bold text-[#F5F5F5]">{totalWaiting} {t('salon.people')}</p>
                    </div>
                    <div className="text-center md:border-r border-[#333]">
                      <p className="text-[#A0A0A0] text-xs uppercase mb-1">{t('queue.estimatedWait')}</p>
                      <p className="text-xl font-bold text-[#D4AF37]">~{totalWaiting * 15} mins</p>
                    </div>
                    <div className="text-center border-r border-[#333] pt-4 md:pt-0 border-t md:border-t-0">
                      <p className="text-[#A0A0A0] text-xs uppercase mb-1">{t('salon.status')}</p>
                      <p className="text-xl font-bold text-green-400">{t('salon.accepting')}</p>
                    </div>
                    <div className="text-center pt-4 md:pt-0 border-t md:border-t-0">
                      <p className="text-[#A0A0A0] text-xs uppercase mb-1">{t('salon.action')}</p>
                      <button
                        onClick={initiateJoin}
                        disabled={joiningQueue}
                        className="text-[#D4AF37] font-bold hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        {joiningQueue ? t('customer.joining') : t('queue.join')}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      {joinError && <p className="text-xs text-red-400 mt-1">{joinError}</p>}
                    </div>
                  </div>
                </div>

                {/* Services + Live Queue */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="md:col-span-2">
                    <h2 className="text-xl font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                      {t('salon.services')}
                    </h2>
                    {hasServices ? (
                      <div className="grid gap-3">
                        {salon.services.map((service) => (
                          <div key={service.id} className="bg-[#161616] border border-[#333] rounded-xl p-4 flex justify-between items-center group hover:border-[#D4AF37]/30 transition-colors">
                            <div>
                              <h4 className="text-[#F5F5F5] font-medium">{service.name}</h4>
                              <span className="text-xs text-[#A0A0A0] flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" /> {service.duration}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[#D4AF37] font-bold">₹{service.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#161616] border border-[#333] rounded-xl p-6 text-center">
                        <Scissors className="w-8 h-8 text-[#333] mx-auto mb-2" />
                        <p className="text-[#666] text-sm">No services listed yet</p>
                        <p className="text-[#555] text-xs mt-1">You can walk in directly</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-[#F5F5F5] mb-4">{t('salon.liveQueue')}</h2>
                    <div className="bg-[#161616] border border-[#333] rounded-xl p-4 flex flex-col gap-3">
                      {currentServing && (
                        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="text-[10px] text-[#D4AF37] uppercase font-bold mb-1">{t('queue.serving')}</p>
                            <p className="text-[#F5F5F5] font-medium">#{currentServing.ticket}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-[#0D0D0D] flex items-center justify-center border border-[#D4AF37]/30">
                            <Scissors className="w-4 h-4 text-[#D4AF37]" />
                          </div>
                        </div>
                      )}
                      {queueData?.waiting.slice(0, 3).map((q, idx) => (
                        <div key={idx} className="p-3 border-b border-[#222] last:border-0 flex justify-between items-center">
                          <span className="text-[#F5F5F5]">#{q.ticket}</span>
                          <span className="text-xs text-[#A0A0A0]">{t('queue.waitTime')}: ~{(idx + 1) * 15}{t('queue.minutes')}</span>
                        </div>
                      ))}
                      {totalWaiting > 3 && (
                        <div className="text-center pt-2 text-xs text-[#666]">
                          {`+${Math.max(0, totalWaiting - 3)} ${t('queue.moreWaiting')}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ── Booked view ── */
              <motion.div
                key="book-step-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl mx-auto py-6"
              >
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#C9A227] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#D4AF37]/30"
                  >
                    <CheckCircle className="w-8 h-8 text-[#0D0D0D]" />
                  </motion.div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] mb-1">{t('customer.youAreInQueue')}</h1>
                  <p className="text-[#A0A0A0] text-sm">{t('customer.headToSalon')}</p>
                </div>

                <div className="space-y-3 mb-6">
                  {myTickets.map((ticket: any) => {
                    const displayPos = ticket.currentPosition ?? ticket.position;
                    return (
                      <div key={ticket._id} className={`bg-[#161616] border rounded-xl p-4 flex items-center gap-4 ${ticket.skipNote ? 'border-yellow-500/30' : 'border-[#D4AF37]/20'}`}>
                        <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-[#D4AF37]">#{ticket.ticket}</span>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[#F5F5F5] font-medium text-sm truncate">{ticket.customerName}</p>
                          <p className="text-[#A0A0A0] text-xs truncate mt-0.5">{ticket.serviceName}</p>
                          <p className={`text-xs mt-0.5 ${displayPos <= 3 ? 'text-red-400 font-semibold' : 'text-[#D4AF37]'}`}>
                            {t('queue.position')} #{displayPos}
                          </p>
                          {ticket.price > 0 && (
                            <p className="text-xs text-[#D4AF37]/70 mt-0.5">Pay ₹{ticket.price} at salon</p>
                          )}
                          {ticket.skipNote && (
                            <p className="text-[10px] text-yellow-400 mt-1 leading-tight">{t('skip.note')}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleCancelQueue(ticket._id)}
                          disabled={cancelling === ticket._id}
                          className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                          {cancelling === ticket._id ? t('customer.removing') : t('queue.leave')}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {myTickets.length < 3 && (
                  <button
                    onClick={() => setShowFriendServicePicker(true)}
                    className="w-full mb-6 px-4 py-3 bg-[#161616] border border-dashed border-[#D4AF37]/30 rounded-xl text-[#D4AF37] text-sm font-medium hover:bg-[#1A1A2E] hover:border-[#D4AF37]/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {t('queue.addFriend')} ({3 - myTickets.length} slot{myTickets.length === 2 ? '' : 's'} left)
                  </button>
                )}

                <div className="bg-[#161616] p-4 rounded-xl text-left border border-[#333] mb-6">
                  <p className="text-sm font-medium text-[#F5F5F5] mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" /> {salon.name}
                  </p>
                  <p className="text-xs text-[#A0A0A0] ml-6">{salon.address}, {salon.city}</p>
                  {salon.lat && salon.lng && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${salon.lat},${salon.lng}&travelmode=driving`}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-2 ml-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline">
                      <MapPin className="w-3.5 h-3.5" /> {t('salon.getDirections')}
                    </a>
                  )}
                </div>

                <Link
                  href="/salon/customer/dashboard"
                  className="salon-btn-gold w-full px-6 py-3 inline-flex items-center gap-2 justify-center"
                >
                  {t('customer.viewDashboard')} <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
