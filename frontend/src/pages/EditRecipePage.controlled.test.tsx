import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import EditRecipePage from './EditRecipePage';
import { server } from '../test/mocks/server';

/**
 * EditRecipePage Controlled Integration Tests
 *
 * These tests verify that EditRecipePage properly fetches the recipe,
 * manages form state, and passes value/onChange to the controlled RecipeForm.
 *
 * The page should:
 * - Fetch recipe by ID on mount
 * - Initialize form state from fetched recipe data
 * - Pass `value` and `onChange` props to RecipeForm
 * - Pass mode="edit" to RecipeForm
 * - Handle state updates when onChange fires
 */

// Mock navigate and useParams
const mockNavigate = vi.fn();
const mockParams = { id: '1' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

describe('EditRecipePage (Controlled)', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
  });
  afterEach(() => {
    server.resetHandlers();
    mockNavigate.mockClear();
    localStorage.clear();
  });
  afterAll(() => server.close());

  it('fetches recipe, manages state, and passes value/onChange to RecipeForm', async () => {
    const { user } = render(<EditRecipePage />);

    // Wait for loading to complete and form to appear with fetched data
    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText(/homemade margherita pizza/i);
      // The mock backend returns 'Test Recipe' as the title
      expect(titleInput).toHaveValue('Test Recipe');
    });

    // The submit button text should reflect mode="edit" -> "Update Recipe"
    expect(screen.getByRole('button', { name: /update recipe/i })).toBeInTheDocument();

    // Verify the fetched recipe data is passed via value prop to the form
    const descriptionInput = screen.getByPlaceholderText(/brief description/i);
    expect(descriptionInput).toHaveValue('A delicious test recipe');

    // Modify the title - this tests that EditRecipePage manages state via onChange
    const titleInput = screen.getByPlaceholderText(/homemade margherita pizza/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Recipe Title');

    // After typing, the parent-managed state should update and the input reflects it
    await waitFor(() => {
      expect(titleInput).toHaveValue('Updated Recipe Title');
    });
  });
});
