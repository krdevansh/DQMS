'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Building2, MapPin, Clock, BadgeCheck, ChevronRight, Home, CalendarDays, User } from 'lucide-react';

export default function DiscoverPage() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  async function load(params?: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/hospitals${params || ''}`);
      const data = await res.json();
      setHospitals(data.hospitals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (pincode) p.set('pincode', pincode);
    const qs = p.toString();
    load(qs ? `?${qs}` : '');
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="hospital-page">
      <div className="hospital-container py-6 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-xl md:text-2xl font-semibold text-[#1E293B]">Find Hospitals</h1>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={handleSearch}
          className="hospital-card p-4 md:p-5 mb-6 space-y-3"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search by name, city, or address..."
                className="hospital-input pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="hospital-btn-primary">
              Search
            </button>
          </div>
          <input
            type="text"
            placeholder="Filter by pincode"
            className="hospital-input"
            value={pincode}
            onChange={e => setPincode(e.target.value)}
          />
        </motion.form>

        {loading && (
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="hospital-card p-5">
                <div className="flex items-start gap-4">
                  <div className="hospital-skeleton w-14 h-14 rounded-xl" />
                  <div className="flex-1 space-y-2.5">
                    <div className="hospital-skeleton h-5 w-3/4" />
                    <div className="hospital-skeleton h-4 w-full" />
                    <div className="flex gap-2 mt-2">
                      <div className="hospital-skeleton h-5 w-16 rounded-full" />
                      <div className="hospital-skeleton h-5 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && hospitals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Building2 className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#1E293B] mb-1">No hospitals found</h3>
            <p className="text-sm text-[#64748B]">Try adjusting your search or filters</p>
          </motion.div>
        )}

        {!loading && hospitals.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-4 md:gap-6"
          >
            {hospitals.map((h: any) => (
              <motion.div key={h._id} variants={cardVariants}>
                <Link
                  href={`/hospital/${h.slug}`}
                  className="hospital-card block p-5 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-blue-600/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/20 transition-colors">
                      <Building2 className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#1E293B] truncate group-hover:text-blue-600 transition-colors">
                        {h.name}
                      </h3>
                      <p className="text-sm text-[#64748B] truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {h.address}, {h.city}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`hospital-badge ${h.isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {h.isOpen ? 'Open' : 'Closed'}
                        </span>
                        {h.isVerified && (
                          <span className="hospital-badge bg-blue-50 text-blue-600">
                            <BadgeCheck className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#94A3B8] mt-1 flex-shrink-0 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <nav className="hospital-bottom-nav">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <Link href="/hospital" className="hospital-bottom-nav-btn">
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link href="/hospital/discover" className="hospital-bottom-nav-btn-active">
            <Search className="w-5 h-5" />
            <span>Search</span>
          </Link>
          <Link href="/hospital/patient/dashboard" className="hospital-bottom-nav-btn">
            <CalendarDays className="w-5 h-5" />
            <span>Appointments</span>
          </Link>
          <Link href="/hospital/patient/dashboard" className="hospital-bottom-nav-btn">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
