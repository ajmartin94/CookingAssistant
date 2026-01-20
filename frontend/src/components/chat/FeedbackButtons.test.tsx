import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import FeedbackButtons from './FeedbackButtons';

/**
 * TDD tests for FeedbackButtons component.
 * These tests are written before implementation (red phase).
 *
 * FeedbackButtons renders thumbs up/down buttons on AI messages
 * and allows users to provide optional feedback comments.
 */

describe('FeedbackButtons', () => {
  const mockOnFeedback = vi.fn();
  const defaultProps = {
    messageId: 'msg_123',
    onFeedback: mockOnFeedback,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('should render thumbs up button', () => {
      render(<FeedbackButtons {...defaultProps} />);

      const thumbsUpButton = screen.getByRole('button', { name: /thumbs up/i });
      expect(thumbsUpButton).toBeInTheDocument();
    });

    it('should render thumbs down button', () => {
      render(<FeedbackButtons {...defaultProps} />);

      const thumbsDownButton = screen.getByRole('button', { name: /thumbs down/i });
      expect(thumbsDownButton).toBeInTheDocument();
    });

    it('should render both buttons in a group', () => {
      render(<FeedbackButtons {...defaultProps} />);

      const thumbsUp = screen.getByRole('button', { name: /thumbs up/i });
      const thumbsDown = screen.getByRole('button', { name: /thumbs down/i });

      expect(thumbsUp).toBeInTheDocument();
      expect(thumbsDown).toBeInTheDocument();
    });

    it('should have accessible aria labels', () => {
      render(<FeedbackButtons {...defaultProps} />);

      expect(screen.getByRole('button', { name: /thumbs up/i })).toHaveAttribute(
        'aria-label',
        expect.stringMatching(/helpful|good|up/i)
      );
      expect(screen.getByRole('button', { name: /thumbs down/i })).toHaveAttribute(
        'aria-label',
        expect.stringMatching(/not helpful|bad|down/i)
      );
    });
  });

  // ===========================================================================
  // Interaction Tests
  // ===========================================================================

  describe('Interactions', () => {
    it('should call onFeedback with "up" when thumbs up is clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons {...defaultProps} />);

      const thumbsUpButton = screen.getByRole('button', { name: /thumbs up/i });
      await user.click(thumbsUpButton);

      expect(mockOnFeedback).toHaveBeenCalledWith({
        messageId: 'msg_123',
        rating: 'up',
      });
    });

    it('should call onFeedback with "down" when thumbs down is clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons {...defaultProps} />);

      const thumbsDownButton = screen.getByRole('button', { name: /thumbs down/i });
      await user.click(thumbsDownButton);

      expect(mockOnFeedback).toHaveBeenCalledWith({
        messageId: 'msg_123',
        rating: 'down',
      });
    });

    it('should show comment input after thumbs down is clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons {...defaultProps} />);

      const thumbsDownButton = screen.getByRole('button', { name: /thumbs down/i });
      await user.click(thumbsDownButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/what went wrong/i)).toBeInTheDocument();
      });
    });

    it('should NOT show comment input after thumbs up is clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons {...defaultProps} />);

      const thumbsUpButton = screen.getByRole('button', { name: /thumbs up/i });
      await user.click(thumbsUpButton);

      expect(screen.queryByPlaceholderText(/what went wrong/i)).not.toBeInTheDocument();
    });

    it('should submit comment when entered after thumbs down', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons {...defaultProps} />);

      // Click thumbs down
      const thumbsDownButton = screen.getByRole('button', { name: /thumbs down/i });
      await user.click(thumbsDownButton);

      // Enter comment
      const commentInput = await screen.findByPlaceholderText(/what went wrong/i);
      await user.type(commentInput, 'The instructions were unclear');

      // Submit comment (could be Enter key or submit button)
      const submitButton = screen.getByRole('button', { name: /submit|send/i });
      await user.click(submitButton);

      expect(mockOnFeedback).toHaveBeenCalledWith({
        messageId: 'msg_123',
        rating: 'down',
        comment: 'The instructions were unclear',
      });
    });
  });

  // ===========================================================================
  // State Display Tests
  // ===========================================================================

  describe('State Display', () => {
    it('should highlight thumbs up when currentRating is "up"', () => {
      render(<FeedbackButtons {...defaultProps} currentRating="up" />);

      const thumbsUpButton = screen.getByRole('button', { name: /thumbs up/i });
      expect(thumbsUpButton).toHaveClass('text-green-500'); // or similar active class
    });

    it('should highlight thumbs down when currentRating is "down"', () => {
      render(<FeedbackButtons {...defaultProps} currentRating="down" />);

      const thumbsDownButton = screen.getByRole('button', { name: /thumbs down/i });
      expect(thumbsDownButton).toHaveClass('text-red-500'); // or similar active class
    });

    it('should not highlight either button when no rating', () => {
      render(<FeedbackButtons {...defaultProps} />);

      const thumbsUpButton = screen.getByRole('button', { name: /thumbs up/i });
      const thumbsDownButton = screen.getByRole('button', { name: /thumbs down/i });

      expect(thumbsUpButton).not.toHaveClass('text-green-500');
      expect(thumbsDownButton).not.toHaveClass('text-red-500');
    });
  });

  // ===========================================================================
  // Loading State Tests
  // ===========================================================================

  describe('Loading State', () => {
    it('should disable buttons when isLoading is true', () => {
      render(<FeedbackButtons {...defaultProps} isLoading={true} />);

      const thumbsUpButton = screen.getByRole('button', { name: /thumbs up/i });
      const thumbsDownButton = screen.getByRole('button', { name: /thumbs down/i });

      expect(thumbsUpButton).toBeDisabled();
      expect(thumbsDownButton).toBeDisabled();
    });

    it('should show loading indicator when isLoading is true', () => {
      render(<FeedbackButtons {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('status')).toBeInTheDocument(); // spinner or similar
    });
  });

  // ===========================================================================
  // Error State Tests
  // ===========================================================================

  describe('Error State', () => {
    it('should display error message when error prop is provided', () => {
      render(<FeedbackButtons {...defaultProps} error="Failed to submit feedback" />);

      expect(screen.getByText('Failed to submit feedback')).toBeInTheDocument();
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons {...defaultProps} error="Failed to submit feedback" />);

      // Buttons should still be clickable to retry
      const thumbsUpButton = screen.getByRole('button', { name: /thumbs up/i });
      expect(thumbsUpButton).not.toBeDisabled();

      await user.click(thumbsUpButton);
      expect(mockOnFeedback).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Comment Input Tests
  // ===========================================================================

  describe('Comment Input', () => {
    it('should limit comment to 2000 characters', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons {...defaultProps} />);

      // Click thumbs down to show comment input
      const thumbsDownButton = screen.getByRole('button', { name: /thumbs down/i });
      await user.click(thumbsDownButton);

      const commentInput = await screen.findByPlaceholderText(/what went wrong/i);
      expect(commentInput).toHaveAttribute('maxLength', '2000');
    });

    it('should allow closing comment input without submitting', async () => {
      const user = userEvent.setup();
      render(<FeedbackButtons {...defaultProps} />);

      // Click thumbs down to show comment input
      const thumbsDownButton = screen.getByRole('button', { name: /thumbs down/i });
      await user.click(thumbsDownButton);

      const commentInput = await screen.findByPlaceholderText(/what went wrong/i);
      expect(commentInput).toBeInTheDocument();

      // Find and click close/cancel button
      const closeButton = screen.getByRole('button', { name: /cancel|close|skip/i });
      await user.click(closeButton);

      // Comment input should be hidden
      expect(screen.queryByPlaceholderText(/what went wrong/i)).not.toBeInTheDocument();

      // Feedback should have been submitted with just the rating (no comment)
      expect(mockOnFeedback).toHaveBeenCalledWith({
        messageId: 'msg_123',
        rating: 'down',
      });
    });
  });
});
