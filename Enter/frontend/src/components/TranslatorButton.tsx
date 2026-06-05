'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';

export default function TranslatorButton() {
  const { lang, toggleLang } = useLanguage();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-3 bg-[#1A1A2E] border border-white/10 rounded-2xl p-3 shadow-2xl"
          >
            <button
              onClick={() => { toggleLang(); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                lang === 'en' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-[#A0A0A0] hover:bg-white/5'
              }`}
            >
              <span className="text-lg">🇬🇧</span>
              English
              {lang === 'en' && <span className="ml-auto text-[10px] text-[#D4AF37]">✓</span>}
            </button>
            <button
              onClick={() => { toggleLang(); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                lang === 'hi' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-[#A0A0A0] hover:bg-white/5'
              }`}
            >
              <span className="text-lg">🇮🇳</span>
              हिंदी
              {lang === 'hi' && <span className="ml-auto text-[10px] text-[#D4AF37]">✓</span>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] shadow-lg shadow-[#D4AF37]/30 flex items-center justify-center text-[#0D0D0D] font-bold text-sm"
        title="Change Language"
      >
        {lang === 'en' ? 'EN' : 'हि'}
      </motion.button>
    </div>
  );
}
