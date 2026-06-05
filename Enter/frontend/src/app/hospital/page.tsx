'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export default function HospitalLanding() {
  return (
    <div className="hospital-page">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-white">
        <div className="hospital-container py-16 md:py-24">
          <motion.div className="text-center max-w-3xl mx-auto" {...fadeUp} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-[#2563EB]/10 text-[#2563EB] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              Digital Queue Management
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-[#1E293B] leading-tight mb-5">
              Smart Hospital Queue &<br />
              <span className="text-[#2563EB]">Appointment Management</span>
            </h1>
            <p className="text-[#64748B] text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              Skip the waiting room. Book appointments, track live queue status, and
              manage your hospital visits — all from your phone.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto mt-8">
              <Link
                href="/hospital/discover"
                className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 hover:shadow-md hover:border-[#2563EB]/30 transition-all group aspect-square flex flex-col items-center justify-center text-center"
              >
                <div className="w-14 h-14 bg-[#2563EB]/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#1E293B] group-hover:text-[#2563EB] transition-colors">Find Hospitals</h3>
                <p className="text-xs text-[#64748B] mt-1">Search & discover hospitals near you</p>
              </Link>
              <Link
                href="/hospital/discover"
                className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 hover:shadow-md hover:border-[#3B82F6]/30 transition-all group aspect-square flex flex-col items-center justify-center text-center"
              >
                <div className="w-14 h-14 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#1E293B] group-hover:text-[#3B82F6] transition-colors">Book Appointment</h3>
                <p className="text-xs text-[#64748B] mt-1">Schedule a visit with a doctor</p>
              </Link>
            </div>
            <div className="mt-6 text-center">
              <Link href="/hospital/login" className="text-sm text-[#64748B] hover:text-[#2563EB] transition-colors">
                Hospital Admin? Sign in
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-gradient-to-t from-[#F8FAFC] to-transparent" />
      </section>

      {/* Footer */}
      <footer className="bg-[#1E293B] text-white mt-8">
        <div className="hospital-container py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0-.96 15.953a.527.527 0 0 0 .25.475m11.45-9.815l2.575-1.72m0 0l-2.38-4.69a.462.462 0 0 0-.668-.238l-1.287.86m3.335 4.068l-2.575 1.72m0 0l-1.422 4.134a.531.531 0 0 1-.282.323l-2.127.894" />
                </svg>
              </div>
              <span className="font-semibold text-sm">DQMS Healthcare</span>
            </div>
            <p className="text-[#94A3B8] text-sm">
              &copy; {new Date().getFullYear()} DQMS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
