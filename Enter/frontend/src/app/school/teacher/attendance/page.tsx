'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, ArrowLeft, Check, X, Clock, AlertCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('dqms_token') : null; }
function clearAuth() { localStorage.removeItem('dqms_token'); localStorage.removeItem('dqms_user'); }

export default function TeacherAttendance() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [existingAttendance, setExistingAttendance] = useState<any>(null);

  useEffect(() => {
    const t = getToken();
    if (!t) { router.push('/school/login?role=teacher'); return; }
    loadClasses();
  }, []);

  const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/schools/classes`, { headers: headers() });
      const data = await res.json();
      if (data.classes) setClasses(data.classes);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadStudents = async (classId: string, section: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/schools/students?classId=${classId}&section=${section}`, { headers: headers() });
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
        const defaultRecords: Record<string, string> = {};
        data.students.forEach((s: any) => { defaultRecords[s._id] = 'present'; });
        setRecords(defaultRecords);
      }
      const attRes = await fetch(`${API}/schools/attendance?classId=${classId}&section=${section}&date=${date}`, { headers: headers() });
      const attData = await attRes.json();
      if (attData.records?.length > 0) {
        setExistingAttendance(attData.records[0]);
        const loaded: Record<string, string> = {};
        attData.records[0].records.forEach((r: any) => { loaded[r.studentId] = r.status; });
        setRecords(loaded);
      } else {
        setExistingAttendance(null);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadStudents(selectedClass, selectedSection);
    }
  }, [selectedClass, selectedSection, date]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const recordsArray = Object.entries(records).map(([studentId, status]) => ({ studentId, status }));
      const res = await fetch(`${API}/schools/attendance`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ classId: selectedClass, section: selectedSection, date, records: recordsArray }),
      });
      const data = await res.json();
      if (data.message) {
        setMessage('Attendance saved successfully!');
        setExistingAttendance({ ...existingAttendance, records: recordsArray });
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const markAllAs = (status: string) => {
    const updated: Record<string, string> = {};
    students.forEach((s: any) => { updated[s._id] = status; });
    setRecords(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'absent': return 'bg-red-100 text-red-700 border-red-200';
      case 'leave': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'late': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading && students.length === 0) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/school/teacher/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-lg">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800">Take Attendance</h1>
            <p className="text-xs text-slate-500">Mark student attendance for today</p>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Select class</option>
                {classes.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {['A', 'B', 'C'].map((s) => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> {message}
          </div>
        )}

        {selectedClass && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-slate-500">Quick mark:</span>
              {['present', 'absent', 'leave', 'late'].map((status) => (
                <button key={status} onClick={() => markAllAs(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(status)} hover:opacity-80 transition-opacity capitalize`}>
                  {status === 'present' && <Check className="w-3 h-3 inline mr-1" />}
                  {status === 'absent' && <X className="w-3 h-3 inline mr-1" />}
                  {(status === 'leave' || status === 'late') && <Clock className="w-3 h-3 inline mr-1" />}
                  All {status}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {students.map((student: any) => (
                  <div key={student._id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-500">{student.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-800">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.admissionNumber}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {['present', 'absent', 'leave', 'late'].map((status) => {
                        const active = records[student._id] === status;
                        return (
                          <button key={status} onClick={() => setRecords({ ...records, [student._id]: status })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${active ? getStatusColor(status) : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {students.length > 0 && (
              <div className="mt-4 flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <p className="text-sm text-slate-600">
                  {Object.values(records).filter(v => v === 'present').length} Present &bull;
                  {Object.values(records).filter(v => v === 'absent').length} Absent &bull;
                  {Object.values(records).filter(v => v === 'leave').length} Leave &bull;
                  {Object.values(records).filter(v => v === 'late').length} Late
                  &bull; Total: {students.length}
                </p>
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  {existingAttendance ? 'Update Attendance' : 'Save Attendance'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
