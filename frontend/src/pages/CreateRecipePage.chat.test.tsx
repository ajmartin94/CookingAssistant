import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import CreateRecipePage from './CreateRecipePage';
import { server } from '../test/mocks/server';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * CreateRecipePage Chat Integration Tests
 *
 * These 3 tests cover the integration between ChatPanel and RecipeForm
 * as specified in the Feature 2 revised plan:
 * 1. CreateRecipePage shows chat toggle
 * 2. Apply updates form state with all fields (title, description, ingredients, instructions)
 * 3. After apply, form can be submitted successfully
 */
describe('CreateRecipePage - Chat Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    mockNavigate.mockClear();
    sessionStorage.clear();
  });
  afterAll(() => server.close());

  it('shows chat toggle button', () => {
    render(<CreateRecipePage />);

    expect(screen.getByRole('button', { name: /ai chat/i })).toBeInTheDocument();
  });

  it('Apply updates form state with all fields (title, description, ingredients, instructions)', async () => {
    const user = userEvent.setup();
    render(<CreateRecipePage />);

    // Open chat panel
    await user.click(screen.getByRole('button', { name: /ai chat/i }));

    // Send a message that triggers a proposed recipe
    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'create a chicken recipe');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Wait for AI response with proposal
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    });

    // Apply the proposed recipe
    await user.click(screen.getByRole('button', { name: /apply/i }));

    // Verify title updated
    await waitFor(() => {
      expect(screen.getByDisplayValue('AI Suggested Recipe')).toBeInTheDocument();
    });

    // Verify description updated
    expect(screen.getByDisplayValue('A recipe suggested by the AI assistant')).toBeInTheDocument();

    // Verify ingredients updated (chicken breast should be in the form)
    expect(screen.getByDisplayValue('chicken breast')).toBeInTheDocument();

    // Verify instructions updated
    expect(screen.getByDisplayValue('Season the chicken')).toBeInTheDocument();
  });

  it('After apply, form can be submitted successfully', async () => {
    const user = userEvent.setup();
    render(<CreateRecipePage />);

    // Open chat panel
    await user.click(screen.getByRole('button', { name: /ai chat/i }));

    // Send a message that triggers a proposed recipe
    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'create a chicken recipe');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Wait for AI response with proposal
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    });

    // Apply the proposed recipe
    await user.click(screen.getByRole('button', { name: /apply/i }));

    // Verify form is populated
    await waitFor(() => {
      expect(screen.getByDisplayValue('AI Suggested Recipe')).toBeInTheDocument();
    });

    // Close chat panel to focus on form
    await user.click(screen.getByRole('button', { name: /close chat/i }));

    // Submit the form - it should have all required fields from the AI proposal
    await user.click(screen.getByRole('button', { name: /create recipe/i }));

    // After successful submission, should navigate to the created recipe
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/\/recipes\/.+/));
    });
  });
});
