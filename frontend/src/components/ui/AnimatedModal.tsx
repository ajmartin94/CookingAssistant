/**
 * AnimatedModal Component
 *
 * A modal dialog with scale-in and fade animations.
 * Respects user's reduced motion preferences.
 */

import React, { useEffect } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface AnimatedModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal content */
  children: React.ReactNode;
  /** Test ID for testing */
  'data-testid'?: string;
}

export function AnimatedModal({
  isOpen,
  onClose,
  children,
  'data-testid': testId,
}: AnimatedModalProps): JSX.Element | null {
  const prefersReducedMotion = useReducedMotion();

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const animationClass = prefersReducedMotion ? '' : 'animate-scale-in';
  const overlayAnimationClass = prefersReducedMotion ? '' : 'animate-fade-in';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 ${overlayAnimationClass}`}
        data-testid="modal-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className={`relative z-10 bg-[var(--bg-card)] rounded-xl p-6 shadow-xl max-w-md w-full mx-4 ${animationClass}`}
        data-testid={testId}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
