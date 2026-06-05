'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, t as translate, default as translations } from './translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string) => {
    const entry = translations[key];
    return entry ? entry.en : key;
  },
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('dqms_lang') as Language | null;
    if (stored === 'en' || stored === 'hi') {
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem('dqms_lang', l);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'hi' : 'en');
  }, [lang, setLang]);

  const t = useCallback((key: string) => {
    return translate(key, lang);
  }, [lang]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      <div lang={lang}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
