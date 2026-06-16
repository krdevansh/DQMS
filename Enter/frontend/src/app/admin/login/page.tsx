'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, ExternalLink } from 'lucide-react';

const ADMIN_GATEWAY_URL = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'http://localhost:3002';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#2563EB]/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#7C3AED]/6 rounded-full blur-[140px]" />
      </div>

      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors group text-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to DQMS
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-[#111111] border border-white/8 rounded-3xl p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Admin Portal</h1>
            <p className="text-slate-500 text-sm">DQMS System Administration</p>
          </div>

          <div className="space-y-4">
            <p className="text-slate-400 text-sm text-center leading-relaxed">
              Admin login has been moved to a secure gateway.
              <br />
              You will receive an OTP on your email to authenticate.
            </p>

            <a
              href={ADMIN_GATEWAY_URL}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
            >
              Go to Admin Gateway
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>

          <p className="text-center text-slate-600 text-xs mt-6">
            Restricted to authorized administrators only
          </p>
        </div>
      </motion.div>
    </div>
  );
}
