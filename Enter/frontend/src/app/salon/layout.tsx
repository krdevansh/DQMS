'use client';

import React from 'react';
import { LanguageProvider } from '@/lib/language-context';
import TranslatorButton from '@/components/TranslatorButton';

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <div className="salon-theme min-h-screen relative overflow-hidden">
        {children}
        <TranslatorButton />
      </div>
    </LanguageProvider>
  );
}
