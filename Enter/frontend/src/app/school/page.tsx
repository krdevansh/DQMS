'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, UserCircle, ShieldCheck, Users, ArrowRight } from 'lucide-react';

export default function SchoolLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl mb-4 shadow-lg shadow-amber-500/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">DQMS Schools</h1>
          <p className="text-slate-500 mt-2">Digital Attendance & Student Management System</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/school/login?role=admin"
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-amber-300 transition-all group">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Admin Portal</h2>
            <p className="text-sm text-slate-500 mb-4">Manage school, classes, teachers, and students</p>
            <div className="flex items-center text-amber-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Sign In <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link href="/school/login?role=teacher"
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition-all group">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UserCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Teacher Portal</h2>
            <p className="text-sm text-slate-500 mb-4">Take attendance, manage homework, file complaints</p>
            <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Sign In <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link href="/school/login?role=student"
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-emerald-300 transition-all group">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Student Portal</h2>
            <p className="text-sm text-slate-500 mb-4">View attendance, homework, marks, and notices</p>
            <div className="flex items-center text-emerald-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Sign In <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>

        <div className="text-center mt-8">
          <Link href="/school/register"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600 transition-colors">
            <GraduationCap className="w-4 h-4" />
            Register a new school
          </Link>
        </div>
      </div>
    </div>
  );
}
