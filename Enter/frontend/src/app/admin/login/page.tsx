'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, ArrowRight, Lock, UserCircle2, Eye, EyeOff } from 'lucide-react';
import { adminApi, saveAdminToken } from '@/lib/api';

export default function AdminLoginPage() {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId.trim() || !password.trim()) {
      setError('Please enter both Admin ID and Password.');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: apiError } = await adminApi.post<{ token: string }>(
      '/admin/login',
      { adminId, password }
    );

    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    if (data?.token) {
      saveAdminToken(data.token);
      window.location.href = '/admin/dashboard';
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#2563EB]/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#7C3AED]/6 rounded-full blur-[140px]" />
      </div>

      {/* Back button */}
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
        {/* Card */}
        <div className="bg-[#111111] border border-white/8 rounded-3xl p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Admin Portal</h1>
            <p className="text-slate-500 text-sm">DQMS System Administration</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Admin ID */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Admin ID</label>
              <div className="relative">
                <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 pointer-events-none" />
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => { setAdminId(e.target.value); setError(''); }}
                  placeholder="Enter admin ID"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/30 transition-all"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter password"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/30 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-xs mt-2">{error}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6">
            Restricted to authorized administrators only
          </p>
        </div>
      </motion.div>
    </div>
  );
}
