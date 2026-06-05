'use client';

import React, { Suspense, useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ArrowLeft, ShieldCheck, UserCircle, Users } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type Role = 'admin' | 'teacher' | 'student';

const roleConfig: Record<Role, { icon: React.ReactNode; label: string; color: string; activeColor: string }> = {
  admin: { icon: <ShieldCheck className="w-4 h-4" />, label: 'Admin', color: 'bg-amber-100 text-amber-600', activeColor: 'bg-amber-500 text-white' },
  teacher: { icon: <UserCircle className="w-4 h-4" />, label: 'Teacher', color: 'bg-blue-100 text-blue-600', activeColor: 'bg-blue-500 text-white' },
  student: { icon: <Users className="w-4 h-4" />, label: 'Student', color: 'bg-emerald-100 text-emerald-600', activeColor: 'bg-emerald-500 text-white' },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>((searchParams.get('role') as Role) || 'admin');
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = searchParams.get('role') as Role;
    if (r && ['admin', 'teacher', 'student'].includes(r)) setRole(r);
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let endpoint = '';
      let body: Record<string, string> = {};

      if (role === 'admin') {
        endpoint = '/schools/auth/login';
        body = { schoolId: form.schoolId || '', pin: form.pin || '' };
        if (!body.schoolId || !body.pin) { setError('School ID and PIN required'); setLoading(false); return; }
      } else if (role === 'teacher') {
        endpoint = '/schools/auth/teacher-login';
        body = { schoolId: form.schoolId || '', teacherId: form.teacherId || '', pin: form.pin || '' };
        if (!body.schoolId || !body.teacherId || !body.pin) { setError('All fields required'); setLoading(false); return; }
      } else {
        endpoint = '/schools/auth/student-login';
        body = { schoolId: form.schoolId || '', admissionNumber: form.admissionNumber || '', dob: form.dob || '' };
        if (!body.schoolId || !body.admissionNumber || !body.dob) { setError('All fields required'); setLoading(false); return; }
      }

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }

      localStorage.setItem('dqms_token', data.token);
      localStorage.setItem('dqms_user', JSON.stringify(data.user));

      if (role === 'admin') router.push('/school/admin/dashboard');
      else if (role === 'teacher') router.push('/school/teacher/dashboard');
      else router.push('/school/student/dashboard');
    } catch {
      setError('Network error'); setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const roles: Role[] = ['admin', 'teacher', 'student'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link href="/school" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-amber-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to School Home
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">School Sign In</h1>
              <p className="text-sm text-slate-500">Select your portal to continue</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            {roles.map((r) => {
              const cfg = roleConfig[r];
              const active = role === r;
              return (
                <button key={r} onClick={() => { setRole(r); setError(''); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${active ? cfg.activeColor : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {cfg.icon} {cfg.label}
                </button>
              );
            })}
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">School ID</label>
              <input type="text" value={form.schoolId || ''} onChange={update('schoolId')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="e.g. SCH-XXXXX" />
            </div>

            {role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teacher ID</label>
                <input type="text" value={form.teacherId || ''} onChange={update('teacherId')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g. TCH-XXXXX" />
              </div>
            )}

            {role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admission Number</label>
                <input type="text" value={form.admissionNumber || ''} onChange={update('admissionNumber')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="e.g. STU-0001" />
              </div>
            )}

            {role !== 'student' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PIN</label>
                <input type="password" value={form.pin || ''} onChange={update('pin')} maxLength={5}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="5-digit PIN" />
              </div>
            )}

            {role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input type="date" value={form.dob || ''} onChange={update('dob')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            New school? <Link href="/school/register" className="text-amber-600 hover:text-amber-700 font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SchoolLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
