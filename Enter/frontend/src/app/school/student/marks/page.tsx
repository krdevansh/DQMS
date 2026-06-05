'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, ArrowLeft } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('dqms_token') : null; }
function getUser() {
  if (typeof window === 'undefined') return null;
  const s = localStorage.getItem('dqms_user');
  return s ? JSON.parse(s) : null;
}

export default function StudentMarks() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    const t = getToken();
    if (!u || !t) { router.push('/school/login?role=student'); return; }
    setUser(u);
    loadData(u);
  }, []);

  const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

  const loadData = async (u: any) => {
    try {
      const res = await fetch(`${API}/schools/marks?studentId=${u.id}`, { headers: headers() });
      const data = await res.json();
      if (data.marks) setMarks(data.marks);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const getPercentage = (obtained: number, total: number) => Math.round((obtained / total) * 100);

  const getGradeColor = (pct: number) => {
    if (pct >= 90) return 'text-emerald-600';
    if (pct >= 75) return 'text-blue-600';
    if (pct >= 60) return 'text-amber-600';
    if (pct >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/school/student/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2 rounded-lg">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800">My Marks</h1>
            <p className="text-xs text-slate-500">{user?.name} | {user?.admissionNumber}</p>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {marks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No marks recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {marks.map((m: any) => {
              const pct = getPercentage(m.marksObtained, m.totalMarks);
              return (
                <div key={m._id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        pct >= 75 ? 'bg-emerald-100' : pct >= 60 ? 'bg-amber-100' : 'bg-red-100'
                      }`}>
                        <Award className={`w-5 h-5 ${pct >= 75 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800 text-sm">{m.subject}</h3>
                          {m.examType && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{m.examType}</span>}
                          {m.term && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">{m.term}</span>}
                        </div>
                        <p className="text-xs text-slate-500">
                          {m.marksObtained}/{m.totalMarks} &bull; {m.grade ? `Grade: ${m.grade}` : ''}
                          {m.academicYear && ` &bull; ${m.academicYear}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getGradeColor(pct)}`}>{pct}%</p>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full rounded-full ${
                          pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-blue-500' : pct >= 60 ? 'bg-amber-500' : pct >= 40 ? 'bg-orange-500' : 'bg-red-500'
                        }`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
