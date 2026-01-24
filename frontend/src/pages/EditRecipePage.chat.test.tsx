import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import EditRecipePage from './EditRecipePage';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:8000';

// Mock navigate and useParams
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

describe('EditRecipePage - Chat Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    mockNavigate.mockClear();
    sessionStorage.clear();
  });
  afterAll(() => server.close());

  it('shows chat toggle button', async () => {
    render(<EditRecipePage />);

    // Wait for recipe to load first
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit recipe/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /ai chat/i })).toBeInTheDocument();
  });

  it('after Apply, next chat message includes the updated recipe state', async () => {
    // Track the chat API requests to verify the recipe state is sent
    let lastChatRequest: { current_recipe?: Record<string, unknown> } | null = null;

    server.use(
      http.post(`${BASE_URL}/api/v1/chat`, async ({ request }) => {
        const body = (await request.json()) as {
          messages: { role: string; content: string }[];
          current_recipe?: Record<string, unknown>;
        };
        lastChatRequest = body;
        const lastMessage = body.messages[body.messages.length - 1];

        if (lastMessage?.content.toLowerCase().includes('create')) {
          return HttpResponse.json({
            message: 'Here is a recipe suggestion.',
            proposed_recipe: {
              title: 'Updated AI Recipe',
              description: 'An updated recipe',
              ingredients: [{ name: 'tofu', amount: '1', unit: 'block', notes: '' }],
              instructions: [
                { step_number: 1, instruction: 'Press the tofu', duration_minutes: 10 },
              ],
              prep_time_minutes: 15,
              cook_time_minutes: 25,
              servings: 3,
              cuisine_type: 'Asian',
              dietary_tags: ['vegan'],
              difficulty_level: 'medium',
            },
          });
        }

        return HttpResponse.json({
          message: 'Got it, working with your updated recipe.',
          proposed_recipe: null,
        });
      })
    );

    const user = userEvent.setup();
    render(<EditRecipePage />);

    // Wait for recipe to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit recipe/i })).toBeInTheDocument();
    });

    // Open chat panel
    await user.click(screen.getByRole('button', { name: /ai chat/i }));

    // Send a message to get a proposed recipe
    const input = screen.getByRole('textbox', { name: /message/i });
    await user.type(input, 'create a tofu recipe');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Wait for proposal
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    });

    // Apply the proposal
    await user.click(screen.getByRole('button', { name: /apply/i }));

    // Now send another message - the current_recipe in the request should be the updated one
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /message/i })).not.toBeDisabled();
    });

    const inputAfterApply = screen.getByRole('textbox', { name: /message/i });
    await user.type(inputAfterApply, 'what else can I do with this?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/got it, working with your updated recipe/i)).toBeInTheDocument();
    });

    // The last chat request should include the updated recipe state
    expect(lastChatRequest?.current_recipe).toMatchObject({
      title: 'Updated AI Recipe',
    });
  });
});
