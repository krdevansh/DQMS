'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, CheckCircle, XCircle, RefreshCw, LogOut,
  ArrowLeft, ExternalLink, AlertTriangle, Search,
  Clock, User as UserIcon, Phone, IndianRupee, Coins, Trash2,
} from 'lucide-react';
import { adminApi, clearAdminToken, getAdminToken } from '@/lib/api';

interface Recharge {
  _id: string;
  walletId: string;
  userId: { _id: string; name?: string; phone: string };
  amount: number;
  utr: string;
  screenshot: string;
  status: string;
  createdAt: string;
}

export default function AdminRechargesPage() {
  const [pending, setPending] = useState<Recharge[]>([]);
  const [all, setAll] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [approvalModal, setApprovalModal] = useState<Recharge | null>(null);
  const [approveAmount, setApproveAmount] = useState('');
  const [deleteScreenshotLoading, setDeleteScreenshotLoading] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchRecharges = useCallback(async () => {
    setLoading(true);
    const [pendingRes, allRes] = await Promise.all([
      adminApi.get<{ recharges: Recharge[] }>('/admin/recharges/pending'),
      adminApi.get<{ recharges: Recharge[] }>('/admin/recharges/all'),
    ]);
    if (pendingRes.data) setPending(pendingRes.data.recharges);
    if (allRes.data) setAll(allRes.data.recharges);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!getAdminToken()) {
      window.location.href = '/admin/login';
      return;
    }
    fetchRecharges();
  }, [fetchRecharges]);

  const handleAction = async (id: string, action: 'approve' | 'reject', customAmount?: number) => {
    setActionLoading(id);
    const body = action === 'approve' && customAmount ? { amount: customAmount } : {};
    const { error } = await adminApi.post(`/admin/recharges/${action}/${id}`, body);
    if (error) {
      showToast(`Error: ${error}`);
    } else {
      showToast(`Recharge ${action}d successfully`);
      fetchRecharges();
    }
    setActionLoading(null);
  };

  const handleDeleteScreenshot = async (recharge: Recharge) => {
    setDeleteScreenshotLoading(recharge._id);
    await adminApi.post('/upload/delete', { url: recharge.screenshot });
    await adminApi.post(`/admin/recharges/delete-screenshot/${recharge._id}`, {});
    showToast('Screenshot deleted');
    fetchRecharges();
    setDeleteScreenshotLoading(null);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const userInitials = (u: Recharge['userId']) => {
    const name = u.name || u.phone;
    return name.slice(0, 2).toUpperCase();
  };

  const displayList = activeTab === 'pending' ? pending : all;

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-4 right-4 z-[100] flex items-center gap-3 bg-[#1A1A2E] border border-white/10 text-white px-5 py-3 rounded-xl shadow-2xl"
          >
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-slate-400 hover:text-white transition-colors text-sm"
              >
                Close ✕
              </button>
              <img src={selectedImage} alt="Payment screenshot" className="w-full rounded-2xl shadow-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approval Amount Modal */}
      <AnimatePresence>
        {approvalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setApprovalModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-sm w-full bg-[#111118] border border-white/10 rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold">Approve Recharge</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Customer paid <span className="text-white font-semibold">₹{approvalModal.amount}</span>. Enter the amount to credit.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs text-slate-400 mb-1">Coins to Approve</label>
                <input
                  type="number"
                  value={approveAmount}
                  onChange={(e) => setApproveAmount(e.target.value)}
                  min={1}
                  max={approvalModal.amount}
                  className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">Max: ₹{approvalModal.amount} (what customer paid)</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setApprovalModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1A1A2E] border border-white/10 text-slate-400 text-sm font-semibold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const amount = parseInt(approveAmount);
                    if (amount > 0 && amount <= approvalModal.amount) {
                      handleAction(approvalModal._id, 'approve', amount);
                      setApprovalModal(null);
                    } else {
                      showToast(`Amount must be between ₹1 and ₹${approvalModal.amount}`);
                    }
                  }}
                  disabled={actionLoading === approvalModal._id}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === approvalModal._id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Approve ₹{approveAmount || '0'}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-[#080810]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="p-2 rounded-xl bg-[#111118] border border-white/8 text-slate-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold">
                  <span className="text-[#2563EB]">DQMS</span>
                  <span className="text-white ml-1">Recharges</span>
                </span>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Manage Wallet Recharges</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {loading && (
                <div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
              )}
              <button
                onClick={() => { fetchRecharges(); showToast('Refreshed'); }}
                className="p-2 rounded-xl bg-[#111118] border border-white/8 text-slate-500 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => { clearAdminToken(); window.location.href = '/'; }}
                className="p-2 rounded-xl bg-[#111118] border border-white/8 text-slate-500 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#111118] border border-white/5 p-1 rounded-2xl mb-6">
          {(['pending', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'pending' ? (
                <><Clock className="w-4 h-4" /> Pending ({pending.length})</>
              ) : (
                <><Wallet className="w-4 h-4" /> All ({all.length})</>
              )}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Pending', value: pending.length, icon: Clock, color: 'from-amber-500 to-orange-600' },
            { label: 'Approved', value: all.filter((r) => r.status === 'approved').length, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
            { label: 'Rejected', value: all.filter((r) => r.status === 'rejected').length, icon: XCircle, color: 'from-red-500 to-rose-600' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-[#111118] border border-white/5 rounded-2xl p-4">
                <div className={`w-9 h-9 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-12 text-center">
            <Wallet className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">
              {activeTab === 'pending' ? 'No pending recharge requests' : 'No recharge history'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map((recharge, i) => (
              <motion.div
                key={recharge._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-[#111118] border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-white/10 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-white text-sm">
                          {recharge.userId?.name || 'Unknown'}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          recharge.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                          recharge.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {recharge.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" /> ₹{recharge.amount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {recharge.userId?.phone || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <Search className="w-3 h-3" /> UTR: {recharge.utr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(recharge.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col">
                    {recharge.screenshot && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedImage(recharge.screenshot)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1A1A2E] border border-white/10 text-xs text-slate-400 hover:text-white hover:border-white/20 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Screenshot
                        </button>
                        {recharge.status !== 'pending' && (
                          <button
                            onClick={() => handleDeleteScreenshot(recharge)}
                            disabled={deleteScreenshotLoading === recharge._id}
                            className="p-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="Delete screenshot"
                          >
                            {deleteScreenshotLoading === recharge._id ? (
                              <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                    {recharge.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setApprovalModal(recharge); setApproveAmount(String(recharge.amount)); }}
                          disabled={actionLoading === recharge._id}
                          className="px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {actionLoading === recharge._id ? (
                            <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><CheckCircle className="w-3 h-3" /> Approve</>
                          )}
                        </button>
                        <button
                          onClick={() => handleAction(recharge._id, 'reject')}
                          disabled={actionLoading === recharge._id}
                          className="px-4 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
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
