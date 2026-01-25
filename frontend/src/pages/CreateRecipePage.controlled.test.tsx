import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import CreateRecipePage from './CreateRecipePage';
import { server } from '../test/mocks/server';

/**
 * CreateRecipePage Controlled Integration Tests
 *
 * These tests verify that CreateRecipePage properly manages form state
 * and passes value/onChange to the controlled RecipeForm component.
 *
 * The page should:
 * - Initialize form state with DEFAULT_RECIPE_FORM_DATA
 * - Pass `value` and `onChange` props to RecipeForm
 * - Pass mode="create" to RecipeForm
 * - Handle state updates when onChange fires
 */

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreateRecipePage (Controlled)', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    mockNavigate.mockClear();
  });
  afterAll(() => server.close());

  it('manages state and passes value/onChange to RecipeForm', async () => {
    const { user } = render(<CreateRecipePage />);

    // Page should render with the controlled RecipeForm in create mode
    // The submit button text should reflect mode="create" -> "Create Recipe"
    expect(screen.getByRole('button', { name: /create recipe/i })).toBeInTheDocument();

    // Verify the form starts with default empty state
    const titleInput = screen.getByPlaceholderText(/homemade margherita pizza/i);
    expect(titleInput).toHaveValue('');

    // Type into title - this tests that CreateRecipePage manages the state
    // and passes it back to RecipeForm via the value prop
    await user.type(titleInput, 'New Recipe Title');

    // After typing, the input should reflect the parent-managed state
    await waitFor(() => {
      expect(titleInput).toHaveValue('New Recipe Title');
    });

    // The page should also manage description state
    const descriptionInput = screen.getByPlaceholderText(/brief description/i);
    await user.type(descriptionInput, 'My new recipe');

    await waitFor(() => {
      expect(descriptionInput).toHaveValue('My new recipe');
    });
  });
});
