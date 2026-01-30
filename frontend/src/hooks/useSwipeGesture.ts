import { useEffect, useRef } from 'react';

interface SwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const THRESHOLD = 50;

export function useSwipeGesture(
  ref: React.RefObject<HTMLElement | null>,
  { onSwipeLeft, onSwipeRight }: SwipeOptions
) {
  const startX = useRef(0);
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);

  useEffect(() => {
    onSwipeLeftRef.current = onSwipeLeft;
    onSwipeRightRef.current = onSwipeRight;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const delta = endX - startX.current;
      if (Math.abs(delta) >= THRESHOLD) {
        if (delta < 0) {
          onSwipeLeftRef.current();
        } else {
          onSwipeRightRef.current();
        }
      }
    };

    el.addEventListener('touchstart', handleTouchStart);
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref]);
}
