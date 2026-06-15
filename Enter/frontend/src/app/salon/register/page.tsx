'use client';

import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Lock, User, Building2, ArrowRight, ArrowLeft,
  Phone, ShieldCheck, RefreshCw, CheckCircle2, Clock,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { api, saveToken, saveUser } from '@/lib/api';

type RegisterStep = 'details' | 'otp' | 'done';

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'salon' ? 'salon' : 'customer';

  const [step, setStep] = useState<RegisterStep>('details');
  const [role, setRole] = useState<'customer' | 'salon'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [displayOtp, setDisplayOtp] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '+91 ',
    salonName: '',
    email: '',
    otp: '',
    pin: '',
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+91 ')) {
      val = '+91 ';
    }
    const digits = val.slice(4).replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: '+91 ' + digits });
    setErrorMsg('');
  };

  const startCountdown = () => {
    setCountdown(600);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const fmtCountdown = () =>
    `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length !== 14) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }
    if (formData.pin.length !== 5) {
      setErrorMsg('Please enter a 5-digit PIN.');
      return;
    }
    if (role === 'salon' && !formData.salonName) {
      setErrorMsg('Please enter your salon name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const { data, error } = await api.post<{ message: string; expiresIn: number; otp?: string }>(
      '/auth/send-register-otp',
      { phone: formData.phone, role }
    );

    setLoading(false);

    if (error) {
      setErrorMsg(error);
      return;
    }

    if (data?.otp) {
      setDisplayOtp(data.otp);
    } else {
      setDisplayOtp('');
    }
    startCountdown();
    setStep('otp');
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await api.post<{ message: string }>('/auth/send-register-otp', {
      phone: formData.phone,
      role,
    });
    setLoading(false);
    if (error) { setErrorMsg(error); return; }
    startCountdown();
    setFormData((f) => ({ ...f, otp: '' }));
  };

  const handleVerifyAndRegister = async () => {
    if (formData.otp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const { error: verifyErr } = await api.post('/auth/verify-register-otp', {
      phone: formData.phone,
      otp: formData.otp,
    });

    if (verifyErr) {
      setErrorMsg(verifyErr);
      setLoading(false);
      return;
    }

    const { data, error: regErr } = await api.post<{
      token: string;
      user: Record<string, unknown>;
    }>('/auth/register', {
      name: role === 'customer' ? formData.name : undefined,
      salonName: role === 'salon' ? formData.salonName : undefined,
      email: role === 'salon' ? formData.email : undefined,
      phone: formData.phone,
      pin: formData.pin,
      role,
    });

    setLoading(false);

    if (regErr) {
      setErrorMsg(regErr);
      return;
    }

    if (data) {
      saveToken(data.token);
      saveUser(data.user);
      setStep('done');
      setTimeout(() => {
        window.location.href = role === 'salon' ? '/salon/dashboard' : '/salon/customer';
      }, 1800);
    }
  };

  const stepIndex = { details: 0, otp: 1, done: 2 };

  return (
    <>
      <div className="text-center mb-8">
        <div
          className={`w-16 h-16 ${
            role === 'salon'
              ? 'bg-gradient-to-br from-[#FF8C42] to-[#FF6B1A] shadow-[#FF8C42]/20'
              : 'bg-gradient-to-br from-[#D4AF37] to-[#C9A227] shadow-[#D4AF37]/20'
          } rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
        >
          {role === 'salon' ? (
            <Building2 className="w-8 h-8 text-white" />
          ) : (
            <User className="w-8 h-8 text-[#0D0D0D]" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-[#F5F5F5] mb-2">
          {role === 'salon' ? 'Join as Salon Owner' : 'Create Customer Account'}
        </h2>
        <p className="text-[#A0A0A0]">
          {role === 'salon'
            ? 'Experience the future of salon management'
            : 'Book premium salon experiences easily'}
        </p>
      </div>

      {step !== 'done' && (
        <div className="flex gap-2 mb-7">
          {(['details', 'otp'] as RegisterStep[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                stepIndex[step] >= i ? (role === 'salon' ? 'bg-[#FF8C42]' : 'bg-[#D4AF37]') : 'bg-[#333]'
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">

        {step === 'details' && (
          <motion.form
            key="details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSendOtp}
            className="space-y-4"
          >
            {role === 'customer' ? (
              <div>
                <label className="salon-label">Full Name</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 z-10 flex items-center justify-center pointer-events-none">
                    <User className="w-5 h-5 text-[#A0A0A0]" />
                  </div>
                  <input
                    type="text"
                    className="salon-input pl-12 w-full"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={role === 'customer'}
                    placeholder="Your full name"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="salon-label">Salon Name</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 z-10 flex items-center justify-center pointer-events-none">
                      <Building2 className="w-5 h-5 text-[#A0A0A0]" />
                    </div>
                    <input
                      type="text"
                      className="salon-input pl-12 w-full"
                      value={formData.salonName}
                      onChange={(e) => setFormData({ ...formData, salonName: e.target.value })}
                      required={role === 'salon'}
                      placeholder="Your salon name"
                    />
                  </div>
                </div>
                <div>
                  <label className="salon-label">Email Address</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 z-10 flex items-center justify-center pointer-events-none">
                      <User className="w-5 h-5 text-[#A0A0A0]" />
                    </div>
                    <input
                      type="email"
                      className="salon-input pl-12 w-full"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required={role === 'salon'}
                      placeholder="salon@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="salon-label">Phone Number</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10 flex items-center justify-center pointer-events-none">
                  <Phone className="w-5 h-5 text-[#A0A0A0]" />
                </div>
                <input
                  type="tel"
                  className={`salon-input pl-12 w-full ${errorMsg ? 'border-red-500/50' : ''}`}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="salon-label">Create 5-Digit PIN</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10 flex items-center justify-center pointer-events-none">
                  <Lock className="w-5 h-5 text-[#A0A0A0]" />
                </div>
                <input
                  type="password"
                  maxLength={5}
                  pattern="\d{5}"
                  inputMode="numeric"
                  className="salon-input pl-12 w-full tracking-widest"
                  value={formData.pin}
                  onChange={(e) =>
                    setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 5) })
                  }
                  required
                  placeholder="•••••"
                />
              </div>
            </div>

            {errorMsg && <p className="text-red-400 text-xs mt-2">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 mt-4 ${
                role === 'salon' ? 'salon-btn-neon' : 'salon-btn-gold'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending OTP&hellip;
                </span>
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.form>
        )}

        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {displayOtp && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-sm text-yellow-700 mb-1">📱 OTP (displayed for testing)</p>
                <p className="text-3xl font-bold text-[#D4AF37] tracking-widest font-mono">{displayOtp}</p>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="salon-label mb-0">6-Digit OTP</label>
                {countdown > 0 && (
                  <span className="text-xs text-[#666] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {fmtCountdown()}
                  </span>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={`salon-input w-full text-center text-2xl tracking-[0.5em] font-mono ${
                  errorMsg ? 'border-red-500/50' : ''
                }`}
                value={formData.otp}
                onChange={(e) => {
                  setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) });
                  setErrorMsg('');
                }}
                placeholder="——————"
              />
            </div>

            {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}

            <button
              onClick={handleVerifyAndRegister}
              disabled={formData.otp.length !== 6 || loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 ${
                role === 'salon' ? 'salon-btn-neon' : 'salon-btn-gold'
              }`}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Verify & Create Account
                </>
              )}
            </button>

            <div className="flex items-center justify-between">
              <button
                onClick={() => { setStep('details'); setErrorMsg(''); setFormData((f) => ({ ...f, otp: '' })); }}
                className="text-sm text-[#666] hover:text-[#A0A0A0] flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change details
              </button>
              <button
                onClick={handleResendOtp}
                disabled={loading || countdown > 540}
                className="text-sm text-[#666] hover:text-[#A0A0A0] flex items-center gap-1 disabled:opacity-40 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
              </button>
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-4"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-1">Account Created!</h3>
              <p className="text-[#A0A0A0] text-sm">
                Welcome to DQMS Salon. Redirecting you to your dashboard&hellip;
              </p>
            </div>
            <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mt-2" />
          </motion.div>
        )}

      </AnimatePresence>

      {step === 'details' && (
        <p className="text-center text-[#A0A0A0] mt-8 text-sm">
          Already have an account?{' '}
          <Link href="/salon/login" className="text-[#F5F5F5] font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      )}
    </>
  );
}

export default function SalonRegister() {
  return (
    <div className="min-h-screen relative flex items-start md:items-center justify-center p-4 py-24 bg-[#0D0D0D]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px] animate-glow-pulse" />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#FF8C42]/5 rounded-full blur-[150px] animate-glow-pulse"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      <div className="absolute top-6 left-6 z-50">
        <Link
          href="/salon"
          className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#D4AF37] transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Salon</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="salon-glass-card w-full max-w-xl rounded-3xl p-6 sm:p-8 relative z-10 my-auto overflow-hidden"
      >
        <Suspense
          fallback={
            <div className="flex justify-center p-10">
              <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
