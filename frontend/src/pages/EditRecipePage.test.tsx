import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import EditRecipePage from './EditRecipePage';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
// mockRecipe import removed - using inline mock from handler instead

const BASE_URL = 'http://localhost:8000';

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

describe('EditRecipePage', () => {
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

  describe('Loading State', () => {
    it('should show loading spinner while fetching recipe', () => {
      const { container } = render(<EditRecipePage />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('should render the page heading after loading', async () => {
      render(<EditRecipePage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit recipe/i })).toBeInTheDocument();
      });
    });

    it('should render the subtitle', async () => {
      render(<EditRecipePage />);

      await waitFor(() => {
        expect(screen.getByText(/update your recipe details/i)).toBeInTheDocument();
      });
    });

    it('should render Back to Recipe button', async () => {
      render(<EditRecipePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to recipe/i })).toBeInTheDocument();
      });
    });

    it('should render RecipeForm with initial data', async () => {
      render(<EditRecipePage />);

      await waitFor(() => {
        // Check that the form is populated with recipe data by finding the title input
        const titleInput = screen.getByPlaceholderText(/homemade margherita pizza/i);
        expect(titleInput).toHaveValue('Test Recipe');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when recipe fetch fails', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json({ detail: 'Recipe not found' }, { status: 404 });
        })
      );

      render(<EditRecipePage />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should show error when recipe ID is not provided', async () => {
      // Override useParams to return undefined id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(mockParams).id = undefined as any;

      render(<EditRecipePage />);

      await waitFor(() => {
        expect(screen.getByText(/recipe id not provided/i)).toBeInTheDocument();
      });

      // Restore id
      vi.mocked(mockParams).id = '1';
    });

    it('should show Back to Recipes button in error state', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json({ detail: 'Recipe not found' }, { status: 404 });
        })
      );

      render(<EditRecipePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to recipes/i })).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back to recipe detail when Back button is clicked', async () => {
      const { user } = render(<EditRecipePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to recipe/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back to recipe/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/recipes/1');
    });

    it('should navigate back to recipe detail when cancel is clicked', async () => {
      const { user } = render(<EditRecipePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/recipes/1');
    });

    it('should navigate to recipes list when id is missing and cancel is clicked', async () => {
      // Override useParams to return undefined id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(mockParams).id = undefined as any;

      const { user } = render(<EditRecipePage />);

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back to recipes/i });
        user.click(backButton);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/recipes');
      });

      // Restore id
      vi.mocked(mockParams).id = '1';
    });
  });
});
