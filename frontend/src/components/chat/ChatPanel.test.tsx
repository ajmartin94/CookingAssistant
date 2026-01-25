import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
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

/**
 * ChatPanel Component Tests
 *
 * These 5 tests cover the core ChatPanel functionality as specified
 * in the Feature 2 revised plan:
 * 1. Renders with input and send button
 * 2. Sending message adds user message to list
 * 3. AI response renders as assistant message
 * 4. Apply button calls onApply with proposed recipe
 * 5. Input disabled during API call
 */
describe('ChatPanel', () => {
  beforeAll(() => {
    server.listen();
    sessionStorage.clear(); // Clear any stale data from previous test files
  });
  afterEach(() => {
    server.resetHandlers();
    mockOnApply.mockClear();
    mockOnClose.mockClear();
    sessionStorage.clear();
  });
  afterAll(() => server.close());

  it('renders with input and send button', () => {
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

  it('Apply button calls onApply with proposed recipe', async () => {
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

  it('input disabled during API call', async () => {
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

  /**
   * Feature 3: Reject Flow Tests
   *
   * These 4 tests cover the reject flow functionality as specified
   * in the Feature 3 revised plan:
   * 1. Reject button dismisses proposal card
   * 2. After reject, currentProposal is null (proposal no longer visible)
   * 3. Form state unchanged after reject
   * 4. Can send new message after rejecting proposal
   */
  describe('Reject Flow', () => {
    it('Reject button dismisses proposal card', async () => {
      const user = userEvent.setup();
      render(<ChatPanel {...defaultProps} />);

      // Send a message that triggers a proposal
      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'create a chicken recipe');
      await user.click(screen.getByRole('button', { name: /send/i }));

      // Wait for proposal to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
      });

      // Click reject
      await user.click(screen.getByRole('button', { name: /reject/i }));

      // Proposal card (with Apply/Reject buttons) should be dismissed
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /apply/i })).not.toBeInTheDocument();
      });
    });

    it('After reject, currentProposal is null (proposal no longer visible)', async () => {
      const user = userEvent.setup();
      render(<ChatPanel {...defaultProps} />);

      // Send a message that triggers a proposal
      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'create a chicken recipe');
      await user.click(screen.getByRole('button', { name: /send/i }));

      // Wait for proposal to appear - the text "Proposed:" indicates an active proposal
      await waitFor(() => {
        expect(screen.getByText(/proposed:/i)).toBeInTheDocument();
      });

      // Click reject
      await user.click(screen.getByRole('button', { name: /reject/i }));

      // After reject, the proposal text should no longer be visible
      await waitFor(() => {
        expect(screen.queryByText(/proposed:/i)).not.toBeInTheDocument();
      });
    });

    it('Form state unchanged after reject', async () => {
      const user = userEvent.setup();
      const onApplySpy = vi.fn();

      // Use custom initial recipe data to verify it remains unchanged
      const initialRecipe = {
        ...DEFAULT_RECIPE_FORM_DATA,
        title: 'Original Recipe Title',
        description: 'Original description',
      };

      render(<ChatPanel {...defaultProps} currentRecipe={initialRecipe} onApply={onApplySpy} />);

      // Send a message that triggers a proposal
      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'create a chicken recipe');
      await user.click(screen.getByRole('button', { name: /send/i }));

      // Wait for proposal to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
      });

      // Click reject instead of apply
      await user.click(screen.getByRole('button', { name: /reject/i }));

      // Verify onApply was never called (form state unchanged)
      expect(onApplySpy).not.toHaveBeenCalled();
    });

    it('Can send new message after rejecting proposal', async () => {
      const user = userEvent.setup();
      render(<ChatPanel {...defaultProps} />);

      // Send first message that triggers a proposal
      const input = screen.getByRole('textbox', { name: /message/i });
      await user.type(input, 'create a chicken recipe');
      await user.click(screen.getByRole('button', { name: /send/i }));

      // Wait for proposal to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
      });

      // Click reject
      await user.click(screen.getByRole('button', { name: /reject/i }));

      // Verify input is enabled and we can type
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /message/i })).not.toBeDisabled();
      });

      // Send a new message
      await user.type(screen.getByRole('textbox', { name: /message/i }), 'hello');
      await user.click(screen.getByRole('button', { name: /send/i }));

      // Verify the new message appears and gets a response
      await waitFor(() => {
        expect(screen.getByText('hello')).toBeInTheDocument();
        expect(screen.getByText(/hello! i can help you with your recipe/i)).toBeInTheDocument();
      });
    });
  });
});
