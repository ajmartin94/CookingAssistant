/**
 * useScreenshot Hook Tests
 *
 * Tests for the screenshot capture hook that wraps html2canvas.
 * The hook does not exist yet — these tests define the expected behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScreenshot } from './useScreenshot';

// Mock html2canvas — the package is not installed yet
vi.mock('html2canvas', () => ({
  default: vi.fn(),
}));

import html2canvas from 'html2canvas';

const mockHtml2Canvas = vi.mocked(html2canvas);

describe('useScreenshot', () => {
  beforeEach(() => {
    mockHtml2Canvas.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calling capture() returns a base64 string', async () => {
    // Create a fake canvas that returns a base64 data URL
    const fakeCanvas = {
      toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,abc123'),
    } as unknown as HTMLCanvasElement;
    mockHtml2Canvas.mockResolvedValue(fakeCanvas);

    const { result } = renderHook(() => useScreenshot());

    let screenshot: string | null = null;
    await act(async () => {
      screenshot = await result.current.capture();
    });

    expect(screenshot).toBe('data:image/jpeg;base64,abc123');
  });

  it('returns null if html2canvas throws (graceful failure)', async () => {
    mockHtml2Canvas.mockRejectedValue(new Error('Canvas render failed'));

    const { result } = renderHook(() => useScreenshot());

    let screenshot: string | null = null;
    await act(async () => {
      screenshot = await result.current.capture();
    });

    expect(screenshot).toBeNull();
  });

  it('isCapturing is true during capture, false after', async () => {
    let resolveCapture: (value: HTMLCanvasElement) => void;
    const capturePromise = new Promise<HTMLCanvasElement>((resolve) => {
      resolveCapture = resolve;
    });
    mockHtml2Canvas.mockReturnValue(capturePromise);

    const { result } = renderHook(() => useScreenshot());

    expect(result.current.isCapturing).toBe(false);

    // Start capture but don't resolve yet
    let captureResultPromise: Promise<string | null>;
    act(() => {
      captureResultPromise = result.current.capture();
    });

    // isCapturing should be true while awaiting
    expect(result.current.isCapturing).toBe(true);

    // Resolve the capture
    const fakeCanvas = {
      toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,abc123'),
    } as unknown as HTMLCanvasElement;

    await act(async () => {
      resolveCapture!(fakeCanvas);
      await captureResultPromise;
    });

    expect(result.current.isCapturing).toBe(false);
  });
});
