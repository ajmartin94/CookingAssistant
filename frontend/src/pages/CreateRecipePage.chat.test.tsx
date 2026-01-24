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

  it('Apply updates parent form state with full replacement', async () => {
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

    // The form should now reflect the AI-suggested recipe data
    await waitFor(() => {
      expect(screen.getByDisplayValue('AI Suggested Recipe')).toBeInTheDocument();
    });
  });

  it('Form reflects applied changes (title, ingredients, instructions all update)', async () => {
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

    // Verify ingredients updated (chicken breast should be in the form)
    expect(screen.getByDisplayValue('chicken breast')).toBeInTheDocument();

    // Verify instructions updated
    expect(screen.getByDisplayValue('Season the chicken')).toBeInTheDocument();
  });
});
