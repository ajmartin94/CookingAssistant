/**
 * useReducedMotion Hook
 *
 * Detects user's preference for reduced motion from the system settings.
 * Returns true when the user prefers reduced motion, false otherwise.
 */

import { useState, useEffect } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    try {
      const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
      return mediaQuery?.matches ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    try {
      const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
      if (!mediaQuery) {
        return;
      }

      const handleChange = (event: MediaQueryListEvent | { matches: boolean }) => {
        setPrefersReducedMotion(event.matches);
      };

      // Add event listener for preference changes
      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } catch {
      // Ignore errors in test environments without matchMedia
    }
  }, []);

  return prefersReducedMotion;
}
