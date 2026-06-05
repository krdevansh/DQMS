'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, LogOut, ClipboardCheck, BookOpen, MessageSquare, School, Bell, BarChart3 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('dqms_token') : null; }
function getUser() {
  if (typeof window === 'undefined') return null;
  const s = localStorage.getItem('dqms_user');
  return s ? JSON.parse(s) : null;
}
function clearAuth() { localStorage.removeItem('dqms_token'); localStorage.removeItem('dqms_user'); }

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    const t = getToken();
    if (!u || !t) { router.push('/school/login?role=teacher'); return; }
    setUser(u);
    loadData();
  }, []);

  const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

  const loadData = async () => {
    try {
      const [profileRes, classesRes] = await Promise.all([
        fetch(`${API}/schools/profile`, { headers: headers() }),
        fetch(`${API}/schools/classes`, { headers: headers() }),
      ]);
      const profile = await profileRes.json();
      const classesData = await classesRes.json();
      if (profile.school) setSchool(profile.school);
      if (classesData.classes) setMyClasses(classesData.classes);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const logout = () => { clearAuth(); router.push('/'); };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const quickLinks = [
    { label: 'Take Attendance', icon: ClipboardCheck, href: '/school/teacher/attendance', color: 'from-blue-500 to-indigo-500' },
    { label: 'Manage Homework', icon: BookOpen, href: '/school/teacher/homework', color: 'from-purple-500 to-violet-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-lg">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800">Teacher Portal</span>
              <p className="text-xs text-slate-500">{user?.name} | {user?.teacherId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{school?.name}</span>
            <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Welcome, {user?.name}!</h2>
          <p className="text-sm text-slate-500">{school?.name} — {school?.schoolId}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button key={link.label} onClick={() => router.push(link.href)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow text-left group">
                <div className={`w-12 h-12 bg-gradient-to-br ${link.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-800">{link.label}</h3>
                <p className="text-sm text-slate-500 mt-1">Go to {link.label.toLowerCase()} module</p>
              </button>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-500" /> Your Classes</h3>
            {myClasses.length === 0 ? (
              <p className="text-sm text-slate-500">No classes assigned yet</p>
            ) : (
              <div className="space-y-2">
                {myClasses.map((cls: any) => (
                  <div key={cls._id} className="border border-slate-100 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{cls.name}</p>
                      <p className="text-xs text-slate-500">Sections: {cls.sections?.join(', ')}</p>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">{cls.classTeacher?.name === user?.name ? 'You' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-blue-500" /> School Info</h3>
            {school && (
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-medium text-slate-700">School:</span> {school.name}</p>
                <p><span className="font-medium text-slate-700">ID:</span> {school.schoolId}</p>
                <p><span className="font-medium text-slate-700">Address:</span> {school.address}, {school.city}, {school.state}</p>
                <p><span className="font-medium text-slate-700">Contact:</span> {school.contactNumber}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
