'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Wallet, Coins, IndianRupee, Upload, CheckCircle,
  AlertCircle, ArrowLeft, Loader2, Clock, Copy,
  RefreshCw, LogOut, Scissors,
} from 'lucide-react';
import { api, clearToken, clearUser, getToken } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';

export default function CustomerWalletPage() {
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletHistory, setWalletHistory] = useState<any[]>([]);
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeUtr, setRechargeUtr] = useState('');
  const [rechargeFile, setRechargeFile] = useState<File | null>(null);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeError, setRechargeError] = useState('');
  const [rechargeSuccess, setRechargeSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const UPI_ID = 'kumar.d3@ptyes';
  const { t } = useLanguage();

  const fetchWallet = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const [balRes, histRes] = await Promise.all([
      api.get<{ balance: number }>('/wallet/balance'),
      api.get<{ transactions: any[] }>('/wallet/history'),
    ]);
    if (balRes.data) setWalletBalance(balRes.data.balance);
    if (histRes.data) setWalletHistory(histRes.data.transactions);
  }, []);

  useEffect(() => {
    if (!getToken()) {
      window.location.href = '/salon/login?role=customer';
      return;
    }
    fetchWallet();
  }, [fetchWallet]);

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setRechargeError('');
    setRechargeSuccess('');

    const amount = parseInt(rechargeAmount);
    if (!amount || amount < 10 || amount > 200) {
      setRechargeError(t('wallet.amountValidation'));
      return;
    }
    if (!rechargeUtr.trim()) {
      setRechargeError(t('wallet.utrRequired'));
      return;
    }
    if (!/^\d{12}$/.test(rechargeUtr.trim())) {
      setRechargeError(t('wallet.utrDigits'));
      return;
    }
    if (!rechargeFile) {
      setRechargeError(t('wallet.screenshotRequired'));
      return;
    }

    setRechargeLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(rechargeFile);
      });

      const { data: uploadRes, error: uploadErr } = await api.post<{ url: string }>('/upload', { image: base64 });
      if (uploadErr || !uploadRes) {
        setRechargeError(uploadErr || 'Upload failed');
        setRechargeLoading(false);
        return;
      }

      const { error } = await api.post('/wallet/recharge-request', {
        amount,
        utr: rechargeUtr.trim(),
        screenshot: uploadRes.url,
      });

      if (error) {
        setRechargeError(error);
      } else {
        setRechargeSuccess(t('wallet.rechargeSubmitted'));
        setRechargeAmount('');
        setRechargeUtr('');
        setRechargeFile(null);
        fetchWallet();
        setTimeout(() => setShowRecharge(false), 2000);
      }
    } catch (err) {
      setRechargeError(err instanceof Error ? err.message : 'Upload failed');
    }
    setRechargeLoading(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0D0D0D]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF8C42]/5 rounded-full blur-[150px]"></div>
      </div>

      <nav className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/salon/customer/dashboard" className="flex items-center gap-3 group">
              <div className="bg-gradient-to-br from-[#D4AF37] to-[#C9A227] p-1.5 rounded-lg">
                <Scissors className="w-4 h-4 text-[#0D0D0D]" />
              </div>
              <span className="text-lg font-bold text-[#F5F5F5]">{t('nav.wallet')}</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/salon/customer/dashboard" className="px-4 py-2 rounded-xl bg-[#161616] border border-[#D4AF37]/20 text-sm text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors">
                {t('nav.dashboard')}
              </Link>
              <button onClick={() => { clearToken(); clearUser(); window.location.href = '/'; }} className="p-2 rounded-xl bg-[#161616] border border-[#D4AF37]/20 text-[#A0A0A0] hover:text-red-400 transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/salon/customer/dashboard" className="p-2 rounded-xl bg-[#161616] border border-[#333] text-[#A0A0A0] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">{t('wallet.myWallet')}</h1>
          <button
            onClick={() => { fetchWallet(); }}
            className="p-2 rounded-xl bg-[#161616] border border-[#333] text-[#A0A0A0] hover:text-white transition-colors ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#1A1A2E] to-[#111118] border border-[#D4AF37]/20 rounded-2xl p-6 sm:p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#D4AF37]" />
              {t('wallet.balance')}
            </h2>
            <button
              onClick={() => { setShowRecharge(!showRecharge); setRechargeError(''); setRechargeSuccess(''); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                showRecharge
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                  : 'bg-[#D4AF37] text-[#0D0D0D] hover:bg-[#C9A227]'
              }`}
            >
              {showRecharge ? t('common.cancel') : t('wallet.addCoins')}
            </button>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#C9A227] flex items-center justify-center">
              <Coins className="w-8 h-8 text-[#0D0D0D]" />
            </div>
            <div>
              <p className="text-[#A0A0A0] text-sm">{t('wallet.availableBalance')}</p>
              <p className="text-4xl font-bold text-[#F5F5F5]">
                {walletBalance !== null ? walletBalance : <span className="text-[#666]">...</span>}
                <span className="text-lg text-[#D4AF37] ml-2">{t('wallet.coins')}</span>
              </p>
              <p className="text-[#666] text-xs mt-1">{t('wallet.coinRate')}</p>
            </div>
          </div>

          <AnimatePresence>
            {showRecharge && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-[#D4AF37]/10 pt-5 mt-5 space-y-4">
                  <div className="bg-[#0D0D0D] border border-[#333] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[#A0A0A0] text-xs">{t('wallet.payToUpi')}</p>
                      <p className="text-[#F5F5F5] font-mono font-semibold">{UPI_ID}</p>
                      <p className="text-[10px] text-[#D4AF37] mt-0.5">{t('wallet.onlyUpi')}</p>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(UPI_ID); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="p-2 rounded-lg bg-[#1A1A2E] border border-white/10 text-slate-400 hover:text-[#D4AF37] transition-colors"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <form onSubmit={handleRecharge} className="space-y-3">
                    <div>
                        <label className="block text-xs text-[#A0A0A0] mb-1">{t('wallet.amount')}</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                        <input
                          type="number"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          min="10"
                            max="200"
                          placeholder={t('wallet.enterAmount')}
                          className="w-full bg-[#0D0D0D] border border-[#333] rounded-xl pl-10 pr-4 py-3 text-[#F5F5F5] placeholder-[#666] text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#A0A0A0] mb-1">{t('wallet.utrNumber')}</label>
                      <input
                        type="text"
                        value={rechargeUtr}
                        onChange={(e) => setRechargeUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                        placeholder={t('wallet.enterUtr')}
                        maxLength={12}
                        className="w-full bg-[#0D0D0D] border border-[#333] rounded-xl px-4 py-3 text-[#F5F5F5] placeholder-[#666] text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#A0A0A0] mb-1">{t('wallet.paymentScreenshot')}</label>
                      <label className="flex items-center gap-3 w-full bg-[#0D0D0D] border border-[#333] border-dashed rounded-xl px-4 py-3 cursor-pointer hover:border-[#D4AF37]/50 transition-colors">
                        <Upload className="w-5 h-5 text-[#666]" />
                        <span className="text-sm text-[#666] flex-1 truncate">
                          {rechargeFile ? rechargeFile.name : t('wallet.uploadScreenshot')}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setRechargeFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {rechargeError && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {rechargeError}
                      </p>
                    )}
                    {rechargeSuccess && (
                      <p className="text-green-400 text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {rechargeSuccess}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={rechargeLoading}
                      className="w-full py-3 bg-[#D4AF37] text-[#0D0D0D] font-bold rounded-xl hover:bg-[#C9A227] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {rechargeLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {t('wallet.submitting')}</>
                      ) : (
                        t('wallet.submitRecharge')
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#D4AF37]" />
            {t('wallet.transactionHistory')}
            {walletHistory.length > 0 && (
              <span className="text-xs text-[#666] font-normal">({walletHistory.length})</span>
            )}
          </h2>

          <div className="bg-[#161616] border border-[#333] rounded-2xl overflow-hidden">
            {walletHistory.length === 0 ? (
              <div className="p-8 text-center">
                <Coins className="w-10 h-10 text-[#333] mx-auto mb-3" />
                <p className="text-[#A0A0A0] text-sm">{t('wallet.noTransactions')}</p>
                <p className="text-[#666] text-xs mt-1">{t('wallet.activityWillAppear')}</p>
              </div>
            ) : (
              <div className="divide-y divide-[#333]">
                {walletHistory.map((txn: any, i: number) => (
                  <div key={txn._id || i} className="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        txn.type === 'credit' || (txn.type === 'recharge' && txn.status === 'approved')
                          ? 'bg-green-500/10'
                          : txn.type === 'debit'
                          ? 'bg-red-500/10'
                          : 'bg-amber-500/10'
                      }`}>
                        {txn.type === 'credit' || (txn.type === 'recharge' && txn.status === 'approved') ? (
                          <IndianRupee className="w-4 h-4 text-green-400" />
                        ) : txn.type === 'debit' ? (
                          <IndianRupee className="w-4 h-4 text-red-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-[#F5F5F5] truncate">{txn.description || t('wallet.transaction')}</p>
                        <p className="text-[10px] text-[#666]">{formatDate(txn.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className={`text-sm font-bold ${
                        txn.type === 'credit' || (txn.type === 'recharge' && txn.status === 'approved')
                          ? 'text-green-400'
                          : txn.type === 'debit'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}>
                        {txn.type === 'debit' ? '-' : '+'}₹{txn.amount}
                      </p>
                      <span className={`text-[10px] ${
                        txn.status === 'approved' ? 'text-green-500' :
                        txn.status === 'rejected' ? 'text-red-500' :
                        'text-amber-500'
                      }`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <div className="mt-6 text-center">
          <Link
            href="/salon/customer/dashboard"
            className="inline-flex items-center gap-2 text-sm text-[#A0A0A0] hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t('wallet.backToDashboard')}
          </Link>
        </div>
      </main>
    </div>
  );
}
