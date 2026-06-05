'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Scissors,
  HeartPulse,
  GraduationCap,
  AlertCircle,
  ArrowRight,
  Zap,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

const services = [
  {
    id: 'salons',
    name: 'Salons',
    description: 'Manage queues and bookings for hair salons and beauty parlors.',
    icon: <Scissors className="w-10 h-10" />,
    color: 'emerald',
    active: true,
    path: '/salon'
  },
  {
    id: 'hospitals',
    name: 'Hospitals',
    description: 'Streamline patient flow and department waiting rooms.',
    icon: <HeartPulse className="w-10 h-10" />,
    color: 'rose',
    active: true,
    path: '/hospital'
  },
  {
    id: 'school',
    name: 'School Attendance',
    description: 'Digital attendance tracking and student management for schools.',
    icon: <GraduationCap className="w-10 h-10" />,
    color: 'amber',
    active: true,
    path: '/school'
  },
];

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500',
    hover: 'hover:shadow-emerald-500/20',
    gradient: 'from-emerald-500 to-teal-500'
  },
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500',
    hover: 'hover:shadow-rose-500/20',
    gradient: 'from-rose-500 to-pink-500'
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500',
    hover: 'hover:shadow-amber-500/20',
    gradient: 'from-amber-500 to-orange-500'
  },
};

export default function HomePage() {
  const [toastMessage, setToastMessage] = useState('');
  const { theme, toggleTheme } = useTheme();

  const showToast = (moduleName: string) => {
    setToastMessage(`The ${moduleName} module is coming soon to DQMS!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleServiceClick = (service: typeof services[0]) => {
    if (service.active && service.path) {
      window.location.href = service.path;
    } else {
      showToast(service.name);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F5F7FA] dark:bg-[#0a0a14]">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 sm:-top-40 -left-20 sm:-left-40 w-40 sm:w-80 h-40 sm:h-80 bg-[#2563EB]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-20 sm:-right-40 w-48 sm:w-96 h-48 sm:h-96 bg-[#06B6D4]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 sm:-bottom-40 left-1/4 sm:left-1/3 w-40 sm:w-80 h-40 sm:h-80 bg-[#2563EB]/5 rounded-full blur-3xl"></div>
      </div>

      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-4 right-4 sm:top-6 sm:left-auto sm:right-6 sm:w-auto z-50 flex items-center gap-3 bg-[#1E293B] dark:bg-[#111118] text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl"
        >
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span className="font-medium text-xs sm:text-sm">{toastMessage}</span>
        </motion.div>
      )}

      <div className="relative z-10">
        <nav className="dqms-nav sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-gradient-to-br from-[#2563EB] to-[#06B6D4] p-1.5 sm:p-2.5 rounded-xl sm:rounded-xl shadow-lg shadow-blue-500/30">
                  <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight">
                  <span className="text-[#1E293B] dark:text-white">DQ</span>
                  <span className="text-[#2563EB]">MS</span>
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-[#111118] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-all"
                  title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                  {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
                <Link
                  href="/admin/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#111118] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all text-xs sm:text-sm font-medium group"
                  title="Admin Portal"
                >
                  <ShieldCheck className="w-4 h-4 group-hover:text-[#2563EB] transition-colors" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <section className="relative pt-10 sm:pt-14 md:pt-20 pb-2 sm:pb-4 md:pb-6 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4 sm:mb-6 md:mb-8"
            >
              <div className="inline-flex items-center gap-1.5 sm:gap-2 dqms-badge px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-[#2563EB] to-[#06B6D4] p-1 sm:p-1.5 rounded-full flex-shrink-0">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">
                  ONE PLATFORM.&nbsp;EVERY QUEUE.
                </span>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-3 sm:mb-4 md:mb-6 tracking-tight px-2 sm:px-0">
                <span className="text-[#1E293B] dark:text-white">Digital </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#06B6D4]">
                  Queue Management
                </span>
                <br className="hidden sm:block" />
                <span className="text-[#1E293B] dark:text-white">System</span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-500 dark:text-slate-400 max-w-2xl md:max-w-3xl mx-auto mb-6 sm:mb-8 md:mb-10 px-2 sm:px-4">
                Devansh Queue Management System is the ultimate unified infrastructure for
                eliminating waiting rooms across all major service sectors.
              </p>

              <button
                onClick={() => {
                  const servicesEl = document.getElementById('services');
                  servicesEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="dqms-btn-primary flex items-center gap-2 mx-auto text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3"
              >
                Explore Services <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </motion.div>
          </div>
        </section>

        <section id="services" className="pt-2 sm:pt-4 md:pt-6 pb-10 sm:pb-14 md:pb-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#1E293B] dark:text-white mb-2 sm:mb-3 md:mb-4">
                Select Your Service Portal
              </h2>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-500 dark:text-slate-400">
                Choose a module to manage queues efficiently
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
              {services.map((service, index) => {
                const colors = colorClasses[service.color as keyof typeof colorClasses];
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    onClick={() => handleServiceClick(service)}
                    className={`dqms-card p-4 sm:p-5 md:p-6 lg:p-8 cursor-pointer group relative overflow-hidden active:scale-[0.98] sm:active:scale-100 ${service.active ? colors.hover : 'opacity-60 sm:opacity-70 grayscale'
                      }`}
                    style={{ borderBottomWidth: '4px', borderBottomColor: service.active ? undefined : '#e2e8f0' }}
                  >
                    {!service.active && (
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-slate-100 dark:bg-[#1A1A2E] text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                        Coming Soon
                      </div>
                    )}

                    <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-16 ${colors.bg} ${colors.text} rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 shadow-inner transition-all duration-300 group-hover:scale-110`}>
                      {service.icon}
                    </div>

                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#1E293B] dark:text-white mb-1.5 sm:mb-2 md:mb-3 tracking-tight group-hover:text-[#2563EB] transition-colors">
                      {service.name}
                    </h3>

                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm md:text-base font-medium leading-relaxed mb-3 sm:mb-4 md:mb-6">
                      {service.description}
                    </p>

                    {service.active && (
                      <div className="flex items-center text-[#2563EB] font-semibold text-sm sm:text-base group-hover:translate-x-2 transition-transform">
                        Open Portal <ArrowRight className="ml-1.5 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="dqms-footer py-10 sm:py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="bg-gradient-to-br from-[#2563EB] to-[#06B6D4] p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold">DQMS</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm font-semibold tracking-wide mb-2">
              DQMS — Digital Queue Management System
            </p>
            <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6 px-4 sm:px-0">
              Built by Kumar Devansh | B.Tech CSE, LPU University
            </p>
            <p className="text-[10px] sm:text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Kumar Devansh. All Rights Reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
