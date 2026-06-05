'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UserCircle,
  Wallet,
  Store,
  LogOut,
  Scissors,
  Menu,
  X,
  CreditCard
} from 'lucide-react';
import { getUser } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';

const sidebarItems = [
  { nameKey: 'nav.dashboard', key: 'dashboard', icon: LayoutDashboard },
  { nameKey: 'nav.editProfile', key: 'profile', icon: UserCircle },
  { nameKey: 'nav.myEarnings', key: 'earnings', icon: Wallet },
  { nameKey: 'nav.yourShop', key: 'shop', icon: Store },
  { nameKey: 'nav.subscription', key: 'subscription', icon: CreditCard },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sectionFromUrl, setSectionFromUrl] = useState('dashboard');
  const [shopName, setShopName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('section');
    if (s) setSectionFromUrl(s);

    const storedName = localStorage.getItem('dqms_shop_name');
    if (storedName) {
      setShopName(storedName);
    } else {
      const user = getUser();
      if (user?.salonName) setShopName(user.salonName as string);
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => setShopName((e as CustomEvent).detail);
    window.addEventListener('dqms-shop-name-update', handler);
    return () => window.removeEventListener('dqms-shop-name-update', handler);
  }, []);

  const setActiveSection = (key: string) => {
    setSectionFromUrl(key);
    router.replace(`${pathname}?section=${key}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F5F5F5] flex overflow-hidden font-sans">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[150px] animate-glow-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF8C42]/5 rounded-full blur-[150px] animate-glow-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <aside className="hidden lg:flex flex-col w-72 bg-[#161616]/80 backdrop-blur-2xl border-r border-white/5 z-20 h-screen relative flex-shrink-0">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#D4AF37] to-[#C9A227] p-2.5 rounded-xl shadow-lg">
              <Scissors className="w-6 h-6 text-[#0D0D0D]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                {shopName || 'DQMS'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => {
            const active = sectionFromUrl === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`w-full relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 text-left ${
                  active ? 'text-[#D4AF37] bg-white/5' : 'text-[#A0A0A0] hover:bg-white/5 hover:text-white group'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-8 bg-gradient-to-b from-[#D4AF37] to-[#C9A227] rounded-r-full shadow-[0_0_10px_#D4AF37]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                <item.icon className={`w-5 h-5 ${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="font-medium">{t(item.nameKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <button onClick={() => window.location.href = '/salon'} className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#A0A0A0] hover:bg-white/5 hover:text-red-400 transition-all duration-300 w-full group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen relative z-10 min-w-0">
        <header className="h-20 bg-[#161616]/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-white/5 rounded-lg text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div className="font-bold text-[#D4AF37]">{shopName || 'DQMS'}</div>
          </div>
          <div className="hidden lg:flex items-center gap-4" />
          <div className="flex items-center gap-2 sm:gap-4" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          {children}
        </main>
      </div>

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
                  <span className="text-lg font-bold text-[#D4AF37]">{shopName || 'DQMS'}</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-[#A0A0A0] hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                {sidebarItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => { setActiveSection(item.key); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl ${
                      sectionFromUrl === item.key ? 'text-[#D4AF37] bg-white/5' : 'text-[#A0A0A0] hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{t(item.nameKey)}</span>
                  </button>
                ))}
                <button onClick={() => window.location.href = '/salon'} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#A0A0A0] hover:bg-white/5 hover:text-red-400 transition-all duration-300 group">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{t('nav.logout')}</span>
                </button>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
