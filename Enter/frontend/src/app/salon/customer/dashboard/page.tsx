'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles,
  Scissors,
  Clock,
  Star,
  Calendar,
  User,
  ArrowRight,
  Edit3,
  TrendingUp,
  Crown,
  MapPin,
  CreditCard,
  AlertCircle,
  RefreshCw,
  LogOut,
  Menu,
  X,
  Store,
  Wallet,
  Bell,
} from 'lucide-react';
import { Customer, HaircutHistoryItem, HairstyleSuggestion } from '@/types';
import { getCustomerProfile, getHaircutHistory } from '@/lib/storage';
import { api, clearToken, clearUser, getToken } from '@/lib/api';
import { getSuggestionsForProfile, faceShapeLabels } from '@/data/hairstyle-suggestions';
import { useLanguage } from '@/lib/language-context';

export default function CustomerDashboardPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Customer | null>(null);
  const [history, setHistory] = useState<HaircutHistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<HairstyleSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [activeQueue, setActiveQueue] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [queueHistory, setQueueHistory] = useState<any[]>([]);
  const [positionAlert, setPositionAlert] = useState<{ ticket: string; position: number; salonName: string } | null>(null);
  const prevPositionRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback((durationMs: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + durationMs / 1000);
    } catch {}
  }, []);

  const fetchWalletBalance = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const { data } = await api.get<{ balance: number }>('/wallet/balance');
    if (data) setWalletBalance(data.balance);
  }, []);

  useEffect(() => {
    const p = getCustomerProfile();
    setProfile(p);
    setHistory(getHaircutHistory());
    if (p) {
      setSuggestions(getSuggestionsForProfile(p.faceShape, p.gender, p.age));
    }
    fetchActiveQueue();
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  const fetchActiveQueue = async () => {
    const token = getToken();
    if (!token) return;
    setQueueLoading(true);
    const { data } = await api.get<{ entries: any[] }>('/queue/mine');
    if (data) setActiveQueue(data.entries);
    setQueueLoading(false);
  };

  const fetchQueueHistory = async () => {
    const token = getToken();
    if (!token) return;
    const { data } = await api.get<{ entries: any[] }>('/queue/mine?history=true');
    if (data) {
      const done = data.entries.filter((e: any) => e.status === 'cancelled' || e.status === 'completed');
      setQueueHistory(done);
    }
  };

  useEffect(() => {
    fetchQueueHistory();
  }, []);

  const handleLeaveQueue = async (entryId: string) => {
    setCancellingId(entryId);
    await api.delete(`/queue/${entryId}/cancel`);
    setCancellingId('');
    fetchActiveQueue();
    fetchQueueHistory();
  };

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (activeQueue.length === 0) return;
    const entry = activeQueue[0];
    const currentPos = entry.currentPosition ?? entry.position;

    if (prevPositionRef.current === null) {
      prevPositionRef.current = currentPos;
      return;
    }

    if (currentPos <= 3 && currentPos < (prevPositionRef.current ?? Infinity)) {
      const isVisible = document.visibilityState === 'visible';

      if (isVisible) {
        setPositionAlert({
          ticket: entry.ticket,
          position: currentPos,
          salonName: entry.salonId?.name || t('customer.salon'),
        });
      } else {
        if (navigator.vibrate) {
          navigator.vibrate([500, 300, 500, 300, 500]);
        }
        playBeep(3000);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(t('notification.title'), {
            body: `${t('notification.body')} ${currentPos}. ${t('notification.reachSalon')}`,
            icon: '/favicon.ico',
          });
        }
        setPositionAlert({
          ticket: entry.ticket,
          position: currentPos,
          salonName: entry.salonId?.name || 'Salon',
        });
      }
    }

    prevPositionRef.current = currentPos;
  }, [activeQueue, playBeep]);

  useEffect(() => {
    if (profile) {
      const interval = setInterval(fetchActiveQueue, 10000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  if (!profile) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#0D0D0D] flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF8C42]/5 rounded-full blur-[150px]"></div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="salon-glass-card rounded-3xl p-8 max-w-md mx-4 text-center"
        >
          <AlertCircle className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">{t('customer.noProfile')}</h2>
          <p className="text-[#A0A0A0] mb-6">{t('customer.createProfilePrompt')}</p>
          <Link
            href="/salon/customer/profile"
            className="salon-btn-gold inline-flex items-center gap-2 px-6 py-3"
          >
            <Edit3 className="w-5 h-5" />
            {t('customer.createProfile')}
          </Link>
        </motion.div>
      </div>
    );
  }

  const completedEntries = queueHistory.filter((e: any) => e.status === 'completed');
  const totalCompleted = completedEntries.length;
  const thisMonthCompleted = completedEntries.filter((e: any) => {
    if (!e.completedAt) return false;
    const d = new Date(e.completedAt);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  }).length;

  const latestHistory = history.slice(0, 10);

  const stats = [
    {
      label: t('customer.totalVisits'),
      value: totalCompleted,
      icon: TrendingUp,
      color: 'text-[#D4AF37]',
    },
    {
      label: t('customer.thisMonth'),
      value: thisMonthCompleted,
      icon: Calendar,
      color: 'text-[#FF8C42]',
    },
    {
      label: t('customer.faceShape'),
                value: profile.faceShape ? faceShapeLabels[profile.faceShape] : t('customer.notSet'),
      icon: User,
      color: 'text-green-400',
    },
    {
      label: t('customer.gender'),
                value: profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : t('customer.notSet'),
      icon: Crown,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0D0D0D]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF8C42]/5 rounded-full blur-[150px]"></div>
      </div>

      <nav className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-[#161616] rounded-lg text-white lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
              <div className="bg-gradient-to-br from-[#D4AF37] to-[#C9A227] p-1.5 rounded-lg">
                <Scissors className="w-4 h-4 text-[#0D0D0D]" />
              </div>
              <span className="text-lg font-bold text-[#F5F5F5] truncate max-w-[160px] sm:max-w-xs">
                {profile?.name || t('customer.dashboard')}
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/salon/customer/profile" className="px-4 py-2 rounded-xl bg-[#161616] border border-[#D4AF37]/20 text-sm text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors">
                {t('nav.editProfile')}
              </Link>
              <Link href="/salon/customer" className="px-4 py-2 rounded-xl bg-[#161616] border border-[#D4AF37]/20 text-sm text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors">
                {t('nav.bookSalons')}
              </Link>
              <Link
                href="/salon/customer/wallet"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161616] border border-[#D4AF37]/20 text-sm text-[#A0A0A0] hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                {t('nav.wallet')}
                {walletBalance !== null && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">{walletBalance}</span>
                )}
              </Link>
              <button onClick={() => { clearToken(); clearUser(); window.location.href = '/'; }} className="p-2 rounded-xl bg-[#161616] border border-[#D4AF37]/20 text-[#A0A0A0] hover:text-red-400 hover:border-red-500/30 transition-colors" title={t('nav.logout')}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-[#161616] border-r border-white/5 z-50 flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#D4AF37] to-[#C9A227] p-2 rounded-xl">
                    <Scissors className="w-5 h-5 text-[#0D0D0D]" />
                  </div>
                  <span className="text-lg font-bold text-[#F5F5F5] truncate max-w-[160px]">
                    {profile?.name || t('customer.dashboard')}
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[#A0A0A0] hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                <span className="block px-4 py-2 text-xs text-[#666] font-medium uppercase tracking-wider">{t('nav.menu')}</span>
                <Link href="/salon/customer/dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#A0A0A0] hover:bg-white/5 hover:text-white transition-colors">
                  <Scissors className="w-5 h-5" />
                  <span className="font-medium">{t('nav.dashboard')}</span>
                </Link>
                <span className="block px-4 py-2 text-xs text-[#666] font-medium uppercase tracking-wider">{t('nav.wallet')}</span>
                <Link href="/salon/customer/wallet" onClick={() => setMobileMenuOpen(false)} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#A0A0A0] hover:bg-white/5 hover:text-[#D4AF37] transition-colors">
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium">{t('nav.wallet')}</span>
                  {walletBalance !== null && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] ml-auto">{walletBalance}</span>
                  )}
                </Link>
                <span className="block px-4 py-2 text-xs text-[#666] font-medium uppercase tracking-wider">{t('nav.book')}</span>
                <Link href="/salon/customer" onClick={() => setMobileMenuOpen(false)} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#A0A0A0] hover:bg-white/5 hover:text-white transition-colors">
                  <Store className="w-5 h-5" />
                  <span className="font-medium">{t('nav.bookSalons')}</span>
                </Link>
                <span className="block px-4 py-2 text-xs text-[#666] font-medium uppercase tracking-wider">{t('nav.account')}</span>
                <Link href="/salon/customer/profile" onClick={() => setMobileMenuOpen(false)} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#A0A0A0] hover:bg-white/5 hover:text-white transition-colors">
                  <User className="w-5 h-5" />
                  <span className="font-medium">{t('nav.profile')}</span>
                </Link>
                <button onClick={() => { clearToken(); clearUser(); window.location.href = '/'; }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#A0A0A0] hover:bg-white/5 hover:text-red-400 transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{t('nav.logout')}</span>
                </button>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-[#161616] border-2 border-[#D4AF37]/30 overflow-hidden flex items-center justify-center flex-shrink-0">
            {profile.profilePic ? (
              <img src={profile.profilePic} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-[#666]" />
            )}
          </div>
          <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5]">
              {t('customer.welcomeBack')}, {profile.name.split(' ')[0]}!
            </h1>
            <p className="text-[#A0A0A0] text-sm">
              {profile.faceShape
                ? t('customer.yourFaceShape').replace('{shape}', faceShapeLabels[profile.faceShape])
                : t('customer.completeProfilePrompt')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#161616] border border-[#333] rounded-2xl p-4"
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-[#F5F5F5]">{stat.value}</p>
              <p className="text-xs text-[#A0A0A0]">{stat.label}</p>
            </motion.div>
          ))}
        </div>

          {positionAlert && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#F5F5F5] font-semibold text-sm">{t('queue.yourTurn')}</p>
                <p className="text-[#A0A0A0] text-xs mt-0.5">
                  {t('queue.position')} {positionAlert.position}. {t('customer.reachSalon').replace('{name}', positionAlert.salonName)}
                </p>
              </div>
              <button
                onClick={() => setPositionAlert(null)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-[#A0A0A0] hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {activeQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-lg font-bold text-[#F5F5F5] mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              {t('customer.activeQueue')}
            </h2>
            <div className="space-y-3">
              {activeQueue.map((entry: any) => {
                const displayPos = entry.currentPosition ?? entry.position;
                return (
                <div key={entry._id} className={`bg-[#161616] border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between ${entry.skipNote ? 'border-yellow-500/30' : 'border-[#D4AF37]/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-[#D4AF37]">#{entry.ticket}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#F5F5F5] font-medium truncate">{entry.salonId?.name}</p>
                      <p className="text-[#A0A0A0] text-xs truncate">{entry.salonId?.address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs inline-block ${entry.status === 'serving' ? 'text-green-400' : displayPos <= 3 ? 'text-red-400 font-semibold' : 'text-[#D4AF37]'}`}>
                          {entry.status === 'serving' ? t('queue.serving') : `${t('queue.position')} #${displayPos}`}
                        </span>
                        <span className="text-[10px] text-[#666]">· {entry.customerName}</span>
                      </div>
                      {entry.skipNote && (
                        <p className="text-[10px] text-yellow-400 mt-1 leading-tight">{t('skip.note')}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleLeaveQueue(entry._id)}
                    disabled={cancellingId === entry._id}
                    className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {cancellingId === entry._id ? t('customer.leaving') : t('queue.leave')}
                  </button>
                </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {queueHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-lg font-bold text-[#F5F5F5] mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#666]" />
              {t('customer.queueHistory')}
              <span className="ml-auto text-xs text-[#666] font-normal">{queueHistory.length} visits</span>
            </h2>
            <div className="space-y-3">
              {queueHistory.map((entry: any) => {
                const isLeft = entry.status === 'cancelled';
                const salon = entry.salonId;
                const salonTypeInfo = {
                  male: { label: 'Barbershop', emoji: '✂️', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
                  female: { label: 'Beauty Parlour', emoji: '💅', color: 'bg-pink-500/10 text-pink-300 border-pink-500/20' },
                  unisex: { label: 'Unisex Salon', emoji: '✨', color: 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20' },
                }[salon?.salonType as string] || { label: 'Salon', emoji: '✂️', color: 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20' };
                return (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-[#161616] border rounded-2xl overflow-hidden transition-colors ${
                    isLeft ? 'border-[#2a2a2a] opacity-75' : 'border-[#2a2a2a] hover:border-[#D4AF37]/20'
                  }`}
                >
                  {/* Salon Profile Header */}
                  <div className="flex items-center gap-3 p-3 border-b border-white/5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#0D0D0D] flex-shrink-0 border border-white/5">
                      {salon?.image ? (
                        <img src={salon.image} alt={salon?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="w-6 h-6 text-[#444]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[#F5F5F5] text-sm font-semibold truncate">{salon?.name || t('customer.salon')}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${salonTypeInfo.color}`}>
                          {salonTypeInfo.emoji} {salonTypeInfo.label}
                        </span>
                      </div>
                      <p className="text-[#555] text-xs truncate mt-0.5">{salon?.city || ''}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                      isLeft ? 'text-[#666] bg-[#1A1A2E] border border-[#333]' : 'text-green-400 bg-green-500/10 border border-green-500/20'
                    }`}>
                      {isLeft ? t('customer.left') : t('customer.completed')}
                    </span>
                  </div>
                  {/* Ticket Info Row */}
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isLeft ? 'bg-[#2a2a2a]' : 'bg-green-500/10'
                    }`}>
                      <span className={`text-sm font-bold ${
                        isLeft ? 'text-[#555] line-through' : 'text-green-400'
                      }`}>#{entry.ticket}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#A0A0A0] text-xs">
                        {isLeft ? t('customer.leftQueue') : t('customer.serviceCompleted')}
                        {entry.customerName && entry.customerName !== 'Guest' && <span className="text-[#666]"> · {entry.customerName}</span>}
                      </p>
                      {entry.completedAt && !isLeft && (
                        <p className="text-[#555] text-[10px] mt-0.5">
                          {new Date(entry.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    {salon?.slug && (
                      <Link
                        href={`/salon/customer/${salon.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] px-2 py-1 rounded-lg bg-[#1A1A2E] border border-white/5 text-[#A0A0A0] hover:text-[#D4AF37] hover:border-[#D4AF37]/20 transition-colors flex-shrink-0"
                      >
                        Visit again
                      </Link>
                    )}
                  </div>
                </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {!profile.faceShape || !profile.gender ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="salon-glass-card rounded-2xl p-4 sm:p-6 mb-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3"
          >
            <div className="flex items-center gap-3 flex-1">
              <AlertCircle className="w-6 h-6 text-[#FF8C42] flex-shrink-0" />
              <div>
                <p className="text-[#F5F5F5] font-medium">{t('customer.profileIncomplete')}</p>
                <p className="text-[#A0A0A0] text-sm">
                  {t('customer.setFaceShapeGender')}
                </p>
              </div>
            </div>
            <Link
              href="/salon/customer/profile"
              className="px-4 py-2 bg-[#D4AF37] text-[#0D0D0D] text-sm font-semibold rounded-xl hover:bg-[#C9A227] transition-colors flex items-center gap-1 self-start sm:self-auto"
            >
              {t('customer.complete')} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#F5F5F5] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                {t('customer.aiSuggested')}
              </h2>
              <button
                onClick={() => setSuggestions(getSuggestionsForProfile(profile.faceShape, profile.gender, profile.age))}
                className="text-sm text-[#A0A0A0] hover:text-[#D4AF37] transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                {t('common.refresh')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() =>
                    setSelectedSuggestion(
                      selectedSuggestion === suggestion.id ? null : suggestion.id
                    )
                  }
                  className={`bg-[#161616] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                    selectedSuggestion === suggestion.id
                      ? 'border-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/10'
                      : 'border-[#333] hover:border-[#D4AF37]/30'
                  }`}
                >
                  <div className="h-40 bg-[#0D0D0D] relative overflow-hidden">
                    <img
                      src={suggestion.imageUrl}
                      alt={suggestion.name}
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-3 right-3 bg-[#D4AF37]/90 text-[#0D0D0D] text-[10px] font-bold px-2 py-1 rounded-full">
                      {t('customer.aiPick')}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-[#F5F5F5] font-bold mb-1">{suggestion.name}</h3>
                    <p className="text-[#A0A0A0] text-sm leading-relaxed line-clamp-2">
                      {suggestion.description}
                    </p>
                    {selectedSuggestion === suggestion.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-[#333]"
                      >
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {suggestion.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-[#0D0D0D] border border-[#333] rounded text-[10px] text-[#A0A0A0]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {suggestion.link && (
                            <a
                              href={suggestion.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center py-2 bg-[#D4AF37] text-[#0D0D0D] text-sm font-semibold rounded-xl hover:bg-[#C9A227] transition-colors"
                            >
                              {t('customer.viewStyle')}
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#F5F5F5] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              {t('customer.haircutHistory')}
            </h2>
            {history.length > 0 && (
              <span className="text-sm text-[#A0A0A0]">{history.length} {t('customer.total')}</span>
            )}
          </div>

          {history.length === 0 ? (
            <div className="salon-glass-card rounded-2xl p-8 text-center">
              <Scissors className="w-12 h-12 text-[#333] mx-auto mb-3" />
              <p className="text-[#A0A0A0]">{t('customer.noHistory')}</p>
              <p className="text-[#666] text-sm mb-4">
                {t('customer.completedBookings')}
              </p>
              <Link
                href="/salon/customer"
                className="inline-flex items-center gap-2 text-[#D4AF37] hover:underline text-sm font-medium"
              >
                {t('nav.bookSalons')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {latestHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#161616] border border-[#333] rounded-xl p-4 flex items-center justify-between hover:border-[#D4AF37]/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                      <Scissors className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-[#F5F5F5] font-medium">{item.serviceName}</p>
                      <p className="text-[#A0A0A0] text-xs flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {item.salonName}
                        {item.stylistName && (
                          <>
                            <span className="text-[#333]">|</span>
                            <Star className="w-3 h-3" />
                            {item.stylistName}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D4AF37] font-bold">₹{item.price}</p>
                    <p className="text-[#666] text-xs">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
