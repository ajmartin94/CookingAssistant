import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, within } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { ChatPanel } from './ChatPanel';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { DEFAULT_RECIPE_FORM_DATA } from '../../types';

const BASE_URL = 'http://localhost:8000';

const mockOnApply = vi.fn();
const mockOnClose = vi.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  currentRecipe: DEFAULT_RECIPE_FORM_DATA,
  onApply: mockOnApply,
};

describe('ChatPanel', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    mockOnApply.mockClear();
    mockOnClose.mockClear();
    sessionStorage.clear();
  });
  afterAll(() => server.close());

  it('renders with input field and send button', () => {
    render(<ChatPanel {...defaultProps} />);

    expect(screen.getByRole('complementary', { name: /ai recipe chat/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('sending message adds user message to list', async () => {
    const user = userEvent.setup();
    render(<ChatPanel {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('AI response renders as assistant message', async () => {
    const user = userEvent.setup();
    render(<ChatPanel {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/hello! i can help you with your recipe/i)).toBeInTheDocument();
    });
  });

  it('ChangeSummary card renders when proposed_recipe is present', async () => {
    const user = userEvent.setup();
    render(<ChatPanel {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'create a chicken recipe');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/ai suggested recipe/i)).toBeInTheDocument();
    });

    // ChangeSummary card should show Apply and Reject buttons
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
  });

  it('Apply button calls onApply with proposed recipe data (camelCase)', async () => {
    const user = userEvent.setup();
    render(<ChatPanel {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'create a chicken recipe');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(mockOnApply).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'AI Suggested Recipe',
        description: 'A recipe suggested by the AI assistant',
        ingredients: [
          { name: 'chicken breast', amount: '2', unit: 'pieces', notes: '' },
          { name: 'olive oil', amount: '2', unit: 'tbsp', notes: '' },
        ],
        instructions: [
          { stepNumber: 1, instruction: 'Season the chicken', durationMinutes: 5 },
          { stepNumber: 2, instruction: 'Cook in olive oil', durationMinutes: 15 },
        ],
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 2,
        cuisineType: 'American',
        dietaryTags: ['high-protein'],
        difficultyLevel: 'easy',
      })
    );
  });

  it('Reject button dismisses the proposal', async () => {
    const user = userEvent.setup();
    render(<ChatPanel {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'create a chicken recipe');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /reject/i }));

    // After rejecting, Apply and Reject buttons should be gone
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /apply/i })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });

  it('input disabled and loading indicator shown during API call', async () => {
    // Delay the response to observe loading state
    server.use(
      http.post(`${BASE_URL}/api/v1/chat`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({
          message: 'Delayed response',
          proposed_recipe: null,
        });
      })
    );

    const user = userEvent.setup();
    render(<ChatPanel {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // During the API call, input should be disabled and loading indicator visible
    expect(screen.getByRole('textbox', { name: /message/i })).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();

    // After response, input should be enabled again
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /message/i })).not.toBeDisabled();
    });
  });

  it('send button disabled when input is empty', () => {
    render(<ChatPanel {...defaultProps} />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('error message renders when API call fails', async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/chat`, () => {
        return HttpResponse.json({ detail: 'Internal server error' }, { status: 500 });
      })
    );

    const user = userEvent.setup();
    render(<ChatPanel {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
  });

  it('chat history loads from sessionStorage on mount', () => {
    const storedMessages = JSON.stringify([
      { role: 'user', content: 'previous question' },
      { role: 'assistant', content: 'previous answer' },
    ]);
    sessionStorage.setItem('chat_history', storedMessages);

    render(<ChatPanel {...defaultProps} />);

    expect(screen.getByText('previous question')).toBeInTheDocument();
    expect(screen.getByText('previous answer')).toBeInTheDocument();
  });

  it('chat history saves to sessionStorage on new message', async () => {
    const user = userEvent.setup();
    render(<ChatPanel {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/hello! i can help you with your recipe/i)).toBeInTheDocument();
    });

    const stored = JSON.parse(sessionStorage.getItem('chat_history') || '[]');
    expect(stored.length).toBeGreaterThanOrEqual(2);
    expect(stored[0]).toMatchObject({ role: 'user', content: 'hello' });
  });

  it('chat history truncates to max 50 messages in sessionStorage', async () => {
    // Pre-fill with 49 messages
    const existingMessages = Array.from({ length: 49 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `message ${i + 1}`,
    }));
    sessionStorage.setItem('chat_history', JSON.stringify(existingMessages));

    const user = userEvent.setup();
    render(<ChatPanel {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/hello! i can help you with your recipe/i)).toBeInTheDocument();
    });

    const stored = JSON.parse(sessionStorage.getItem('chat_history') || '[]');
    expect(stored.length).toBeLessThanOrEqual(50);
  });

  it('ARIA live region announces new AI messages', async () => {
    const user = userEvent.setup();
    render(<ChatPanel {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/hello! i can help you with your recipe/i)).toBeInTheDocument();
    });

    // Verify ARIA live region exists and contains the AI response
    const liveRegion = screen.getByRole('log');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(
      within(liveRegion).getByText(/hello! i can help you with your recipe/i)
    ).toBeInTheDocument();
  });

  it('focus moves to input on panel open', () => {
    render(<ChatPanel {...defaultProps} isOpen={true} />);

    expect(screen.getByRole('textbox', { name: /message/i })).toHaveFocus();
  });
});
