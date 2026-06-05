'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Scissors,
  User,
  Building2,
  ArrowRight,
  Star,
  Sparkles,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export default function SalonPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen relative bg-[#0D0D0D]">
      <div className="salon-noise-overlay"></div>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[150px] animate-glow-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF8C42]/5 rounded-full blur-[150px] animate-glow-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/3 rounded-full blur-[200px] opacity-30"></div>
      </div>

      <div className="relative z-10">
        <section className="relative flex items-center justify-center pt-4 pb-0 px-6">
          <div className="absolute inset-0 salon-grid-pattern"></div>

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 mb-6 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm font-semibold text-[#D4AF37] tracking-wide uppercase">
                  {t('landing.luxuryExperience')}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-0 tracking-tight leading-tight px-2 sm:px-0">
                <span className="text-[#F5F5F5]">{t('landing.skipWait')} </span>
                <span className="text-transparent bg-clip-text animate-gradient-shift salon-gradient-gold whitespace-nowrap">
                  {t('landing.enterPremiumPart1')}
                </span>
                <span className="text-[#F5F5F5]"> {t('landing.enterPremiumPart2')}</span>
              </h1>
            </motion.div>
          </div>
        </section>

        <section className="pt-8 pb-20 px-6 relative">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                <span className="text-[#F5F5F5]">{t('landing.choosePortal')} </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-[#A0A0A0]">
                {t('landing.selectHow')}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <Link href="/salon/login?role=customer" className="block">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="salon-glass-card rounded-3xl p-10 group cursor-pointer"
                >
                  <div className="flex items-start sm:items-center mb-6 sm:mb-8 flex-col sm:flex-row">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl flex items-center justify-center mr-0 sm:mr-6 mb-4 sm:mb-0 group-hover:scale-110 transition-transform duration-300">
                      <User className="w-8 h-8 sm:w-10 sm:h-10 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] mb-1 sm:mb-2">{t('landing.customerPortal')}</h3>
                      <p className="text-[#A0A0A0]">{t('landing.forVisitors')}</p>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-6 sm:mb-8">
                    <li className="flex items-center gap-3 text-[#A0A0A0]">
                      <div className="w-6 h-6 bg-[#D4AF37]/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                      {t('landing.joinRemotely')}
                    </li>
                    <li className="flex items-center gap-3 text-[#A0A0A0]">
                      <div className="w-6 h-6 bg-[#D4AF37]/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                      {t('landing.liveStatus')}
                    </li>
                    <li className="flex items-center gap-3 text-[#A0A0A0]">
                      <div className="w-6 h-6 bg-[#D4AF37]/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                      {t('landing.estimatedWait')}
                    </li>
                  </ul>

                  <div className="salon-btn-gold w-full flex items-center justify-center gap-3 group">
                    {t('landing.enterPortal')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>

              <Link href="/salon/login?role=salon" className="block">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="salon-glass-card rounded-3xl p-10 group cursor-pointer"
                >
                  <div className="flex items-start sm:items-center mb-6 sm:mb-8 flex-col sm:flex-row">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#FF8C42]/20 to-[#FF8C42]/5 rounded-2xl flex items-center justify-center mr-0 sm:mr-6 mb-4 sm:mb-0 group-hover:scale-110 transition-transform duration-300">
                      <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#FF8C42]" />
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] mb-1 sm:mb-2">{t('landing.businessPortal')}</h3>
                      <p className="text-[#A0A0A0]">{t('landing.forOwners')}</p>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-6 sm:mb-8">
                    <li className="flex items-center gap-3 text-[#A0A0A0]">
                      <div className="w-6 h-6 bg-[#FF8C42]/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-[#FF8C42]" />
                      </div>
                      {t('landing.manageQueues')}
                    </li>
                    <li className="flex items-center gap-3 text-[#A0A0A0]">
                      <div className="w-6 h-6 bg-[#FF8C42]/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-[#FF8C42]" />
                      </div>
                      {t('landing.realtimeAnalytics')}
                    </li>
                    <li className="flex items-center gap-3 text-[#A0A0A0]">
                      <div className="w-6 h-6 bg-[#FF8C42]/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-[#FF8C42]" />
                      </div>
                      {t('landing.premiumExperience')}
                    </li>
                  </ul>

                  <div className="salon-btn-neon w-full flex items-center justify-center gap-3 group">
                    {t('landing.enterPortal')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-[#161616]/50">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-6">
                <span className="text-[#F5F5F5]">{t('landing.premiumFeatures')}</span>
              </h2>
              <p className="text-lg text-[#A0A0A0] mb-12 max-w-2xl mx-auto">
                {t('landing.seamlessManagement')}
              </p>

              <div className="grid md:grid-cols-4 gap-6">
                {[t('landing.smartBooking'), t('landing.liveUpdates'), t('landing.aiSuggestions'), t('landing.premiumUI')].map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="salon-glass-card rounded-2xl p-6 text-center w-full"
                  >
                    <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <h4 className="font-bold text-[#F5F5F5]">{feature}</h4>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <footer className="py-12 px-6 border-t border-[#D4AF37]/10 bg-[#0D0D0D]">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-[#D4AF37] to-[#C9A227] p-2 rounded-xl">
                <Scissors className="w-5 h-5 text-[#0D0D0D]" />
              </div>
              <span className="text-lg font-bold text-[#D4AF37]">{t('landing.dqmsSalons')}</span>
            </div>
            <p className="text-[#D4AF37]/80 text-sm font-semibold tracking-wide mb-2">
              {t('landing.dqmsDesc')}
            </p>
            <p className="text-[#A0A0A0] mb-4">
              {t('landing.luxuryMgmt')}
            </p>
            <p className="text-sm text-[#666]">
              {t('landing.copyright').replace('{year}', String(new Date().getFullYear()))}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}