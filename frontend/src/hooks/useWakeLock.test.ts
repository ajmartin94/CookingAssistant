import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from './useWakeLock';

describe('useWakeLock', () => {
  const mockRelease = vi.fn().mockResolvedValue(undefined);
  const mockWakeLock = { released: false, release: mockRelease };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRelease.mockClear();
    Object.defineProperty(navigator, 'wakeLock', {
      writable: true,
      configurable: true,
      value: {
        request: vi.fn().mockResolvedValue(mockWakeLock),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should acquire wake lock on mount', async () => {
    renderHook(() => useWakeLock(true));
    expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen');
  });

  it('should release wake lock on unmount', async () => {
    const { unmount } = renderHook(() => useWakeLock(true));
    // Wait for the request promise to resolve
    await act(async () => {});
    unmount();
    expect(mockRelease).toHaveBeenCalled();
  });

  it('should handle unsupported browsers gracefully', () => {
    Object.defineProperty(navigator, 'wakeLock', {
      writable: true,
      configurable: true,
      value: undefined,
    });
    // Should not throw
    expect(() => {
      renderHook(() => useWakeLock(true));
    }).not.toThrow();
  });
});
