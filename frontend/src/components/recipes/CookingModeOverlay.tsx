import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Instruction } from '../../types';
import { useCookingMode } from '../../hooks/useCookingMode';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CookingCompletionScreen } from './CookingCompletionScreen';
import { CookingStepMenu } from './CookingStepMenu';

interface CookingModeOverlayProps {
  recipeTitle: string;
  instructions: Instruction[];
  onClose: () => void;
  initialStep?: number;
  onStepChange?: (step: number) => void;
}

export function CookingModeOverlay({
  recipeTitle,
  instructions,
  onClose,
  initialStep = 0,
  onStepChange,
}: CookingModeOverlayProps) {
  const { currentStep, next, prev, reset, goTo, isFirst, isLast } = useCookingMode(
    instructions,
    initialStep
  );
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useWakeLock(true);

  const handleSwipeLeft = useCallback(() => {
    if (!isLast) {
      setDirection(1);
      next();
    }
  }, [isLast, next]);

  const handleSwipeRight = useCallback(() => {
    if (!isFirst) {
      setDirection(-1);
      prev();
    }
  }, [isFirst, prev]);

  useSwipeGesture(contentRef, { onSwipeLeft: handleSwipeLeft, onSwipeRight: handleSwipeRight });

  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  // Focus trap and keyboard navigation
  useEffect(() => {
    // Focus the dialog on mount
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && !isLast) {
        setDirection(1);
        next();
      }
      if (e.key === 'ArrowLeft' && !isFirst) {
        setDirection(-1);
        prev();
      }
      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, next, prev, isFirst, isLast]);

  // Browser back button support
  useEffect(() => {
    window.history.pushState({ cookingMode: true }, '');
    const handlePopState = () => onClose();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onClose]);

  const handleFinish = () => {
    setShowCompletion(true);
  };

  const handleNext = () => {
    setDirection(1);
    next();
  };

  const handlePrev = () => {
    setDirection(-1);
    prev();
  };

  const handleReset = () => {
    setDirection(-1);
    reset();
  };

  const animDuration = reducedMotion ? 0 : 0.25;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -100 : 100, opacity: 0 }),
  };

  if (instructions.length === 0) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        data-testid="cooking-mode-overlay"
        className="fixed inset-0 z-50 bg-primary flex items-center justify-center"
      >
        <p className="text-text-secondary">No steps available</p>
      </div>
    );
  }

  const total = instructions.length;
  const instruction = instructions[currentStep];

  if (showCompletion) {
    return (
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        data-testid="cooking-mode-overlay"
        className="fixed inset-0 z-50 bg-primary flex flex-col items-center justify-center"
      >
        <CookingCompletionScreen recipeTitle={recipeTitle} onDone={onClose} />
      </div>
    );
  }

  const handleStepSelect = (index: number) => {
    setShowMenu(false);
    if (index > currentStep) {
      setDirection(1);
    } else if (index < currentStep) {
      setDirection(-1);
    }
    goTo(index);
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      data-testid="cooking-mode-overlay"
      className="fixed inset-0 z-50 bg-primary flex flex-col"
      tabIndex={-1}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-default">
        <h2 className="text-xl font-bold text-text-primary">{recipeTitle}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-4 py-2 text-text-secondary hover:text-text-primary"
          >
            Steps
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary"
          >
            Close
          </button>
        </div>
      </div>

      {/* Step Menu */}
      {showMenu ? (
        <CookingStepMenu
          instructions={instructions}
          currentStep={currentStep}
          onStepSelect={handleStepSelect}
          onClose={() => setShowMenu(false)}
        />
      ) : (
        <>
          {/* Progress */}
          <div
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemax={total}
            className="h-1 bg-secondary"
          >
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${((currentStep + 1) / total) * 100}%` }}
            />
          </div>

          {/* Step indicator */}
          <div className="text-center py-2 text-text-secondary text-sm">
            Step {currentStep + 1} of {total}
          </div>

          {/* Step content */}
          <div ref={contentRef} className="flex-1 flex items-center justify-center p-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: animDuration }}
                className="text-2xl text-text-primary text-center max-w-2xl"
              >
                {instruction.instruction}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-t border-default">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-text-secondary hover:text-text-primary"
            >
              Start Over
            </button>
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={isFirst}
                className="px-6 py-3 bg-card text-text-primary rounded-lg font-medium disabled:opacity-50"
              >
                Previous
              </button>
              {isLast ? (
                <button
                  onClick={handleFinish}
                  className="px-6 py-3 bg-accent text-text-on-accent rounded-lg font-medium"
                >
                  Finish
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-accent text-text-on-accent rounded-lg font-medium"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
