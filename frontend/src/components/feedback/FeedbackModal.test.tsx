/**
 * FeedbackModal Component Tests
 *
 * Tests for the feedback modal with form validation, API submission,
 * and success/error toast notifications.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { FeedbackModal } from './FeedbackModal';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:8000';

const mockOnClose = vi.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
};

describe('FeedbackModal', () => {
  beforeEach(() => {
    mockOnClose.mockClear();
    // Mock window.location.href for URL capture
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000/recipes/123' },
      writable: true,
    });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('rendering', () => {
    it('renders modal with textarea when open', () => {
      render(<FeedbackModal {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: /feedback/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /feedback message/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<FeedbackModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('submit button is disabled when message is empty', () => {
      render(<FeedbackModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });

    it('submit button is disabled when message is less than 10 characters', async () => {
      const user = userEvent.setup();
      render(<FeedbackModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /feedback message/i });
      await user.type(textarea, 'Too short');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });

    it('submit button is enabled when message is 10 or more characters', async () => {
      const user = userEvent.setup();
      render(<FeedbackModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /feedback message/i });
      await user.type(textarea, 'This is a valid feedback message');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('submit button is enabled at exactly 10 characters', async () => {
      const user = userEvent.setup();
      render(<FeedbackModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /feedback message/i });
      await user.type(textarea, '1234567890'); // Exactly 10 characters

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('submission', () => {
    it('shows loading spinner while submitting', async () => {
      // Delay the response to observe loading state
      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return HttpResponse.json({ id: '1', message: 'Feedback received' });
        })
      );

      const user = userEvent.setup();
      render(<FeedbackModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /feedback message/i });
      await user.type(textarea, 'This is valid feedback');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Loading spinner should be visible
      expect(screen.getByRole('status')).toBeInTheDocument();
      // Submit button should be disabled during loading
      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();

      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('shows success toast and closes modal on successful submission', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async () => {
          return HttpResponse.json({ id: '1', message: 'Feedback received' });
        })
      );

      const user = userEvent.setup();
      render(<FeedbackModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /feedback message/i });
      await user.type(textarea, 'This is valid feedback');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Wait for success toast
      await waitFor(() => {
        expect(screen.getByText(/thanks for your feedback!/i)).toBeInTheDocument();
      });

      // Modal should close after success (after 1500ms delay)
      await waitFor(
        () => {
          expect(mockOnClose).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it('shows error toast on submission failure', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async () => {
          return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
        })
      );

      const user = userEvent.setup();
      render(<FeedbackModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /feedback message/i });
      await user.type(textarea, 'This is valid feedback');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Wait for error toast
      await waitFor(() => {
        expect(
          screen.getByText(/could not submit feedback. please try again./i)
        ).toBeInTheDocument();
      });

      // Modal should remain open on error
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('sends page URL with feedback submission', async () => {
      let capturedRequest: { message: string; page_url: string } | null = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async ({ request }) => {
          capturedRequest = (await request.json()) as { message: string; page_url: string };
          return HttpResponse.json({
            id: '1',
            message: 'Feedback received',
            created_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(<FeedbackModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /feedback message/i });
      await user.type(textarea, 'This is valid feedback');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(capturedRequest).not.toBeNull();
        // API uses snake_case per project conventions
        expect(capturedRequest?.page_url).toBe('http://localhost:3000/recipes/123');
        expect(capturedRequest?.message).toBe('This is valid feedback');
      });
    });
  });

  describe('keyboard interactions', () => {
    it('Escape key closes modal without submitting', async () => {
      const user = userEvent.setup();
      render(<FeedbackModal {...defaultProps} />);

      // Type some feedback
      const textarea = screen.getByRole('textbox', { name: /feedback message/i });
      await user.type(textarea, 'This is valid feedback');

      // Press Escape
      await user.keyboard('{Escape}');

      // Modal should close without submission
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('Escape key does not close modal while submitting', async () => {
      // Delay the response to simulate loading state
      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return HttpResponse.json({ id: '1', message: 'Feedback received' });
        })
      );

      const user = userEvent.setup();
      render(<FeedbackModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /feedback message/i });
      await user.type(textarea, 'This is valid feedback');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // While submitting, Escape should not close
      await user.keyboard('{Escape}');
      expect(mockOnClose).not.toHaveBeenCalled();

      // Wait for submission to complete (modal closes after 1500ms delay)
      await waitFor(
        () => {
          expect(mockOnClose).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('screenshot', () => {
    it('shows loading indicator while screenshot is being captured', () => {
      render(
        <FeedbackModal
          {...defaultProps}
          screenshotState={{ isCapturing: true, screenshot: null }}
        />
      );

      expect(screen.getByText(/capturing screenshot/i)).toBeInTheDocument();
    });

    it('renders screenshot thumbnail when capture succeeds', () => {
      render(
        <FeedbackModal
          {...defaultProps}
          screenshotState={{ isCapturing: false, screenshot: 'data:image/jpeg;base64,abc123' }}
        />
      );

      const thumbnail = screen.getByRole('img', { name: /screenshot preview/i });
      expect(thumbnail).toBeInTheDocument();
      expect(thumbnail).toHaveAttribute('src', 'data:image/jpeg;base64,abc123');
    });

    it('opens without screenshot thumbnail when capture fails', () => {
      render(
        <FeedbackModal
          {...defaultProps}
          screenshotState={{ isCapturing: false, screenshot: null }}
        />
      );

      expect(screen.queryByRole('img', { name: /screenshot preview/i })).not.toBeInTheDocument();
      // Modal should still be functional
      expect(screen.getByRole('textbox', { name: /feedback message/i })).toBeInTheDocument();
    });

    it('passes screenshot to submitFeedback on submit', async () => {
      let capturedRequest: { message: string; page_url: string; screenshot?: string } | null = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async ({ request }) => {
          capturedRequest = (await request.json()) as {
            message: string;
            page_url: string;
            screenshot?: string;
          };
          return HttpResponse.json({
            id: '1',
            message: 'Feedback received',
            created_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(
        <FeedbackModal
          {...defaultProps}
          screenshotState={{ isCapturing: false, screenshot: 'data:image/jpeg;base64,abc123' }}
        />
      );

      const textarea = screen.getByRole('textbox', { name: /feedback message/i });
      await user.type(textarea, 'This is valid feedback');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(capturedRequest).not.toBeNull();
        expect(capturedRequest!.screenshot).toBe('data:image/jpeg;base64,abc123');
      });
    });
  });

  describe('theming', () => {
    it('modal container uses semantic bg-card token instead of hardcoded bg-white', () => {
      render(<FeedbackModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog', { name: /feedback/i });
      // The inner content container (child of the overlay)
      const modalContent = dialog.querySelector('.rounded-lg');

      expect(modalContent?.className).toMatch(/\bbg-card\b/);
      expect(modalContent?.className).not.toMatch(/\bbg-white\b/);
    });
  });

  describe('accessibility', () => {
    it('modal has proper ARIA attributes', () => {
      render(<FeedbackModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog', { name: /feedback/i });
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('textarea has proper label association', () => {
      render(<FeedbackModal {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /feedback message/i });
      expect(textarea).toHaveAccessibleName(/feedback message/i);
    });
  });
});
