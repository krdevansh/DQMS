'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HospitalRegister() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', pin: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    if (field === 'pin') {
      value = value.replace(/\D/g, '').slice(0, 5);
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'hospital_admin' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      localStorage.setItem('dqms_token', data.token);
      localStorage.setItem('dqms_user', JSON.stringify(data.user));
      router.push('/hospital/dashboard');
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Create Hospital Account</h1>
            <p className="text-sm text-[#64748B] mt-1">Register your healthcare facility</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="hospital-label">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                required
                className="hospital-input text-base py-3.5"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>

            <div>
              <label className="hospital-label">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="hospital-input text-base py-3.5"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>

            <div>
              <label className="hospital-label">Phone Number</label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Enter your phone number"
                required
                className="hospital-input text-base py-3.5"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>

            <div>
              <label className="hospital-label">PIN Code</label>
              <input
                type="password"
                inputMode="numeric"
                placeholder="Create a 5-digit PIN"
                required
                maxLength={5}
                className="hospital-input text-base py-3.5 tracking-[0.5em] text-center"
                value={form.pin}
                onChange={(e) => update('pin', e.target.value)}
              />
              <p className="text-xs text-[#94A3B8] mt-1.5">
                Use this PIN to sign in later. Must be 5 digits.
              </p>
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
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#64748B]">
            Already registered?{' '}
            <Link href="/hospital/login" className="text-[#2563EB] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
