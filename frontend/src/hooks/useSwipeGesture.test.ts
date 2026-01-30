import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useSwipeGesture } from './useSwipeGesture';

describe('useSwipeGesture', () => {
  it('should call onSwipeLeft when swiping left beyond threshold', () => {
    const onSwipeLeft = vi.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useSwipeGesture(ref, { onSwipeLeft, onSwipeRight: vi.fn() }));

    fireEvent.touchStart(ref.current, {
      touches: [{ clientX: 300, clientY: 200 }],
    });
    fireEvent.touchEnd(ref.current, {
      changedTouches: [{ clientX: 100, clientY: 200 }],
    });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });

  it('should call onSwipeRight when swiping right beyond threshold', () => {
    const onSwipeRight = vi.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useSwipeGesture(ref, { onSwipeLeft: vi.fn(), onSwipeRight }));

    fireEvent.touchStart(ref.current, {
      touches: [{ clientX: 100, clientY: 200 }],
    });
    fireEvent.touchEnd(ref.current, {
      changedTouches: [{ clientX: 300, clientY: 200 }],
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it('should not trigger callback for short swipes below threshold', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useSwipeGesture(ref, { onSwipeLeft, onSwipeRight }));

    fireEvent.touchStart(ref.current, {
      touches: [{ clientX: 200, clientY: 200 }],
    });
    fireEvent.touchEnd(ref.current, {
      changedTouches: [{ clientX: 210, clientY: 200 }],
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
