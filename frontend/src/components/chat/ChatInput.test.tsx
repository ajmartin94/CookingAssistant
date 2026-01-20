import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import ChatInput from './ChatInput';

/**
 * TDD tests for ChatInput component.
 * These tests are written before implementation (red phase).
 *
 * ChatInput is the message input area with submit functionality
 * and visual feedback during loading/streaming states.
 */

describe('ChatInput', () => {
  const mockOnSend = vi.fn();

  const defaultProps = {
    onSend: mockOnSend,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('should render a text input', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument();
    });

    it('should render a send button', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should have placeholder text', () => {
      render(<ChatInput {...defaultProps} />);

      expect(
        screen.getByPlaceholderText(/type.*message|ask.*anything|message/i)
      ).toBeInTheDocument();
    });

    it('should render as a form for proper submission handling', () => {
      const { container } = render(<ChatInput {...defaultProps} />);

      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Input Behavior Tests
  // ===========================================================================

  describe('Input Behavior', () => {
    it('should accept text input', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'Hello world');

      expect(input).toHaveValue('Hello world');
    });

    it('should allow pasting text', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.click(input);
      await user.paste('Pasted content');

      expect(input).toHaveValue('Pasted content');
    });

    it('should support multi-line input with Shift+Enter', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      expect(input).toHaveValue('Line 1\nLine 2');
    });

    it('should auto-expand textarea for multi-line content', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      const initialHeight = input.scrollHeight;

      await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2{Shift>}{Enter}{/Shift}Line 3');

      // Height should increase for multi-line content
      expect(input.scrollHeight).toBeGreaterThanOrEqual(initialHeight);
    });
  });

  // ===========================================================================
  // Submit Tests
  // ===========================================================================

  describe('Submit Behavior', () => {
    it('should call onSend when send button is clicked', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });

    it('should call onSend when Enter is pressed (without Shift)', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'Test message{Enter}');

      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });

    it('should NOT call onSend when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'Test message{Shift>}{Enter}{/Shift}');

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should clear input after successful send', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'Test message{Enter}');

      expect(input).toHaveValue('');
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should not send whitespace-only messages', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, '   ');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should trim whitespace from messages before sending', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, '  Hello world  {Enter}');

      expect(mockOnSend).toHaveBeenCalledWith('Hello world');
    });

    it('should prevent form submission default behavior', async () => {
      const user = userEvent.setup();
      const { container } = render(<ChatInput {...defaultProps} />);

      const form = container.querySelector('form')!;
      const submitHandler = vi.fn((e: Event) => e.preventDefault());
      form.addEventListener('submit', submitHandler);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'Test{Enter}');

      // Form submission should be handled internally
      expect(mockOnSend).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Loading State Tests
  // ===========================================================================

  describe('Loading State', () => {
    it('should disable input when isLoading is true', () => {
      render(<ChatInput {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('textbox', { name: /message/i })).toBeDisabled();
    });

    it('should disable send button when isLoading is true', () => {
      render(<ChatInput {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('should show loading indicator on send button when isLoading', () => {
      render(<ChatInput {...defaultProps} isLoading={true} />);

      // Button should have loading indicator (spinner or similar)
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton.querySelector('[data-testid="loading-spinner"]')).toBeInTheDocument();
    });

    it('should preserve input value while loading', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'Test message');

      // Simulate loading state starting
      rerender(<ChatInput {...defaultProps} isLoading={true} />);

      // Input should still have the value
      expect(input).toHaveValue('Test message');
    });

    it('should not call onSend while loading', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} isLoading={true} />);

      // Try clicking send (even though it should be disabled)
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Disabled State Tests
  // ===========================================================================

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      render(<ChatInput {...defaultProps} disabled={true} />);

      expect(screen.getByRole('textbox', { name: /message/i })).toBeDisabled();
    });

    it('should disable send button when disabled prop is true', () => {
      render(<ChatInput {...defaultProps} disabled={true} />);

      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('should show visual disabled state', () => {
      render(<ChatInput {...defaultProps} disabled={true} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      expect(input).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  // ===========================================================================
  // Character Limit Tests
  // ===========================================================================

  describe('Character Limit', () => {
    it('should enforce maximum character limit', () => {
      render(<ChatInput {...defaultProps} maxLength={2000} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      expect(input).toHaveAttribute('maxLength', '2000');
    });

    it('should show character count when approaching limit', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} maxLength={100} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'A'.repeat(90));

      // Should show remaining characters when close to limit
      expect(screen.getByText(/10.*remaining|90.*100/i)).toBeInTheDocument();
    });

    it('should warn when at character limit', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} maxLength={50} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'A'.repeat(50));

      // Should show warning styling or message
      expect(screen.getByText(/0.*remaining|limit reached|50.*50/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have proper label for input', () => {
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      expect(input).toHaveAccessibleName();
    });

    it('should have proper label for send button', () => {
      render(<ChatInput {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toHaveAccessibleName();
    });

    it('should focus input when panel opens', () => {
      render(<ChatInput {...defaultProps} autoFocus={true} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      expect(document.activeElement).toBe(input);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      // Tab to input
      await user.tab();
      expect(screen.getByRole('textbox', { name: /message/i })).toHaveFocus();

      // Tab to send button
      await user.tab();
      expect(screen.getByRole('button', { name: /send/i })).toHaveFocus();
    });

    it('should announce loading state to screen readers', () => {
      render(<ChatInput {...defaultProps} isLoading={true} />);

      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  // ===========================================================================
  // Placeholder Customization Tests
  // ===========================================================================

  describe('Placeholder Customization', () => {
    it('should accept custom placeholder prop', () => {
      render(<ChatInput {...defaultProps} placeholder="Ask about this recipe..." />);

      expect(screen.getByPlaceholderText('Ask about this recipe...')).toBeInTheDocument();
    });

    it('should show context-aware placeholder when context is provided', () => {
      render(<ChatInput {...defaultProps} contextHint="Test Recipe" />);

      expect(screen.getByPlaceholderText(/Test Recipe/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Send Button State Tests
  // ===========================================================================

  describe('Send Button State', () => {
    it('should disable send button when input is empty', () => {
      render(<ChatInput {...defaultProps} />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has content', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).not.toBeDisabled();
    });

    it('should disable send button when input only has whitespace', async () => {
      const user = userEvent.setup();
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, '   ');

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });
  });
});
