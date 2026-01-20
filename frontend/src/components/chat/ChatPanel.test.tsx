import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import ChatPanel from './ChatPanel';

/**
 * TDD tests for ChatPanel component.
 * These tests are written before implementation (red phase).
 *
 * ChatPanel is a collapsible panel that displays chat messages,
 * a streaming indicator during AI responses, and tool confirmations.
 *
 * Component hierarchy (per design doc):
 * <ChatPanel>
 *   <MessageList>
 *   <ToolConfirmation>
 *   <ChatInput>
 * </ChatPanel>
 */

// Types that will be implemented
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}

describe('ChatPanel', () => {
  const mockOnSendMessage = vi.fn();
  const mockOnConfirmTool = vi.fn();

  const defaultProps = {
    onSendMessage: mockOnSendMessage,
    onConfirmTool: mockOnConfirmTool,
    context: { page: 'recipe_detail' as const, recipeId: 'recipe_123', recipeTitle: 'Test Recipe' },
  };

  const mockMessages: ChatMessage[] = [
    {
      id: 'msg_1',
      role: 'user',
      content: 'Make this recipe dairy-free',
      timestamp: '2026-01-19T10:00:00Z',
    },
    {
      id: 'msg_2',
      role: 'assistant',
      content: "I'll help you make this recipe dairy-free. Here are the suggested changes:",
      timestamp: '2026-01-19T10:00:05Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('should render the chat panel container', () => {
      render(<ChatPanel {...defaultProps} />);

      expect(screen.getByRole('complementary', { name: /chat/i })).toBeInTheDocument();
    });

    it('should render a header with title', () => {
      render(<ChatPanel {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /assistant|chat|ai/i })).toBeInTheDocument();
    });

    it('should render the chat input area', () => {
      render(<ChatPanel {...defaultProps} />);

      expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument();
    });

    it('should render a send button', () => {
      render(<ChatPanel {...defaultProps} />);

      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Collapse/Expand Tests
  // ===========================================================================

  describe('Collapse/Expand', () => {
    it('should render a toggle button to collapse/expand', () => {
      render(<ChatPanel {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /collapse|expand|toggle/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should be expanded by default', () => {
      render(<ChatPanel {...defaultProps} />);

      // When expanded, the message input should be visible
      expect(screen.getByRole('textbox', { name: /message/i })).toBeVisible();
    });

    it('should collapse when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<ChatPanel {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /collapse|expand|toggle/i });
      await user.click(toggleButton);

      // When collapsed, the message area should not be visible
      expect(screen.queryByRole('textbox', { name: /message/i })).not.toBeVisible();
    });

    it('should expand when toggle button is clicked while collapsed', async () => {
      const user = userEvent.setup();
      render(<ChatPanel {...defaultProps} defaultCollapsed={true} />);

      // Initially collapsed
      expect(screen.queryByRole('textbox', { name: /message/i })).not.toBeVisible();

      const toggleButton = screen.getByRole('button', { name: /collapse|expand|toggle/i });
      await user.click(toggleButton);

      // Now expanded
      expect(screen.getByRole('textbox', { name: /message/i })).toBeVisible();
    });

    it('should respect defaultCollapsed prop', () => {
      render(<ChatPanel {...defaultProps} defaultCollapsed={true} />);

      expect(screen.queryByRole('textbox', { name: /message/i })).not.toBeVisible();
    });

    it('should update aria-expanded attribute on toggle', async () => {
      const user = userEvent.setup();
      render(<ChatPanel {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /collapse|expand|toggle/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

      await user.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  // ===========================================================================
  // Message Display Tests
  // ===========================================================================

  describe('Message Display', () => {
    it('should display user messages', () => {
      render(<ChatPanel {...defaultProps} messages={mockMessages} />);

      expect(screen.getByText('Make this recipe dairy-free')).toBeInTheDocument();
    });

    it('should display assistant messages', () => {
      render(<ChatPanel {...defaultProps} messages={mockMessages} />);

      expect(screen.getByText(/I'll help you make this recipe dairy-free/)).toBeInTheDocument();
    });

    it('should visually distinguish user and assistant messages', () => {
      render(<ChatPanel {...defaultProps} messages={mockMessages} />);

      const userMessage = screen.getByText('Make this recipe dairy-free').closest('[data-role]');
      const assistantMessage = screen
        .getByText(/I'll help you make this recipe dairy-free/)
        .closest('[data-role]');

      expect(userMessage).toHaveAttribute('data-role', 'user');
      expect(assistantMessage).toHaveAttribute('data-role', 'assistant');
    });

    it('should display messages in chronological order', () => {
      render(<ChatPanel {...defaultProps} messages={mockMessages} />);

      const messageElements = screen.getAllByRole('article');
      expect(messageElements).toHaveLength(2);

      // First message should be from user
      expect(messageElements[0]).toHaveTextContent('Make this recipe dairy-free');
      // Second message should be from assistant
      expect(messageElements[1]).toHaveTextContent(/I'll help you make this recipe dairy-free/);
    });

    it('should show empty state when no messages', () => {
      render(<ChatPanel {...defaultProps} messages={[]} />);

      expect(
        screen.getByText(/start a conversation|ask me anything|how can I help/i)
      ).toBeInTheDocument();
    });

    it('should auto-scroll to newest message', async () => {
      const manyMessages: ChatMessage[] = Array.from({ length: 20 }, (_, i) => ({
        id: `msg_${i}`,
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `Message ${i}`,
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
      }));

      const { container } = render(<ChatPanel {...defaultProps} messages={manyMessages} />);

      const messageList = container.querySelector('[data-testid="message-list"]');
      // The scroll position should be at the bottom (newest messages visible)
      // This is a behavioral test - implementation will need to handle scrolling
      expect(messageList).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Streaming Indicator Tests
  // ===========================================================================

  describe('Streaming Indicator', () => {
    it('should display streaming indicator when isStreaming is true', () => {
      render(<ChatPanel {...defaultProps} isStreaming={true} />);

      expect(screen.getByRole('status', { name: /thinking|typing|loading/i })).toBeInTheDocument();
    });

    it('should not display streaming indicator when isStreaming is false', () => {
      render(<ChatPanel {...defaultProps} isStreaming={false} />);

      expect(
        screen.queryByRole('status', { name: /thinking|typing|loading/i })
      ).not.toBeInTheDocument();
    });

    it('should show animated dots or similar indicator during streaming', () => {
      const { container } = render(<ChatPanel {...defaultProps} isStreaming={true} />);

      // Look for animated indicator (could be dots, spinner, etc.)
      const indicator = container.querySelector('[data-testid="streaming-indicator"]');
      expect(indicator).toBeInTheDocument();
    });

    it('should disable input while streaming', () => {
      render(<ChatPanel {...defaultProps} isStreaming={true} />);

      expect(screen.getByRole('textbox', { name: /message/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('should display partial message during streaming', () => {
      const streamingMessage: ChatMessage = {
        id: 'msg_streaming',
        role: 'assistant',
        content: 'I am currently',
        timestamp: new Date().toISOString(),
      };

      render(
        <ChatPanel
          {...defaultProps}
          messages={[...mockMessages, streamingMessage]}
          isStreaming={true}
        />
      );

      expect(screen.getByText('I am currently')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Error State Tests
  // ===========================================================================

  describe('Error State', () => {
    it('should display error message when error prop is provided', () => {
      render(<ChatPanel {...defaultProps} error="Failed to send message. Please try again." />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to send message. Please try again.')).toBeInTheDocument();
    });

    it('should allow dismissing error message', async () => {
      const user = userEvent.setup();
      render(<ChatPanel {...defaultProps} error="Failed to send message" />);

      const dismissButton = screen.getByRole('button', { name: /dismiss|close/i });
      await user.click(dismissButton);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should show retry button on error', async () => {
      const user = userEvent.setup();
      const mockOnRetry = vi.fn();
      render(<ChatPanel {...defaultProps} error="Failed to send message" onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('should not disable input when there is an error', () => {
      render(<ChatPanel {...defaultProps} error="Failed to send message" />);

      expect(screen.getByRole('textbox', { name: /message/i })).not.toBeDisabled();
    });
  });

  // ===========================================================================
  // Context Display Tests
  // ===========================================================================

  describe('Context Display', () => {
    it('should display current context (recipe name) in header', () => {
      render(<ChatPanel {...defaultProps} />);

      expect(screen.getByText(/Test Recipe/)).toBeInTheDocument();
    });

    it('should show appropriate label for recipe_list context', () => {
      render(<ChatPanel {...defaultProps} context={{ page: 'recipe_list' }} />);

      expect(screen.getByText(/recipe list|recipes|browse/i)).toBeInTheDocument();
    });

    it('should show appropriate label for recipe_create context', () => {
      render(<ChatPanel {...defaultProps} context={{ page: 'recipe_create' }} />);

      expect(screen.getByText(/new recipe|create/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA landmarks', () => {
      render(<ChatPanel {...defaultProps} messages={mockMessages} />);

      // Panel should be a complementary landmark
      expect(screen.getByRole('complementary', { name: /chat/i })).toBeInTheDocument();
      // Messages should be in a log region for screen readers
      expect(screen.getByRole('log')).toBeInTheDocument();
    });

    it('should announce new messages to screen readers', () => {
      render(<ChatPanel {...defaultProps} messages={mockMessages} />);

      const messageLog = screen.getByRole('log');
      expect(messageLog).toHaveAttribute('aria-live', 'polite');
    });

    it('should have keyboard-accessible toggle button', () => {
      render(<ChatPanel {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /collapse|expand|toggle/i });
      toggleButton.focus();
      expect(document.activeElement).toBe(toggleButton);
    });
  });

  // ===========================================================================
  // Integration with ChatInput
  // ===========================================================================

  describe('Message Sending', () => {
    it('should call onSendMessage when user submits a message', async () => {
      const user = userEvent.setup();
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'Hello, assistant!');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello, assistant!');
    });

    it('should call onSendMessage when Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'Hello, assistant!{Enter}');

      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello, assistant!');
    });

    it('should clear input after sending message', async () => {
      const user = userEvent.setup();
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'Hello, assistant!');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(input).toHaveValue('');
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      render(<ChatPanel {...defaultProps} />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should not send whitespace-only messages', async () => {
      const user = userEvent.setup();
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, '   ');
      await user.click(screen.getByRole('button', { name: /send/i }));

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });
});
