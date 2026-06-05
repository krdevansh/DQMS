'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, LogOut, ClipboardCheck, BookOpen, Award, Bell, School, BarChart3 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('dqms_token') : null; }
function getUser() {
  if (typeof window === 'undefined') return null;
  const s = localStorage.getItem('dqms_user');
  return s ? JSON.parse(s) : null;
}
function clearAuth() { localStorage.removeItem('dqms_token'); localStorage.removeItem('dqms_user'); }

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [recentHomework, setRecentHomework] = useState<any[]>([]);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
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
      const [profileRes, hwRes, noticesRes] = await Promise.all([
        fetch(`${API}/schools/profile`, { headers: headers() }),
        fetch(`${API}/schools/homework`, { headers: headers() }),
        fetch(`${API}/schools/notices`, { headers: headers() }),
      ]);
      const profile = await profileRes.json();
      const hwData = await hwRes.json();
      const noticesData = await noticesRes.json();
      if (profile.school) setSchool(profile.school);
      if (hwData.homework) setRecentHomework(hwData.homework.slice(0, 5));
      if (noticesData.notices) setRecentNotices(noticesData.notices.slice(0, 5));

      if (user?.id) {
        const attRes = await fetch(`${API}/schools/attendance/analytics?studentId=${user.id}`, { headers: headers() });
        const attData = await attRes.json();
        if (attData.total !== undefined) setAttendanceStats(attData);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const logout = () => { clearAuth(); router.push('/'); };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const quickLinks = [
    { label: 'My Attendance', icon: ClipboardCheck, href: '/school/student/attendance', color: 'from-emerald-500 to-teal-500' },
    { label: 'Homework', icon: BookOpen, href: '/school/student/homework', color: 'from-purple-500 to-violet-500' },
    { label: 'My Marks', icon: Award, href: '/school/student/marks', color: 'from-amber-500 to-orange-500' },
    { label: 'Notices', icon: Bell, href: '/school/student/notices', color: 'from-blue-500 to-indigo-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2 rounded-lg">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800">Student Portal</span>
              <p className="text-xs text-slate-500">{user?.name} | {user?.admissionNumber}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {attendanceStats && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-slate-500 mb-1">Overall Attendance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-800">{attendanceStats.percentage}%</span>
                  <span className="text-sm text-slate-500">({attendanceStats.present}/{attendanceStats.total} days)</span>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-emerald-600 font-medium">✓ {attendanceStats.present} Present</span>
                <span className="text-red-600 font-medium">✗ {attendanceStats.absent} Absent</span>
                <span className="text-amber-600 font-medium">⌛ {attendanceStats.leave} Leave</span>
                <span className="text-blue-600 font-medium">⏰ {attendanceStats.late} Late</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button key={link.label} onClick={() => router.push(link.href)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow text-left group">
                <div className={`w-12 h-12 bg-gradient-to-br ${link.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{link.label}</h3>
              </button>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-500" /> Recent Homework</h3>
            {recentHomework.length === 0 ? <p className="text-sm text-slate-500">No homework assigned</p> : (
              <div className="space-y-3">
                {recentHomework.map((hw: any) => (
                  <div key={hw._id} className="border border-slate-100 rounded-lg p-3">
                    <p className="font-semibold text-sm text-slate-800">{hw.title}</p>
                    <p className="text-xs text-slate-500">{hw.subject} — Due: {hw.deadline ? new Date(hw.deadline).toLocaleDateString() : 'No deadline'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-blue-500" /> Recent Notices</h3>
            {recentNotices.length === 0 ? <p className="text-sm text-slate-500">No notices yet</p> : (
              <div className="space-y-3">
                {recentNotices.map((n: any) => (
                  <div key={n._id} className="border border-slate-100 rounded-lg p-3">
                    <p className="font-semibold text-sm text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
