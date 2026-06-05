'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Clock,
  UserCheck,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function QueueContent() {
  const searchParams = useSearchParams();
  const hospitalId = searchParams.get('hospitalId');
  const [queue, setQueue] = useState<{
    serving: { _id: string; ticket: string; patientName: string } | null;
    waiting: { _id: string; ticket: string; patientName: string }[];
    totalWaiting: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hospitalName, setHospitalName] = useState('');

  const loadQueue = useCallback(async () => {
    if (!hospitalId) { setLoading(false); return; }
    try {
      const res = await fetch(`${API}/hospitals/${hospitalId}/queue`);
      if (!res.ok) return;
      const data = await res.json();
      setQueue({
        serving: data.serving || null,
        waiting: data.waiting || [],
        totalWaiting: data.totalWaiting || 0,
      });
      if (data.hospitalName) setHospitalName(data.hospitalName);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => {
    if (hospitalId) {
      fetch(`${API}/hospitals/${hospitalId}`)
        .then(r => r.json())
        .then(d => { if (d.name) setHospitalName(d.name); })
        .catch(() => {});
    }
  }, [hospitalId]);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 15000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  if (loading) {
    return (
      <div className="hospital-page flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
      </div>
    );
  }

  if (!hospitalId) {
    return (
      <div className="hospital-page flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-[#CBD5E1] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#1E293B] mb-2">No Hospital Selected</h2>
          <p className="text-sm text-[#64748B] mb-6">Please select a hospital to track your queue</p>
          <Link
            href="/hospital/discover"
            className="hospital-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
          >
            Find Hospitals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="hospital-page">
      <div className="hospital-container pb-8">
        <div className="pt-6 pb-6">
          <Link
            href="/hospital/patient/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#1E293B]">{hospitalName || 'Live Queue'}</h1>
              <p className="text-sm text-[#64748B]">Real-time queue tracking</p>
            </div>
            <button
              onClick={loadQueue}
              className="p-2 rounded-lg hover:bg-[#E2E8F0] text-[#64748B] transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {queue === null ? (
            <motion.div
              key="inactive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hospital-card p-12 text-center"
            >
              <Clock className="w-12 h-12 text-[#CBD5E1] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1E293B] mb-2">Queue Not Active</h3>
              <p className="text-sm text-[#64748B]">The hospital queue is not currently active</p>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`rounded-xl p-6 ${
                    queue.serving
                      ? 'bg-[#F0FDF4] border-2 border-[#10B981]'
                      : 'bg-white border border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      queue.serving ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'
                    }`}>
                      <UserCheck className={`w-5 h-5 ${queue.serving ? 'text-white' : 'text-[#94A3B8]'}`} />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">
                    Now Serving
                  </p>
                  {queue.serving ? (
                    <div>
                      <p className="text-2xl font-bold text-[#1E293B]">{queue.serving.ticket}</p>
                      <p className="text-sm text-[#64748B] mt-0.5">{queue.serving.patientName}</p>
                    </div>
                  ) : (
                    <p className="text-lg font-medium text-[#94A3B8]">—</p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="hospital-card p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#2563EB]" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">
                    Your Position
                  </p>
                  <p className="text-2xl font-bold text-[#1E293B]">
                    {queue.waiting.length > 0 ? (
                      <>
                        #{queue.waiting.length}
                        <span className="text-sm font-normal text-[#64748B] ml-1">
                          of {queue.totalWaiting + (queue.serving ? 1 : 0)} in line
                        </span>
                      </>
                    ) : queue.serving ? (
                      <>
                        <span className="text-[#10B981]">Now</span>
                        <span className="text-sm font-normal text-[#64748B] ml-1">being served</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="hospital-card p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#F59E0B]" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">
                    Estimated Wait
                  </p>
                  <p className="text-2xl font-bold text-[#1E293B]">
                    {queue.waiting.length > 0
                      ? `~${queue.waiting.length * 5} min`
                      : queue.serving
                      ? '0 min'
                      : '—'}
                  </p>
                  {queue.waiting.length > 0 && (
                    <p className="text-xs text-[#64748B] mt-0.5">~5 min per patient</p>
                  )}
                </motion.div>
              </div>

              {queue.waiting.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="hospital-card overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                    <h3 className="font-semibold text-[#1E293B]">Waiting List</h3>
                    <span className="text-sm text-[#64748B]">{queue.waiting.length} patients</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#E2E8F0]">
                          <th className="px-6 py-4 text-left font-medium text-[#64748B]">#</th>
                          <th className="px-6 py-4 text-left font-medium text-[#64748B]">Ticket</th>
                          <th className="px-6 py-4 text-left font-medium text-[#64748B]">Patient</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {queue.waiting.map((entry: any, i: number) => (
                          <motion.tr
                            key={entry._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="hover:bg-[#F8FAFC] transition-colors"
                          >
                            <td className="px-6 py-4 text-[#64748B]">{i + 1}</td>
                            <td className="px-6 py-4 font-mono font-bold text-[#2563EB]">{entry.ticket}</td>
                            <td className="px-6 py-4 text-[#1E293B]">{entry.patientName}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              <p className="text-xs text-[#64748B] text-center flex items-center justify-center gap-1.5">
                <RefreshCw className="w-3 h-3" />
                Auto-refreshes every 15 seconds
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function PatientQueue() {
  return (
    <Suspense
      fallback={
        <div className="hospital-page flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <QueueContent />
    </Suspense>
  );
}
