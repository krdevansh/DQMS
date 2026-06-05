'use client';

import { useEffect, useRef, useCallback } from 'react';
import { clearToken, clearUser, getToken } from './api';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms
const EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];

/**
 * Hook that automatically logs out the user after 30 minutes of inactivity.
 * Pass redirectPath to control where to redirect after logout.
 */
export function useInactivityLogout(redirectPath = '/') {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const token = getToken();
      if (token) {
        clearToken();
        clearUser();
        window.location.href = redirectPath + '?reason=inactivity';
      }
    }, INACTIVITY_TIMEOUT);
  }, [redirectPath]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only activate if user is logged in
    const token = getToken();
    if (!token) return;

    resetTimer();

    EVENTS.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);
}
