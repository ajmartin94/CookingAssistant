import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import RecipeDetailPage from './RecipeDetailPage';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockBackendRecipe } from '../test/mocks/data';

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

// Mock window.confirm
global.confirm = vi.fn(() => true);

describe('RecipeDetailPage', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.confirm as any).mockClear();
  });
  afterEach(() => {
    server.resetHandlers();
    mockNavigate.mockClear();
    localStorage.clear();
  });
  afterAll(() => server.close());

  describe('Loading State', () => {
    it('should show loading spinner while fetching recipe', () => {
      const { container } = render(<RecipeDetailPage />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Recipe Display', () => {
    it('should display recipe title', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /test recipe/i })).toBeInTheDocument();
      });
    });

    it('should display recipe description', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/a delicious test recipe/i)).toBeInTheDocument();
      });
    });

    it('should display prep, cook, and total time', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        // Time values are in spans with data-testid attributes (from mockRecipe)
        expect(screen.getByTestId('prep-time')).toHaveTextContent('10');
        expect(screen.getByTestId('cook-time')).toHaveTextContent('30');
        expect(screen.getByTestId('total-time')).toHaveTextContent('40');
      });
    });

    it('should display servings', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/4 servings/i)).toBeInTheDocument();
      });
    });

    it('should display cuisine type', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/american/i)).toBeInTheDocument(); // mockRecipe has cuisineType: 'American'
      });
    });

    it('should display difficulty level with correct styling', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        const difficultyBadge = screen.getByText(/easy/i); // mockRecipe has difficultyLevel: 'easy'
        expect(difficultyBadge).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    it('should display dietary tags', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/vegetarian/i)).toBeInTheDocument();
      });
    });

    it('should display ingredients list', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /^ingredients$/i })).toBeInTheDocument();
        expect(screen.getByText(/flour/i)).toBeInTheDocument();
      });
    });

    it('should display instructions', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /^instructions$/i })).toBeInTheDocument();
        expect(screen.getByText(/mix ingredients/i)).toBeInTheDocument();
      });
    });

    it('should display recipe image when available', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({ image_url: 'https://example.com/recipe.jpg' })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const image = screen.getByAltText(/test recipe/i);
        expect(image).toHaveAttribute('src', 'https://example.com/recipe.jpg');
      });
    });

    it('should display notes when available', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({ notes: 'These are some notes about the recipe' })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /notes/i })).toBeInTheDocument();
        expect(screen.getByText(/these are some notes/i)).toBeInTheDocument();
      });
    });

    it('should display source information when available', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              source_name: 'Recipe Website',
              source_url: 'https://example.com/recipe',
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /source/i })).toBeInTheDocument();
        expect(screen.getByText(/recipe website/i)).toBeInTheDocument();
        expect(screen.getByText(/view original recipe/i)).toHaveAttribute(
          'href',
          'https://example.com/recipe'
        );
      });
    });
  });

  describe('Owner Actions', () => {
    it('should show edit and delete buttons for owner', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });
    });

    it('should navigate to edit page when edit button is clicked', async () => {
      const { user } = render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/recipes/1/edit');
    });

    it('should show confirmation dialog when delete button is clicked', async () => {
      const { user } = render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(global.confirm).toHaveBeenCalled();
    });

    it('should delete recipe and navigate to recipes list on confirmed deletion', async () => {
      const { user } = render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/recipes');
      });
    });

    it('should not delete recipe when deletion is cancelled', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.confirm as any).mockReturnValueOnce(false);

      const { user } = render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when recipe fetch fails', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json({ detail: 'Recipe not found' }, { status: 404 });
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should show Back to Recipes button in error state', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json({ detail: 'Recipe not found' }, { status: 404 });
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to recipes/i })).toBeInTheDocument();
      });
    });

    it('should display error when deletion fails', async () => {
      server.use(
        http.delete(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json({ detail: 'Failed to delete recipe' }, { status: 500 });
        })
      );

      const { user } = render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back to recipes page when Back button is clicked', async () => {
      const { user } = render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to recipes/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back to recipes/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/recipes');
    });
  });
});
