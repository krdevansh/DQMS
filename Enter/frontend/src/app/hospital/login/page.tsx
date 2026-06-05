'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

type Role = 'hospital_admin' | 'patient';

const tabs: { value: Role; label: string; color: string }[] = [
  { value: 'hospital_admin', label: 'Hospital Admin', color: '#2563EB' },
  { value: 'patient', label: 'Patient', color: '#8B5CF6' },
];

export default function HospitalLogin() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('hospital_admin');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      localStorage.setItem('dqms_token', data.token);
      localStorage.setItem('dqms_user', JSON.stringify(data.user));
      if (data.user.role === 'patient') {
        router.push('/hospital/patient/dashboard');
      } else {
        router.push('/hospital/dashboard');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hospital-page flex items-center justify-center px-4 py-10">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back link */}
        <Link
          href="/hospital"
          className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1E293B] transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="hospital-card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#2563EB]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Sign In</h1>
            <p className="text-sm text-[#64748B] mt-1">Select your role to continue</p>
          </div>

          {/* Role Tabs */}
          <div className="flex gap-2 mb-8">
            {tabs.map((tab) => {
              const active = role === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setRole(tab.value)}
                  className={`flex-1 text-sm font-medium px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                    active
                      ? 'border-transparent text-white shadow-sm'
                      : 'border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:text-[#1E293B]'
                  }`}
                  style={{ backgroundColor: active ? tab.color : undefined }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="hospital-label">Phone Number</label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Enter your phone number"
                required
                className="hospital-input text-base py-3.5"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="hospital-label">PIN Code</label>
              <input
                type="password"
                inputMode="numeric"
                placeholder="Enter 5-digit PIN"
                required
                maxLength={5}
                className="hospital-input text-base py-3.5 tracking-[0.5em] text-center"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
              />
              <p className="text-xs text-[#94A3B8] mt-1.5">5-digit security PIN</p>
            </div>

            {error && (
              <motion.p
                className="text-sm text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="hospital-btn-primary w-full text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#64748B]">
            {role === 'patient' ? (
              <Link href="/hospital/register/patient" className="text-[#8B5CF6] font-medium hover:underline">
                Create patient account
              </Link>
            ) : (
              <Link href="/hospital/register" className="text-[#2563EB] font-medium hover:underline">
                Register your hospital
              </Link>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
