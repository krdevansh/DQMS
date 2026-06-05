'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Scissors, Clock, CheckCircle, ArrowLeft, User, Calendar, Sparkles } from 'lucide-react';

const timeSlots: { time: string; available: boolean }[] = [];

const steps = ['Select Service', 'Choose Time', 'Your Details', 'Confirm'];

export default function SalonBookPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [bookingComplete, setBookingComplete] = useState(false);

  const services: { id: string; name: string; price: string; duration: string; icon: string }[] = [];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setBookingComplete(true);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!selectedService;
      case 1: return !!selectedDate && !!selectedTime;
      case 2: return formData.name && formData.phone.length === 10;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0D0D0D]">
      <div className="salon-noise-overlay"></div>
      
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF8C42]/5 rounded-full blur-[150px]"></div>
      </div>

      <nav className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/salon" className="flex items-center gap-3 group w-fit">
            <div className="bg-gradient-to-br from-[#D4AF37] to-[#C9A227] p-2 rounded-xl">
              <Scissors className="w-5 h-5 text-[#0D0D0D]" />
            </div>
            <span className="text-lg font-bold">
              <span className="text-[#D4AF37]">DQMS</span>
              <span className="text-[#F5F5F5] ml-1">Salons</span>
            </span>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {bookingComplete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 sm:py-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#D4AF37] to-[#C9A227] rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg shadow-[#D4AF37]/30"
            >
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-[#0D0D0D]" />
            </motion.div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#F5F5F5] mb-3 sm:mb-4">Booking Confirmed!</h1>
            <p className="text-lg sm:text-xl text-[#A0A0A0] mb-6 sm:mb-8">
              Your spot has been reserved. We&apos;ll notify you when it&apos;s your turn.
            </p>
            <div className="salon-glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md mx-auto mb-6 sm:mb-8">
              <p className="text-sm text-[#666] uppercase tracking-wider mb-2">Your Ticket</p>
              <p className="text-4xl sm:text-6xl font-bold text-transparent bg-clip-text salon-gradient-gold mb-4">#A16</p>
              <p className="text-[#A0A0A0]">Position: <span className="text-[#F5F5F5] font-semibold">2nd</span></p>
              <p className="text-[#A0A0A0]">Estimated wait: <span className="text-[#F5F5F5] font-semibold">~20 mins</span></p>
            </div>
            <Link href="/salon" className="salon-btn-gold inline-flex items-center gap-3 text-lg">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl sm:text-4xl font-bold text-[#F5F5F5] mb-2 sm:mb-3">Book Your Appointment</h1>
              <p className="text-sm sm:text-base text-[#A0A0A0]">Select your preferred service and time slot</p>
            </div>

            <div className="flex items-center justify-between mb-12 relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#333] -z-10"></div>
              <div 
                className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] -z-10 transition-all duration-500"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              ></div>
              
              {steps.map((step, index) => (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    index <= currentStep 
                      ? 'bg-gradient-to-br from-[#D4AF37] to-[#C9A227] text-[#0D0D0D]' 
                      : 'bg-[#161616] text-[#666] border border-[#333]'
                  }`}>
                    {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${
                    index <= currentStep ? 'text-[#D4AF37]' : 'text-[#666]'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <div className="salon-glass-card rounded-3xl p-8 mb-8">
              {currentStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] mb-4 sm:mb-6 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
                    Select Your Service
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service.id)}
                        className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border ${
                          selectedService === service.id
                            ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-lg'
                            : 'bg-[#0D0D0D]/50 border-[#333] hover:border-[#D4AF37]/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-[#161616] rounded-xl flex items-center justify-center text-2xl">
                            {service.icon}
                          </div>
                          {selectedService === service.id && (
                            <div className="w-6 h-6 bg-[#D4AF37] rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-[#0D0D0D]" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-[#F5F5F5] mb-1">{service.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-[#D4AF37] font-bold">{service.price}</span>
                          <span className="text-[#666] text-sm flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <h2 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-[#D4AF37]" />
                    Choose Date & Time
                  </h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#A0A0A0] mb-3">Select Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-[#0D0D0D]/50 border border-[#D4AF37]/20 rounded-xl px-4 py-4 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#A0A0A0] mb-3">Select Time Slot</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`p-4 rounded-xl font-medium transition-all duration-300 ${
                            selectedTime === slot.time
                              ? 'bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-[#0D0D0D] shadow-lg'
                              : slot.available
                              ? 'bg-[#0D0D0D]/50 border border-[#333] text-[#F5F5F5] hover:border-[#D4AF37]/30'
                              : 'bg-[#0D0D0D]/30 border border-[#222] text-[#666] cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-3">
                    <User className="w-6 h-6 text-[#D4AF37]" />
                    Your Details
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your name"
                      className="w-full bg-[#0D0D0D]/50 border border-[#D4AF37]/20 rounded-xl px-4 py-4 text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Phone Number</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 rounded-l-xl bg-[#161616] border border-r-0 border-[#333] text-[#666] font-medium">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                        placeholder="10-digit number"
                        className="flex-1 bg-[#0D0D0D]/50 border border-[#D4AF37]/20 rounded-r-xl px-4 py-4 text-[#F5F5F5] placeholder-[#666] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6">Confirm Your Booking</h2>

                  <div className="bg-[#0D0D0D]/50 rounded-2xl p-6 border border-[#333]">
                    <h3 className="text-sm text-[#666] uppercase tracking-wider mb-4">Booking Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-[#333]">
                        <span className="text-[#A0A0A0]">Service</span>
                        <span className="text-[#F5F5F5] font-semibold">
                          {services.find(s => s.id === selectedService)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-[#333]">
                        <span className="text-[#A0A0A0]">Date</span>
                        <span className="text-[#F5F5F5] font-semibold">{selectedDate}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-[#333]">
                        <span className="text-[#A0A0A0]">Time</span>
                        <span className="text-[#F5F5F5] font-semibold">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-[#333]">
                        <span className="text-[#A0A0A0]">Name</span>
                        <span className="text-[#F5F5F5] font-semibold">{formData.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-[#A0A0A0]">Phone</span>
                        <span className="text-[#F5F5F5] font-semibold">+91 {formData.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#C9A227]/10 rounded-2xl p-6 border border-[#D4AF37]/20">
                    <p className="text-center text-[#A0A0A0] mb-2">Booking Fee</p>
                    <p className="text-center text-4xl font-bold text-[#D4AF37]">
                      {services.find(s => s.id === selectedService)?.price}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 rounded-xl border border-[#333] text-[#A0A0A0] hover:border-[#D4AF37]/30 hover:text-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="salon-btn-gold flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Booking
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}