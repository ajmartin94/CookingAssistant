import { useState, useCallback } from 'react';
import type { Instruction } from '../types';

interface UseCookingModeReturn {
  currentStep: number;
  next: () => void;
  prev: () => void;
  reset: () => void;
  goTo: (step: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

export function useCookingMode(instructions: Instruction[], initialStep = 0): UseCookingModeReturn {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const next = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, instructions.length - 1));
  }, [instructions.length]);

  const prev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const goTo = useCallback(
    (step: number) => {
      setCurrentStep(Math.max(0, Math.min(step, instructions.length - 1)));
    },
    [instructions.length]
  );

  return {
    currentStep,
    next,
    prev,
    reset,
    goTo,
    isFirst: currentStep === 0,
    isLast: currentStep === instructions.length - 1,
  };
}
