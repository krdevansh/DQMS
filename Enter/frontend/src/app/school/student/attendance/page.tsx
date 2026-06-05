'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, ArrowLeft, Check, X, Clock } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('dqms_token') : null; }
function getUser() {
  if (typeof window === 'undefined') return null;
  const s = localStorage.getItem('dqms_user');
  return s ? JSON.parse(s) : null;
}

export default function StudentAttendance() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const u = getUser();
    const t = getToken();
    if (!u || !t) { router.push('/school/login?role=student'); return; }
    setUser(u);
    loadData(u);
  }, [month]);

  const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

  const loadData = async (u: any) => {
    setLoading(true);
    try {
      const [attRes, statsRes] = await Promise.all([
        fetch(`${API}/schools/attendance?studentId=${u.id}&month=${month}`, { headers: headers() }),
        fetch(`${API}/schools/attendance/analytics?studentId=${u.id}&month=${month}`, { headers: headers() }),
      ]);
      const attData = await attRes.json();
      const statsData = await statsRes.json();
      if (attData.records) setRecords(attData.records);
      if (statsData.total !== undefined) setStats(statsData);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-medium"><Check className="w-3 h-3" /> Present</span>;
      case 'absent': return <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-xs font-medium"><X className="w-3 h-3" /> Absent</span>;
      case 'leave': return <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs font-medium"><Clock className="w-3 h-3" /> Leave</span>;
      case 'late': return <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full text-xs font-medium"><Clock className="w-3 h-3" /> Late</span>;
      default: return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/school/student/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2 rounded-lg">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800">My Attendance</h1>
            <p className="text-xs text-slate-500">{user?.name} | {user?.admissionNumber}</p>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Month</label>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            {stats && (
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">{stats.percentage}%</p>
                  <p className="text-xs text-slate-500">Overall</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
                  <p className="text-xs text-slate-500">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  <p className="text-xs text-slate-500">Absent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{stats.leave}</p>
                  <p className="text-xs text-slate-500">Leave</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.late}</p>
                  <p className="text-xs text-slate-500">Late</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {records.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No attendance records found for this month</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((rec: any) => {
              const myRecord = rec.records?.find((r: any) => r.studentId === user?.id);
              if (!myRecord) return null;
              return (
                <div key={rec._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-semibold text-slate-800">{rec.date}</p>
                    {rec.classId && <p className="text-xs text-slate-500">Class: {rec.classId?.name || rec.classId}</p>}
                  </div>
                  {getStatusBadge(myRecord.status)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
