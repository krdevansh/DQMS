'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Users, UserCircle, BookOpen, LogOut, CalendarCheck, Clock, Bell, BookMarked, School, BarChart3, Plus, X } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('dqms_token') : null; }
function getUser() {
  if (typeof window === 'undefined') return null;
  const s = localStorage.getItem('dqms_user');
  return s ? JSON.parse(s) : null;
}
function clearAuth() { localStorage.removeItem('dqms_token'); localStorage.removeItem('dqms_user'); }

export default function SchoolAdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentHomework, setRecentHomework] = useState<any[]>([]);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [classForm, setClassForm] = useState({ name: '', sections: '' });
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', phone: '', subjects: '', assignedClass: '', isClassTeacher: false });
  const [studentForm, setStudentForm] = useState({ classId: '', section: 'A', name: '', fatherName: '', motherName: '', dob: '', gender: '', phone: '', address: '', bloodGroup: '' });
  const [teacherDefaultPin, setTeacherDefaultPin] = useState('');

  useEffect(() => {
    const u = getUser();
    const t = getToken();
    if (!u || !t) { router.push('/school/login'); return; }
    setUser(u);
    loadData();
  }, []);

  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, classesRes, teachersRes, studentsRes] = await Promise.all([
        fetch(`${API}/schools/profile`, { headers: headers() }),
        fetch(`${API}/schools/classes`, { headers: headers() }),
        fetch(`${API}/schools/teachers`, { headers: headers() }),
        fetch(`${API}/schools/students`, { headers: headers() }),
      ]);
      const profile = await profileRes.json();
      const classesData = await classesRes.json();
      const teachersData = await teachersRes.json();
      const studentsData = await studentsRes.json();
      if (profile.school) { setSchool(profile.school); setStats(profile.stats); }
      if (classesData.classes) setClasses(classesData.classes);
      if (teachersData.teachers) setTeachers(teachersData.teachers);
      if (studentsData.students) setStudents(studentsData.students);

      const dashRes = await fetch(`${API}/schools/dashboard`, { headers: headers() });
      const dashData = await dashRes.json();
      if (dashData.stats) setStats(dashData.stats);
      if (dashData.recentHomework) setRecentHomework(dashData.recentHomework);
      if (dashData.recentNotices) setRecentNotices(dashData.recentNotices);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const sections = classForm.sections ? classForm.sections.split(',').map((s: string) => s.trim()) : ['A'];
    const res = await fetch(`${API}/schools/classes`, { method: 'POST', headers: headers(), body: JSON.stringify({ name: classForm.name, sections }) });
    const data = await res.json();
    if (data.class) { setShowClassForm(false); setClassForm({ name: '', sections: '' }); loadData(); }
  };

  const addTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const subjects = teacherForm.subjects ? teacherForm.subjects.split(',').map((s: string) => s.trim()) : [];
    const body: any = { name: teacherForm.name, email: teacherForm.email, phone: teacherForm.phone, subjects, isClassTeacher: teacherForm.isClassTeacher };
    if (teacherForm.assignedClass) body.assignedClass = teacherForm.assignedClass;
    const res = await fetch(`${API}/schools/teachers`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    const data = await res.json();
    if (data.teacher) {
      setTeacherDefaultPin(data.defaultPin);
      setShowTeacherForm(false);
      setTeacherForm({ name: '', email: '', phone: '', subjects: '', assignedClass: '', isClassTeacher: false });
      loadData();
      setTimeout(() => setTeacherDefaultPin(''), 8000);
    }
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/schools/students`, { method: 'POST', headers: headers(), body: JSON.stringify(studentForm) });
    const data = await res.json();
    if (data.student) { setShowStudentForm(false); setStudentForm({ classId: '', section: 'A', name: '', fatherName: '', motherName: '', dob: '', gender: '', phone: '', address: '', bloodGroup: '' }); loadData(); }
  };

  const removeTeacher = async (id: string) => {
    await fetch(`${API}/schools/teachers/${id}`, { method: 'DELETE', headers: headers() });
    loadData();
  };

  const removeStudent = async (id: string) => {
    await fetch(`${API}/schools/students/${id}`, { method: 'DELETE', headers: headers() });
    loadData();
  };

  const logout = () => { clearAuth(); router.push('/'); };

  const getStudentCount = (classId: string) => students.filter((s: any) => s.classId?._id === classId || s.classId === classId).length;

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800">{school?.name || 'School Admin'}</span>
              <p className="text-xs text-slate-500">{school?.schoolId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{school?.city}</span>
            <button onClick={() => window.location.href = '/school/subscription'} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors text-sm font-medium">
              <GraduationCap className="w-4 h-4" /> Subscription
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {teacherDefaultPin && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Teacher added! Default PIN: <strong>{teacherDefaultPin}</strong> (last 5 digits of phone)
            <button onClick={() => setTeacherDefaultPin('')} className="ml-auto text-blue-500 hover:text-blue-700"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Teachers', value: stats?.totalTeachers || 0, icon: UserCircle, color: 'from-blue-500 to-indigo-500' },
            { label: 'Students', value: stats?.totalStudents || 0, icon: Users, color: 'from-emerald-500 to-teal-500' },
            { label: 'Classes', value: stats?.totalClasses || 0, icon: BookOpen, color: 'from-purple-500 to-violet-500' },
            { label: 'Present Today', value: stats?.presentToday || 0, icon: CalendarCheck, color: 'from-green-500 to-emerald-500' },
            { label: 'Absent Today', value: stats?.absentToday || 0, icon: Clock, color: 'from-rose-500 to-red-500' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className={`w-9 h-9 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl mb-6 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'classes', label: 'Classes', icon: BookOpen },
            { key: 'teachers', label: 'Teachers', icon: UserCircle },
            { key: 'students', label: 'Students', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-1 justify-center ${activeTab === tab.key ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BookMarked className="w-4 h-4 text-amber-500" /> Recent Homework</h3>
              {recentHomework.length === 0 ? <p className="text-sm text-slate-500">No homework posted yet</p> : (
                <div className="space-y-3">
                  {recentHomework.map((hw: any) => (
                    <div key={hw._id} className="border border-slate-100 rounded-lg p-3">
                      <p className="font-semibold text-sm text-slate-800">{hw.title}</p>
                      <p className="text-xs text-slate-500">{hw.subject} — {hw.classId?.name || 'N/A'} {hw.section}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-amber-500" /> Recent Notices</h3>
              {recentNotices.length === 0 ? <p className="text-sm text-slate-500">No notices posted yet</p> : (
                <div className="space-y-3">
                  {recentNotices.map((n: any) => (
                    <div key={n._id} className="border border-slate-100 rounded-lg p-3">
                      <p className="font-semibold text-sm text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500">{n.type} — {new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Classes ({classes.length})</h2>
              <button onClick={() => setShowClassForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-semibold">
                <Plus className="w-4 h-4" /> Add Class
              </button>
            </div>
            {showClassForm && (
              <form onSubmit={addClass} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
                    <input type="text" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="e.g. Class 10" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sections (comma separated)</label>
                    <input type="text" value={classForm.sections} onChange={(e) => setClassForm({ ...classForm, sections: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="A, B, C" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600">Create</button>
                  <button type="button" onClick={() => setShowClassForm(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">Cancel</button>
                </div>
              </form>
            )}
            {classes.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No classes created yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls: any) => (
                  <div key={cls._id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800">{cls.name}</h3>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{cls.sections?.join(', ')}</span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Teacher: {cls.classTeacher?.name || 'Not assigned'} &bull; Students: {getStudentCount(cls._id)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'teachers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Teachers ({teachers.length})</h2>
              <button onClick={() => setShowTeacherForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-semibold">
                <Plus className="w-4 h-4" /> Add Teacher
              </button>
            </div>
            {showTeacherForm && (
              <form onSubmit={addTeacher} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                    <input type="text" value={teacherForm.name} onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                    <input type="tel" value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subjects</label>
                    <input type="text" value={teacherForm.subjects} onChange={(e) => setTeacherForm({ ...teacherForm, subjects: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Math, Science" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Class</label>
                    <select value={teacherForm.assignedClass} onChange={(e) => setTeacherForm({ ...teacherForm, assignedClass: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                      <option value="">Not assigned</option>
                      {classes.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={teacherForm.isClassTeacher} onChange={(e) => setTeacherForm({ ...teacherForm, isClassTeacher: e.target.checked })}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                      Class Teacher
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600">Add</button>
                  <button type="button" onClick={() => setShowTeacherForm(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">Cancel</button>
                </div>
              </form>
            )}
            {teachers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <UserCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No teachers added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teachers.map((t: any) => (
                  <div key={t._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <UserCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800 text-sm">{t.name}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">{t.teacherId}</span>
                          {t.isClassTeacher && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">Class Teacher</span>}
                        </div>
                        <p className="text-xs text-slate-500">
                          {t.email && <span>✉️ {t.email} </span>}📞 {t.phone} {t.subjects?.length > 0 && <span>📚 {t.subjects.join(', ')}</span>}
                          {t.assignedClass?.name && <span> 🏫 {t.assignedClass.name}</span>}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => removeTeacher(t._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Students ({students.length})</h2>
              <button onClick={() => setShowStudentForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-semibold">
                <Plus className="w-4 h-4" /> Add Student
              </button>
            </div>
            {showStudentForm && (
              <form onSubmit={addStudent} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Class *</label>
                    <select value={studentForm.classId} onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })} required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                      <option value="">Select class</option>
                      {classes.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Section *</label>
                    <input type="text" value={studentForm.section} onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="A" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                    <input type="text" value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Father Name</label>
                    <input type="text" value={studentForm.fatherName} onChange={(e) => setStudentForm({ ...studentForm, fatherName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mother Name</label>
                    <input type="text" value={studentForm.motherName} onChange={(e) => setStudentForm({ ...studentForm, motherName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">DOB *</label>
                    <input type="date" value={studentForm.dob} onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                    <select value={studentForm.gender} onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input type="tel" value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                    <input type="text" value={studentForm.bloodGroup} onChange={(e) => setStudentForm({ ...studentForm, bloodGroup: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="O+" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input type="text" value={studentForm.address} onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600">Add</button>
                  <button type="button" onClick={() => setShowStudentForm(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">Cancel</button>
                </div>
              </form>
            )}
            {students.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No students added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((s: any) => (
                  <div key={s._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800 text-sm">{s.name}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">{s.admissionNumber}</span>
                          {s.gender && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium capitalize">{s.gender}</span>}
                        </div>
                        <p className="text-xs text-slate-500">
                          🏫 {s.classId?.name || 'N/A'} - Section {s.section} 📞 {s.phone || 'N/A'} {s.dob && <span>🎂 {s.dob}</span>}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => removeStudent(s._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
