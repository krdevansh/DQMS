'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, CheckCircle, XCircle, RefreshCw, LogOut, ArrowLeft, ExternalLink, Clock, Phone, IndianRupee, AlertCircle } from 'lucide-react';
import { adminApi, clearAdminToken, getAdminToken } from '@/lib/api';
import Link from 'next/link';

interface Subscription {
  _id: string;
  userId: { _id: string; name?: string; phone: string };
  amount: number;
  utr: string;
  screenshot: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export default function AdminHospitalSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await adminApi.get<{ subscriptions: Subscription[] }>('/admin/subscriptions/hospitals');
    if (data) setSubscriptions(data.subscriptions);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!getAdminToken()) { window.location.href = '/admin/login'; return; }
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    const { error } = await adminApi.post(`/admin/subscriptions/${action}/${id}`, {});
    if (error) showToast(`Error: ${error}`);
    else { showToast(`Subscription ${action}d`); fetchData(); }
    setActionLoading(null);
  };

  const formatDate = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const pending = subscriptions.filter(s => s.status === 'pending');
  const active = subscriptions.filter(s => s.status === 'active');

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <AnimatePresence>{toast && (
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="fixed top-4 right-4 z-[100] flex items-center gap-3 bg-[#1A1A2E] border border-white/10 text-white px-5 py-3 rounded-xl shadow-2xl">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /><span className="text-sm">{toast}</span>
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{selectedImage && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute -top-10 right-0 text-slate-400 hover:text-white text-sm">Close ✕</button>
            <img src={selectedImage} alt="screenshot" className="w-full rounded-2xl shadow-2xl" />
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      <nav className="sticky top-0 z-40 bg-[#080810]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="p-2 rounded-xl bg-[#111118] border border-white/8 text-slate-500 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-2 rounded-xl shadow-lg shadow-rose-500/20"><Building2 className="w-5 h-5 text-white" /></div>
            <div><span className="font-bold">Hospital Subscriptions</span><p className="text-[10px] text-slate-500">Manage hospital subscription requests</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { fetchData(); showToast('Refreshed'); }} className="p-2 rounded-xl bg-[#111118] border border-white/8 text-slate-500 hover:text-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => { clearAdminToken(); window.location.href = '/'; }} className="p-2 rounded-xl bg-[#111118] border border-white/8 text-slate-500 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-4"><p className="text-2xl font-bold text-white">{pending.length}</p><p className="text-xs text-slate-500">Pending</p></div>
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-4"><p className="text-2xl font-bold text-emerald-400">{active.length}</p><p className="text-xs text-slate-500">Active</p></div>
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-4"><p className="text-2xl font-bold text-white">{subscriptions.length}</p><p className="text-xs text-slate-500">Total</p></div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#111118] border border-white/5 rounded-2xl p-5 animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-[#1A1A2E] rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-32 bg-[#1A1A2E] rounded" />
                        <div className="h-4 w-16 bg-[#1A1A2E] rounded-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-3 w-20 bg-[#1A1A2E] rounded" />
                        <div className="h-3 w-28 bg-[#1A1A2E] rounded" />
                        <div className="h-3 w-24 bg-[#1A1A2E] rounded" />
                        <div className="h-3 w-32 bg-[#1A1A2E] rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col">
                    <div className="h-7 w-20 bg-[#1A1A2E] rounded-xl" />
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-16 bg-[#1A1A2E] rounded-xl" />
                      <div className="h-7 w-16 bg-[#1A1A2E] rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-12 text-center"><Building2 className="w-10 h-10 text-slate-700 mx-auto mb-3" /><p className="text-slate-500">No subscriptions yet</p></div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((s, i) => (
              <motion.div key={s._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-[#111118] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0"><Building2 className="w-5 h-5 text-rose-400" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-white text-sm">{s.userId?.name || 'Unknown'}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{s.status}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> ₹{s.amount}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.userId?.phone}</span>
                        <span className="flex items-center gap-1 truncate">UTR: {s.utr}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(s.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col">
                    {s.screenshot && (
                      <button onClick={() => setSelectedImage(s.screenshot)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1A1A2E] border border-white/10 text-xs text-slate-400 hover:text-white transition-colors"><ExternalLink className="w-3 h-3" /> Screenshot</button>
                    )}
                    {s.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAction(s._id, 'approve')} disabled={actionLoading === s._id} className="px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex items-center gap-1">
                          {actionLoading === s._id ? <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <><CheckCircle className="w-3 h-3" /> Approve</>}
                        </button>
                        <button onClick={() => handleAction(s._id, 'reject')} disabled={actionLoading === s._id} className="px-4 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
