/**
 * FeedbackModal Component
 *
 * Modal dialog for submitting user feedback with form validation,
 * loading states, and success/error toast notifications.
 */

import { useState, useEffect, useCallback, useRef, type FormEvent, type ChangeEvent } from 'react';
import { submitFeedback } from '../../services/feedbackApi';

export interface ScreenshotState {
  isCapturing: boolean;
  screenshot: string | null;
}

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshotState?: ScreenshotState;
}

const MIN_MESSAGE_LENGTH = 10;

export function FeedbackModal({ isOpen, onClose, screenshotState }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValid = message.length >= MIN_MESSAGE_LENGTH;

  // Clear state and cancel pending timeouts when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMessage('');
      setToast(null);
      setShowValidationError(false);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Handle Escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    },
    [isSubmitting, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!isValid) {
      setShowValidationError(true);
      return;
    }

    if (isSubmitting) {
      return;
    }

    setShowValidationError(false);

    setIsSubmitting(true);
    setToast(null);

    try {
      await submitFeedback({
        message,
        pageUrl: window.location.href,
        screenshot: screenshotState?.screenshot,
      });

      setToast({ type: 'success', text: 'Thanks for your feedback!' });
      // Close modal after delay to show success message
      closeTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setToast({ type: 'error', text: 'Could not submit feedback. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Feedback"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4 text-text-primary">Send Feedback</h2>

        {screenshotState?.isCapturing && (
          <p className="mb-4 text-sm text-text-muted">Capturing screenshot...</p>
        )}

        {screenshotState?.screenshot && !screenshotState.isCapturing && (
          <div className="mb-4">
            <img
              src={screenshotState.screenshot}
              alt="Screenshot preview"
              className="w-full max-h-32 object-cover object-top rounded border border-border"
            />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="feedback-message"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Feedback Message
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={handleMessageChange}
              placeholder="Tell us what you think..."
              className="w-full px-3 py-2 border border-default rounded-md bg-card text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              rows={4}
              disabled={isSubmitting}
            />
            <p className="text-xs text-text-muted mt-1">
              {message.length} / {MIN_MESSAGE_LENGTH} characters minimum
            </p>
            {showValidationError && !isValid && (
              <p className="text-xs text-error mt-1">
                Please enter at least {MIN_MESSAGE_LENGTH} characters of feedback.
              </p>
            )}
          </div>

          {/* Toast notification */}
          {toast && (
            <div
              className={`mb-4 p-3 rounded-md text-sm ${
                toast.type === 'success'
                  ? 'bg-success-subtle text-success'
                  : 'bg-error-subtle text-error'
              }`}
            >
              {toast.text}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-secondary rounded-md hover:bg-hover disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-text-on-accent bg-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <span
                  role="status"
                  className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                />
              )}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
