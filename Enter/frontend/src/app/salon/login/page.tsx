'use client';

import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Phone, ArrowRight, ArrowLeft, ShieldCheck,
  User, Building2, Clock, RefreshCw, CheckCircle2, Eye, EyeOff,
} from 'lucide-react';
import { api, saveToken, saveUser } from '@/lib/api';

// ─── Forgot PIN inline flow ───────────────────────────────────────────────────
type ForgotStep = 'phone' | 'otp' | 'newpin' | 'done';

function ForgotPinFlow({ onCancel }: { onCancel: () => void }) {
  const [step, setStep] = useState<ForgotStep>('phone');
  const [phone, setPhone] = useState('+91 ');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [displayOtp, setDisplayOtp] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+91 ')) val = '+91 ';
    const digits = val.slice(4).replace(/\D/g, '').slice(0, 10);
    setPhone('+91 ' + digits);
    setError('');
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

  const handleSendOtp = async () => {
    if (phone.length !== 14) { setError('Enter a valid 10-digit phone number.'); return; }
    setLoading(true); setError('');
    const { data, error: apiErr } = await api.post<{ message: string; expiresIn: number; otp?: string }>(
      '/auth/forgot-pin', { phone }
    );
    setLoading(false);
    if (apiErr) { setError(apiErr); return; }
    if (data) {
      if (data.otp) setDisplayOtp(data.otp);
      startCountdown();
      setStep('otp');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    setLoading(true); setError('');
    const { error: apiErr } = await api.post('/auth/verify-otp', { phone, otp });
    setLoading(false);
    if (apiErr) { setError(apiErr); return; }
    setStep('newpin');
  };

  const handleResetPin = async () => {
    if (newPin.length !== 5 || !/^\d{5}$/.test(newPin)) {
      setError('PIN must be exactly 5 digits.'); return;
    }
    if (newPin !== confirmPin) { setError('PINs do not match.'); return; }
    setLoading(true); setError('');
    const { data, error: apiErr } = await api.post('/auth/reset-pin', { phone, otp, newPin });
    setLoading(false);
    if (apiErr) { setError(apiErr); return; }
    setStep('done');
  };

  const fmtCountdown = () => `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`;

  return (
    <motion.div
      key="forgot"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onCancel}
          className="p-2 rounded-xl bg-[#161616] border border-[#333] text-[#666] hover:text-[#F5F5F5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="text-xl font-bold text-[#F5F5F5]">Reset PIN</h3>
          <p className="text-xs text-[#A0A0A0]">
            {step === 'phone' && 'Enter your registered phone number'}
            {step === 'otp' && 'Enter the OTP sent to your phone'}
            {step === 'newpin' && 'Create a new 5-digit PIN'}
            {step === 'done' && 'PIN reset successful!'}
          </p>
        </div>
      </div>

      {step !== 'done' && (
        <div className="flex gap-2 mb-6">
          {(['phone', 'otp', 'newpin'] as ForgotStep[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                ['phone', 'otp', 'newpin'].indexOf(step) >= i
                  ? 'bg-[#D4AF37]'
                  : 'bg-[#333]'
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'phone' && (
          <motion.div key="fp-phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <label className="salon-label">Registered Phone Number</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10 pointer-events-none">
                  <Phone className="w-5 h-5 text-[#A0A0A0]" />
                </div>
                <input
                  type="tel"
                  className={`salon-input pl-12 w-full ${error ? 'border-red-500/50' : ''}`}
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="salon-btn-gold w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" />
                  Sending OTP&hellip;
                </span>
              ) : (
                <>Send OTP <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div key="fp-otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
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
                className={`salon-input w-full text-center text-2xl tracking-[0.5em] font-mono ${error ? 'border-red-500/50' : ''}`}
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                placeholder="——————"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || loading}
              className="salon-btn-gold w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" /> : <>Verify OTP <ArrowRight className="w-4 h-4" /></>}
            </button>
            <button
              onClick={() => { setOtp(''); handleSendOtp(); }}
              disabled={loading || countdown > 540}
              className="w-full text-sm text-[#666] hover:text-[#A0A0A0] flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
            </button>
          </motion.div>
        )}

        {step === 'newpin' && (
          <motion.div key="fp-newpin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <label className="salon-label">New 5-Digit PIN</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10 pointer-events-none">
                  <ShieldCheck className="w-5 h-5 text-[#A0A0A0]" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={5}
                  pattern="\d{5}"
                  inputMode="numeric"
                  className={`salon-input pl-12 pr-12 w-full tracking-widest ${error ? 'border-red-500/50' : ''}`}
                  value={newPin}
                  onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, '').slice(0, 5)); setError(''); }}
                  placeholder="•••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 text-[#666] hover:text-[#A0A0A0]"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="salon-label">Confirm PIN</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10 pointer-events-none">
                  <ShieldCheck className="w-5 h-5 text-[#A0A0A0]" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={5}
                  pattern="\d{5}"
                  inputMode="numeric"
                  className={`salon-input pl-12 w-full tracking-widest ${error ? 'border-red-500/50' : ''}`}
                  value={confirmPin}
                  onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 5)); setError(''); }}
                  placeholder="•••••"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={handleResetPin}
              disabled={loading}
              className="salon-btn-gold w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? <div className="w-5 h-5 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" /> : <>Reset PIN <ShieldCheck className="w-4 h-4" /></>}
            </button>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="fp-done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 0 }} className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-1">PIN Reset!</h3>
              <p className="text-[#A0A0A0] text-sm">You can now sign in with your new PIN.</p>
            </div>
            <button onClick={onCancel} className="salon-btn-gold w-full py-3">
              Back to Sign In
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Login Form ──────────────────────────────────────────────────────────
function LoginForm() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const initialRole = roleParam === 'salon' ? 'salon' : 'customer';
  const isRoleLocked = roleParam === 'salon' || roleParam === 'customer';
  const isInactivityLogout = searchParams.get('reason') === 'inactivity';
  const redirectTo = searchParams.get('redirect');

  const [role, setRole] = useState<'customer' | 'salon'>(initialRole);
  const [phone, setPhone] = useState('+91 ');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+91 ')) val = '+91 ';
    const digits = val.slice(4).replace(/\D/g, '').slice(0, 10);
    setPhone('+91 ' + digits);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 14 || pin.length !== 5) {
      setError('Please enter a valid phone number and 5-digit PIN.');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: apiError } = await api.post<{
      token: string;
      user: Record<string, unknown>;
    }>('/auth/login', { phone, pin, role });

    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    if (data) {
      saveToken(data.token);
      saveUser(data.user);
      window.location.href = redirectTo || (role === 'salon' ? '/salon/dashboard' : '/salon/customer');
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="salon-glass-card w-full max-w-md rounded-3xl p-6 sm:p-8 relative z-10 my-auto"
    >
      <AnimatePresence mode="wait">
        {showForgot ? (
          <ForgotPinFlow key="forgot" onCancel={() => setShowForgot(false)} />
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            {isInactivityLogout && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-3 rounded-xl mb-5 text-sm">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Session expired due to 30 minutes of inactivity. Please sign in again.</span>
              </div>
            )}
            <div className="text-center mb-6">
              <div className={`w-16 h-16 ${role === 'salon' ? 'bg-gradient-to-br from-[#FF8C42] to-[#FF6B1A]' : 'bg-gradient-to-br from-[#D4AF37] to-[#C9A227]'} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                {role === 'salon' ? <Building2 className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-[#0D0D0D]" />}
              </div>
              <h2 className="text-3xl font-bold text-[#F5F5F5] mb-2">Welcome Back</h2>
              <p className="text-[#A0A0A0]">Sign in to your account</p>
            </div>

            {!isRoleLocked && (
              <div className="flex gap-2 mb-6 bg-[#161616] p-1 rounded-xl border border-[#333]">
                <button
                  onClick={() => setRole('customer')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${role === 'customer'
                      ? 'bg-gradient-to-br from-[#D4AF37] to-[#C9A227] text-[#0D0D0D] shadow-lg'
                      : 'text-[#A0A0A0] hover:text-white'
                    }`}
                >
                  <User className="w-4 h-4 inline mr-1.5" />
                  Customer
                </button>
                <button
                  onClick={() => setRole('salon')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${role === 'salon'
                      ? 'bg-gradient-to-br from-[#FF8C42] to-[#FF6B1A] text-white shadow-lg'
                      : 'text-[#A0A0A0] hover:text-white'
                    }`}
                >
                  <Building2 className="w-4 h-4 inline mr-1.5" />
                  Salon Owner
                </button>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="salon-label">Phone Number</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 z-10 flex items-center justify-center pointer-events-none">
                    <Phone className="w-5 h-5 text-[#A0A0A0]" />
                  </div>
                  <input
                    type="tel"
                    className={`salon-input pl-12 w-full ${error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : ''}`}
                    value={phone}
                    onChange={handlePhoneChange}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="salon-label mb-0">5-Digit PIN</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-[#D4AF37] hover:underline hover:text-[#C9A227] transition-colors"
                  >
                    Forgot PIN?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 z-10 flex items-center justify-center pointer-events-none">
                    <ShieldCheck className="w-5 h-5 text-[#A0A0A0]" />
                  </div>
                  <input
                    type="password"
                    maxLength={5}
                    pattern="\d{5}"
                    className={`salon-input pl-12 w-full tracking-widest ${error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : ''}`}
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError(''); }}
                    required
                  />
                </div>
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-3.5 mt-4 ${role === 'salon' ? 'salon-btn-neon' : 'salon-btn-gold'}`}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[#A0A0A0] mt-6 text-sm">
              New to DQMS Salon?{' '}
              <Link href={isRoleLocked ? `/salon/register?role=${role}` : '/salon/register'} className="text-[#D4AF37] font-semibold hover:underline">
                Join the ecosystem
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SalonLogin() {
  return (
    <div className="min-h-screen relative flex items-start md:items-center justify-center p-4 py-24 bg-[#0D0D0D]">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] animate-glow-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FF8C42]/5 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="absolute top-6 left-6 z-50">
        <Link href="/salon" className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#D4AF37] transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Salon</span>
        </Link>
      </div>

      <Suspense fallback={
        <div className="salon-glass-card w-full max-w-md rounded-3xl p-10 text-center">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
