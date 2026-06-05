'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Scissors, MapPin, Star, User, Search,
  ArrowRight, Store, Crosshair,
  Loader2, LogOut, Menu, X, Wallet,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { calculateDistance, getDistanceText, getTravelTimeText } from '@/data/salons';
import { getCustomerProfile } from '@/lib/storage';
import { api, clearToken, clearUser } from '@/lib/api';
import { useInactivityLogout } from '@/lib/useInactivityLogout';
import { useLanguage } from '@/lib/language-context';

const DynamicMap = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
});

interface SalonSummary {
  _id: string;
  shopNumber: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  pincode: string;
  isOpen: boolean;
  salonType?: 'male' | 'female' | 'unisex';
  rating: number;
  reviews: number;
  lat: number;
  lng: number;
  services: { id: string; name: string; price: number; duration: string }[];
  image?: string;
  distance?: string;
  travelTime?: string;
}

export default function SalonDiscoveryPage() {
  const { t } = useLanguage();
  useInactivityLogout('/salon/login');

  const router = useRouter();
  const [salons, setSalons] = useState<SalonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showNearby, setShowNearby] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [mapHeight, setMapHeight] = useState(300); // mobile map height in px
  const dragRef = React.useRef<{ startY: number; startH: number } | null>(null);

  const [customerProfile, setCustomerProfile] = useState<ReturnType<typeof getCustomerProfile>>(null);
  useEffect(() => {
    setCustomerProfile(getCustomerProfile());
  }, []);

  useEffect(() => {
    fetchSalons();
    autoDetectLocation();
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    const { data } = await api.get<{ balance: number }>('/wallet/balance');
    if (data) setWalletBalance(data.balance);
  };

  const autoDetectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setShowNearby(true);
        },
        () => {}
      );
    }
  };

  const fetchSalons = async () => {
    setLoading(true);
    const { data, error } = await api.get<{ salons: SalonSummary[] }>('/salons');
    if (data) {
      setSalons(data.salons);
    }
    setLoading(false);
  };

  const salonsWithDistance = useMemo(() => {
    return salons.map((salon) => {
      if (userLocation && salon.lat && salon.lng) {
        const dist = calculateDistance(userLocation[0], userLocation[1], salon.lat, salon.lng);
        return { ...salon, distance: getDistanceText(dist), travelTime: getTravelTimeText(dist), _distance: dist };
      }
      return { ...salon, _distance: Infinity };
    });
  }, [salons, userLocation]);

  const filteredSalons = useMemo(() => {
    let result = salonsWithDistance;

    if (showNearby && userLocation) {
      result = result.filter((s) => s._distance <= 15);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.shopNumber.toLowerCase().includes(q) ||
          s.pincode.includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.services.some((sv) => sv.name.toLowerCase().includes(q)) ||
          s.address.toLowerCase().includes(q)
      );
    }

    if (userLocation) {
      result.sort((a, b) => a._distance - b._distance);
    }

    return result;
  }, [salonsWithDistance, searchQuery, showNearby, userLocation]);

  const handleSalonSelect = (slug: string) => {
    router.push(`/salon/customer/${slug}`);
  };

  // Drag handle handlers for mobile map resize
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startY: clientY, startH: mapHeight };
  };

  const handleDrag = React.useCallback((e: TouchEvent | MouseEvent) => {
    if (!dragRef.current) return;
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    const delta = dragRef.current.startY - clientY;
    const newH = Math.min(500, Math.max(160, dragRef.current.startH + delta));
    setMapHeight(newH);
  }, []);

  const handleDragEnd = React.useCallback(() => {
    dragRef.current = null;
  }, []);

  React.useEffect(() => {
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDrag, { passive: true });
    window.addEventListener('touchend', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [handleDrag, handleDragEnd]);

  return (
    <div className="min-h-screen relative flex flex-col bg-[#0D0D0D]">
      <nav className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-[#161616] rounded-lg text-white lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
              <div className="bg-gradient-to-br from-[#D4AF37] to-[#C9A227] p-1.5 sm:p-2 rounded-xl">
                <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-[#0D0D0D]" />
              </div>
              <span className="text-base sm:text-lg font-bold text-[#F5F5F5] truncate max-w-[160px] sm:max-w-xs">
                {customerProfile?.name || t('customer.customer')}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <Link href="/salon/customer/dashboard" className="px-3 py-1.5 rounded-xl bg-[#161616] border border-[#D4AF37]/20 text-[#A0A0A0] hover:text-[#F5F5F5] hover:border-[#D4AF37]/40 transition-colors flex items-center gap-1.5 text-sm">
                <Scissors className="w-4 h-4" />
                {t('nav.dashboard')}
              </Link>
              <Link href="/salon/customer/profile" className="px-3 py-1.5 rounded-xl bg-[#161616] border border-[#D4AF37]/20 text-[#A0A0A0] hover:text-[#F5F5F5] hover:border-[#D4AF37]/40 transition-colors flex items-center gap-1.5 text-sm">
                <User className="w-4 h-4" />
                {t('nav.profile')}
              </Link>
              <Link href="/salon/customer/wallet" className="px-3 py-1.5 rounded-xl bg-[#161616] border border-[#D4AF37]/20 text-[#A0A0A0] hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-colors flex items-center gap-1.5 text-sm">
                <Wallet className="w-4 h-4" />
                {t('nav.wallet')}
                {walletBalance !== null && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">{walletBalance}</span>
                )}
              </Link>
              <button onClick={() => { clearToken(); clearUser(); window.location.href = '/'; }} className="px-3 py-1.5 rounded-xl bg-[#161616] border border-[#D4AF37]/20 text-[#A0A0A0] hover:text-red-400 hover:border-red-500/30 transition-colors flex items-center gap-1.5 text-sm">
                <LogOut className="w-4 h-4" />
                {t('nav.logout')}
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
                    {customerProfile?.name || t('customer.customer')}
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[#A0A0A0] hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                <Link
                  href="/salon/customer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#A0A0A0] hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Scissors className="w-5 h-5" />
                  <span className="font-medium">{t('nav.dashboard')}</span>
                </Link>
                <span className="block px-4 py-2 text-xs text-[#666] font-medium uppercase tracking-wider">{t('nav.book')}</span>
                <Link
                  href="/salon/customer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#A0A0A0] hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Store className="w-5 h-5" />
                  <span className="font-medium">{t('nav.bookSalons')}</span>
                </Link>
                <span className="block px-4 py-2 text-xs text-[#666] font-medium uppercase tracking-wider">{t('nav.wallet')}</span>
                <Link
                  href="/salon/customer/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#A0A0A0] hover:bg-white/5 hover:text-[#D4AF37] transition-colors"
                >
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium">{t('nav.wallet')}</span>
                  {walletBalance !== null && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] ml-auto">{walletBalance}</span>
                  )}
                </Link>
                <span className="block px-4 py-2 text-xs text-[#666] font-medium uppercase tracking-wider">{t('nav.account')}</span>
                <Link
                  href="/salon/customer/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#A0A0A0] hover:bg-white/5 hover:text-white transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">{t('nav.profile')}</span>
                </Link>
                <button
                  onClick={() => { clearToken(); clearUser(); window.location.href = '/'; }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#A0A0A0] hover:bg-white/5 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{t('nav.logout')}</span>
                </button>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:py-6 flex flex-col">
        {/* Search & Filters */}
        <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-[#F5F5F5] mb-0.5">{t('customer.browse')}</h1>
              <p className="text-xs sm:text-sm text-[#A0A0A0]">
                {loading ? t('customer.loading') : t('customer.salonsRegistered').replace('{count}', String(salons.length))}
              </p>
            </div>
            {customerProfile && (
              <Link
                href="/salon/customer/dashboard"
                className="sm:hidden p-2 rounded-xl bg-[#161616] border border-[#D4AF37]/20 text-[#D4AF37]"
              >
                <Scissors className="w-5 h-5" />
              </Link>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <input
                type="text"
                placeholder={t('customer.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161616] border border-[#D4AF37]/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#D4AF37]/50"
              />
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {userLocation && (
                <button
                  onClick={() => setShowNearby(!showNearby)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border transition-colors text-xs sm:text-sm font-medium whitespace-nowrap ${
                    showNearby
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#D4AF37]'
                      : 'bg-[#161616] border-[#333] text-[#666] hover:text-[#A0A0A0]'
                  }`}
                >
                  <Crosshair className={`w-4 h-4 ${showNearby ? 'text-[#D4AF37]' : ''}`} />
                  {t('customer.yourLocation')}
                </button>
              )}
              <div className="flex items-center gap-3 px-3 py-1.5 bg-[#161616] rounded-xl border border-[#333] text-xs text-[#A0A0A0]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  {t('customer.salonShops')}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  {t('customer.yourLocationMap')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── DESKTOP: Side-by-side list + map ─── */}
        <div className="hidden md:flex flex-1 gap-4 overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
              </div>
            ) : filteredSalons.length === 0 ? (
              <div className="text-center py-16">
                <Store className="w-12 h-12 text-[#333] mx-auto mb-3" />
                <p className="text-[#A0A0A0] font-medium">{t('customer.noSalons')}</p>
                <p className="text-[#666] text-sm mt-1">
                  {showNearby && userLocation
                    ? t('customer.noSalonsNearby')
                    : t('customer.tryDifferent')}
                </p>
                {(showNearby || searchQuery) && (
                  <button
                    onClick={() => { setSearchQuery(''); setShowNearby(false); }}
                    className="mt-4 text-[#D4AF37] text-sm hover:underline"
                  >
                    {t('customer.clearFilters')}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredSalons.map((salon, index) => (
                  <motion.div
                    key={salon._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSalonSelect(salon.slug)}
                    className="salon-glass-card rounded-2xl p-4 cursor-pointer flex gap-3 group"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#161616]">
                      <img src={salon.image || ''} alt={salon.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className="text-sm font-bold text-[#F5F5F5] truncate group-hover:text-[#D4AF37] transition-colors">{salon.name} <span className="text-[#666] font-normal text-xs">({salon.shopNumber})</span></h3>
                        <div className="flex items-center gap-1 flex-shrink-0 bg-[#D4AF37]/10 px-1.5 py-0.5 rounded text-xs text-[#D4AF37] ml-1">
                          <Star className="w-3 h-3 fill-[#D4AF37]" />
                          {salon.rating}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#666] mb-1">
                        <MapPin className="w-3 h-3" />
                        <span>{salon.city}, {salon.pincode}</span>
                        {userLocation && salon.distance && (
                          <span className="text-[#D4AF37]/80 flex-shrink-0">· {salon.distance}</span>
                        )}
                        {salon.isOpen ? (
                          <span className="text-green-400 flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>{t('salon.open')}</span>
                        ) : (
                          <span className="text-red-400">{t('salon.closed')}</span>
                        )}
                        {salon.salonType && (() => {
                          const typeMap: Record<string, { label: string; cls: string }> = {
                            male: { label: '✂️ Barbershop', cls: 'text-blue-300' },
                            female: { label: '💅 Beauty Parlour', cls: 'text-pink-300' },
                            unisex: { label: '✨ Unisex', cls: 'text-[#D4AF37]' },
                          };
                          const info = typeMap[salon.salonType];
                          return info ? <span className={`flex-shrink-0 ${info.cls}`}>· {info.label}</span> : null;
                        })()}
                      </div>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {salon.services.slice(0, 2).map((s) => (
                          <span key={s.id} className="px-1.5 py-0.5 bg-[#161616] border border-[#333] rounded text-[10px] text-[#A0A0A0] whitespace-nowrap">{s.name}</span>
                        ))}
                        {salon.services.length > 2 && (
                          <span className="text-[10px] text-[#666]">+{salon.services.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <div className="w-[36%] relative rounded-2xl overflow-hidden min-h-0">
            <DynamicMap
              salons={filteredSalons}
              userLocation={userLocation}
              onMarkerClick={handleSalonSelect}
            />
          </div>
        </div>

        {/* ─── MOBILE: stacked list + collapsible/resizable map ─── */}
        <div className="flex md:hidden flex-col flex-1 gap-0 min-h-0">
          {/* Map panel (always visible on mobile, resizable) */}
          <div
            className="flex-shrink-0 relative rounded-2xl overflow-hidden"
            style={{ height: `${mapHeight}px` }}
          >
            <DynamicMap
              salons={filteredSalons}
              userLocation={userLocation}
              onMarkerClick={handleSalonSelect}
            />
            {/* Drag handle */}
            <div
              className="absolute bottom-0 left-0 right-0 h-6 flex items-center justify-center cursor-row-resize bg-gradient-to-t from-[#0D0D0D]/80 to-transparent z-10 touch-none"
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <div className="w-10 h-1 bg-[#D4AF37]/40 rounded-full" />
            </div>
          </div>

          {/* List panel below map */}
          <div className="flex-1 overflow-y-auto mt-3 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-7 h-7 text-[#D4AF37] animate-spin" />
              </div>
            ) : filteredSalons.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-10 h-10 text-[#333] mx-auto mb-3" />
                <p className="text-[#A0A0A0] font-medium text-sm">{t('customer.noSalons')}</p>
                {(showNearby || searchQuery) && (
                  <button
                    onClick={() => { setSearchQuery(''); setShowNearby(false); }}
                    className="mt-3 text-[#D4AF37] text-sm hover:underline"
                  >
                    {t('customer.clearFilters')}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {filteredSalons.map((salon, index) => (
                  <motion.div
                    key={salon._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleSalonSelect(salon.slug)}
                    className="salon-glass-card rounded-2xl p-3.5 cursor-pointer flex gap-3 group active:scale-[0.98] transition-transform"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#161616]">
                      <img src={salon.image || ''} alt={salon.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className="text-sm font-bold text-[#F5F5F5] truncate group-hover:text-[#D4AF37] transition-colors">{salon.name} <span className="text-[#666] font-normal text-[10px]">({salon.shopNumber})</span></h3>
                        <div className="flex items-center gap-0.5 flex-shrink-0 bg-[#D4AF37]/10 px-1.5 py-0.5 rounded text-[10px] text-[#D4AF37] ml-1">
                          <Star className="w-2.5 h-2.5 fill-[#D4AF37]" />{salon.rating}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#666] mb-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{salon.city}</span>
                        {userLocation && salon.distance && (
                          <span className="text-[#D4AF37]/80 flex-shrink-0">· {salon.distance}</span>
                        )}
                        {salon.isOpen ? (
                          <span className="text-green-400 flex-shrink-0">· {t('salon.open')}</span>
                        ) : (
                          <span className="text-red-400 flex-shrink-0">· {t('salon.closed')}</span>
                        )}
                        {salon.salonType && (() => {
                          const typeMap: Record<string, { label: string; cls: string }> = {
                            male: { label: '✂️ Barbershop', cls: 'text-blue-300' },
                            female: { label: '💅 Beauty', cls: 'text-pink-300' },
                            unisex: { label: '✨ Unisex', cls: 'text-[#D4AF37]' },
                          };
                          const info = typeMap[salon.salonType];
                          return info ? <span className={`flex-shrink-0 ${info.cls}`}>· {info.label}</span> : null;
                        })()}
                      </div>
                      <div className="flex items-center gap-1 overflow-hidden">
                        {salon.services.slice(0, 2).map((s) => (
                          <span key={s.id} className="px-1.5 py-0.5 bg-[#161616] border border-[#333] rounded text-[10px] text-[#A0A0A0] whitespace-nowrap">{s.name}</span>
                        ))}
                        {salon.services.length > 2 && (
                          <span className="text-[10px] text-[#666]">+{salon.services.length - 2}</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#333] flex-shrink-0 mt-1 group-hover:text-[#D4AF37] transition-colors" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
