'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ArrowLeft, Calendar } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('dqms_token') : null; }
function getUser() {
  if (typeof window === 'undefined') return null;
  const s = localStorage.getItem('dqms_user');
  return s ? JSON.parse(s) : null;
}

export default function StudentNotices() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    const t = getToken();
    if (!u || !t) { router.push('/school/login?role=student'); return; }
    setUser(u);
    loadData();
  }, []);

  const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

  const loadData = async () => {
    try {
      const res = await fetch(`${API}/schools/notices`, { headers: headers() });
      const data = await res.json();
      if (data.notices) setNotices(data.notices);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      general: 'bg-slate-100 text-slate-600',
      exam: 'bg-red-100 text-red-600',
      event: 'bg-purple-100 text-purple-600',
      holiday: 'bg-green-100 text-green-600',
      emergency: 'bg-amber-100 text-amber-600',
    };
    return colors[type] || colors.general;
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/school/student/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-lg">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800">Notices</h1>
            <p className="text-xs text-slate-500">{user?.name} | {user?.admissionNumber}</p>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {notices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No notices posted yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((n: any) => (
              <div key={n._id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    n.type === 'emergency' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <Bell className={`w-5 h-5 ${n.type === 'emergency' ? 'text-red-600' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 text-sm">{n.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTypeBadge(n.type)}`}>{n.type}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{n.content}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(n.createdAt).toLocaleDateString()}</span>
                      <span>👤 {n.postedBy?.name || 'Unknown'} ({n.postedByRole})</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
