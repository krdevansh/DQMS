'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ArrowLeft, Plus, X, Clock, Calendar } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('dqms_token') : null; }

export default function TeacherHomework() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', title: '', description: '', deadline: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getToken();
    if (!t) { router.push('/school/login?role=teacher'); return; }
    loadData();
  }, []);

  const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesRes, hwRes] = await Promise.all([
        fetch(`${API}/schools/classes`, { headers: headers() }),
        fetch(`${API}/schools/homework`, { headers: headers() }),
      ]);
      const classesData = await classesRes.json();
      const hwData = await hwRes.json();
      if (classesData.classes) setClasses(classesData.classes);
      if (hwData.homework) setHomework(hwData.homework);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !form.subject || !form.title) return;
    const res = await fetch(`${API}/schools/homework`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ classId: selectedClass, section: selectedSection, ...form }),
    });
    const data = await res.json();
    if (data.homework) { setShowForm(false); setForm({ subject: '', title: '', description: '', deadline: '' }); loadData(); }
  };

  const filteredHw = homework.filter((hw: any) => {
    if (selectedClass && hw.classId?._id !== selectedClass && hw.classId !== selectedClass) return false;
    if (selectedSection && hw.section !== selectedSection) return false;
    return true;
  });

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/school/teacher/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="bg-gradient-to-br from-purple-500 to-violet-500 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">Manage Homework</h1>
              <p className="text-xs text-slate-500">Post and manage homework assignments</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-semibold">
            <Plus className="w-4 h-4" /> New Homework
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                <option value="">All classes</option>
                {classes.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Section</label>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                <option value="">All sections</option>
                {['A', 'B', 'C'].map((s) => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 mb-6 space-y-3">
            <h3 className="font-bold text-slate-800 mb-2">New Homework</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600">Post Homework</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">Cancel</button>
            </div>
          </form>
        )}

        {filteredHw.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No homework found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHw.map((hw: any) => (
              <div key={hw._id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-800 text-sm">{hw.title}</h3>
                        <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">{hw.subject}</span>
                      </div>
                      {hw.description && <p className="text-sm text-slate-600 mb-2">{hw.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>🏫 {hw.classId?.name || 'N/A'} - Section {hw.section}</span>
                        <span>📅 {new Date(hw.createdAt).toLocaleDateString()}</span>
                        {hw.deadline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due: {new Date(hw.deadline).toLocaleDateString()}</span>}
                        <span>👤 {hw.uploadedBy?.name || 'Unknown'}</span>
                      </div>
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
