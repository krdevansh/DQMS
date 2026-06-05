'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ArrowLeft } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function SchoolRegister() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', code: '', principalName: '', address: '', city: '', state: '',
    pincode: '', contactNumber: '', email: '', adminPin: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.code || !form.principalName || !form.address || !form.city || !form.state || !form.pincode || !form.contactNumber || !form.adminPin) {
      setError('All required fields must be filled');
      return;
    }
    if (form.adminPin.length !== 5) {
      setError('PIN must be exactly 5 digits');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/schools/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }
      localStorage.setItem('dqms_token', data.token);
      localStorage.setItem('dqms_user', JSON.stringify({ ...data.school, role: 'school_admin' }));
      router.push('/school/admin/dashboard');
    } catch {
      setError('Network error'); setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <Link href="/school" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-amber-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to School Home
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Register School</h1>
              <p className="text-sm text-slate-500">Create a new school account</p>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">School Name *</label>
                <input type="text" value={form.name} onChange={update('name')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" placeholder="e.g. Spring Valley School" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">School Code *</label>
                <input type="text" value={form.code} onChange={update('code')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" placeholder="e.g. SVS" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Principal Name *</label>
                <input type="text" value={form.principalName} onChange={update('principalName')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" placeholder="Principal name" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
              <input type="text" value={form.address} onChange={update('address')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" placeholder="Full address" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                <input type="text" value={form.city} onChange={update('city')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                <input type="text" value={form.state} onChange={update('state')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pincode *</label>
                <input type="text" value={form.pincode} onChange={update('pincode')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number *</label>
                <input type="tel" value={form.contactNumber} onChange={update('contactNumber')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" placeholder="Phone number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={update('email')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" placeholder="Optional" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Admin PIN (5 digits) *</label>
              <input type="password" value={form.adminPin} onChange={update('adminPin')} maxLength={5} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" placeholder="Set a 5-digit PIN" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
              {loading ? 'Registering...' : 'Register School'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already registered? <Link href="/school/login" className="text-amber-600 hover:text-amber-700 font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
