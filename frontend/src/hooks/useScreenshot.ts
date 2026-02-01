/**
 * useScreenshot Hook
 *
 * Captures a screenshot of the page using html2canvas.
 */

import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';

const SCREENSHOT_JPEG_QUALITY = 0.7;
const SCREENSHOT_MAX_WIDTH = 1280;

interface UseScreenshotReturn {
  screenshot: string | null;
  isCapturing: boolean;
  capture: () => Promise<string | null>;
}

export function useScreenshot(): UseScreenshotReturn {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = useCallback(async (): Promise<string | null> => {
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(document.body, {
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        height: document.documentElement.clientHeight,
        y: window.scrollY,
      });
      // Resize to max width
      let finalCanvas: HTMLCanvasElement = canvas;
      if (canvas.width > SCREENSHOT_MAX_WIDTH) {
        const scale = SCREENSHOT_MAX_WIDTH / canvas.width;
        const resized = document.createElement('canvas');
        resized.width = SCREENSHOT_MAX_WIDTH;
        resized.height = canvas.height * scale;
        const ctx = resized.getContext('2d');
        ctx?.drawImage(canvas, 0, 0, resized.width, resized.height);
        finalCanvas = resized;
      }
      const dataUrl = finalCanvas.toDataURL('image/jpeg', SCREENSHOT_JPEG_QUALITY);
      setScreenshot(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      setScreenshot(null);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  return { screenshot, isCapturing, capture };
}
