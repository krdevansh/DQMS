'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, CheckCircle, AlertCircle, Loader2,
  Upload, Copy, ArrowLeft, LogOut,
} from 'lucide-react';
import { getToken, getUser, clearToken, clearUser } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const UPI_ID = 'kumar.d3@ptyes';
const SUBSCRIPTION_AMOUNT = 2000;

export default function SchoolSubscriptionPage() {
  const router = useRouter();
  const [utr, setUtr] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user || user.role !== 'school_admin') {
      router.push('/');
      return;
    }
    fetchStatus();
  }, []);

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  });

  const fetchStatus = async () => {
    setPageLoading(true);
    const res = await fetch(`${API}/subscriptions/my-status`, { headers: headers() });
    const data = await res.json();
    if (data.subscription) setCurrentSub(data.subscription);
    setPageLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!utr.trim()) { setError('UTR number is required'); return; }
    if (!/^\d{12}$/.test(utr.trim())) { setError('UTR must be exactly 12 digits'); return; }
    if (!file) { setError('Payment screenshot is required'); return; }

    setLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const uploadRes = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ image: base64 }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) { setError(uploadData.error || 'Upload failed'); setLoading(false); return; }

      const subRes = await fetch(`${API}/subscriptions/request`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ utr: utr.trim(), screenshot: uploadData.url }),
      });
      const subData = await subRes.json();
      if (!subRes.ok) { setError(subData.error); setLoading(false); return; }

      setSuccess('Subscription request submitted! Admin will review it shortly.');
      setUtr('');
      setFile(null);
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <nav className="sticky top-0 z-40 bg-[#080810]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/school/admin/dashboard')} className="p-2 rounded-xl bg-[#111118] border border-white/8 text-slate-500 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <span className="font-bold">School Subscription</span>
          </div>
          <button onClick={() => { clearToken(); clearUser(); router.push('/'); }} className="p-2 rounded-xl bg-[#111118] border border-white/8 text-slate-500 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {pageLoading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111118] border border-white/5 rounded-2xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#1A1A2E] rounded-2xl mx-auto mb-4 animate-pulse" />
              <div className="h-7 w-56 bg-[#1A1A2E] rounded-lg mx-auto mb-2 animate-pulse" />
              <div className="h-4 w-24 bg-[#1A1A2E] rounded-lg mx-auto animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-16 bg-[#1A1A2E] rounded-xl animate-pulse" />
              <div className="h-12 bg-[#1A1A2E] rounded-xl animate-pulse" />
              <div className="h-12 bg-[#1A1A2E] rounded-xl animate-pulse" />
              <div className="h-12 bg-[#1A1A2E] rounded-xl animate-pulse" />
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111118] border border-white/5 rounded-2xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold">School Subscription</h1>
              <p className="text-slate-400 text-sm mt-1">₹{SUBSCRIPTION_AMOUNT}/month</p>
            </div>

            {currentSub?.status === 'active' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-400 font-semibold">Subscription Active</p>
                <p className="text-xs text-slate-400 mt-1">
                  Valid till {new Date(currentSub.endDate).toLocaleDateString('en-IN')}
                </p>
              </div>
            )}

            {currentSub?.status === 'pending' && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-center">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-amber-400 font-semibold">Request Pending</p>
                <p className="text-xs text-slate-400 mt-1">Admin is reviewing your payment</p>
              </div>
            )}

            {currentSub?.status === 'expired' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 font-semibold">Subscription Expired</p>
                <p className="text-xs text-slate-400 mt-1">Please renew your subscription</p>
              </div>
            )}

            {(!currentSub || currentSub.status === 'rejected' || currentSub.status === 'expired') && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">Pay to UPI ID</p>
                    <p className="text-white font-mono font-semibold">{UPI_ID}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Amount: ₹{SUBSCRIPTION_AMOUNT}</p>
                    <p className="text-[10px] text-amber-400 mt-0.5">Only payment through UPI</p>
                  </div>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(UPI_ID); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-2 rounded-lg bg-[#1A1A2E] border border-white/10 text-slate-400 hover:text-amber-400 transition-colors">
                    {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">UTR Number</label>
                  <input type="text" value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="Enter 12-digit UTR number" maxLength={12} className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Payment Screenshot</label>
                  <label className="flex items-center gap-3 w-full bg-[#0D0D0D] border border-white/10 border-dashed rounded-xl px-4 py-3 cursor-pointer hover:border-amber-500/50 transition-colors">
                    <Upload className="w-5 h-5 text-slate-500" />
                    <span className="text-sm text-slate-500 flex-1 truncate">{file ? file.name : 'Upload screenshot'}</span>
                    <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>

                {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
                {success && <p className="text-green-400 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {success}</p>}

                <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : `Pay ₹${SUBSCRIPTION_AMOUNT} & Subscribe`}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
