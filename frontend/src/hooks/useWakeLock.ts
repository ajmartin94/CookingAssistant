import { useEffect, useRef } from 'react';

export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || !navigator.wakeLock) return;

    let cancelled = false;
    navigator.wakeLock
      .request('screen')
      .then((s) => {
        if (cancelled) {
          s.release();
        } else {
          sentinelRef.current = s;
        }
      })
      .catch((err: unknown) => {
        if (import.meta.env.DEV) console.warn('Wake lock failed:', err);
      });

    return () => {
      cancelled = true;
      sentinelRef.current?.release();
      sentinelRef.current = null;
    };
  }, [active]);
}
