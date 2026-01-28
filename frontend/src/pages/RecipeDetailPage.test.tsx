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
        expect(screen.getByTestId('servings')).toHaveTextContent('4');
        expect(screen.getByText(/servings/i)).toBeInTheDocument();
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
        expect(difficultyBadge).toHaveClass('bg-success', 'text-text-primary');
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

  describe('Servings Adjuster', () => {
    it('should display servings adjuster with +/- buttons', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /decrease servings/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /increase servings/i })).toBeInTheDocument();
      });
    });

    it('should increase servings when + button is clicked', async () => {
      const { user } = render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /increase servings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /increase servings/i }));

      expect(screen.getByTestId('servings-adjuster-value')).toHaveTextContent('5');
    });

    it('should decrease servings when - button is clicked', async () => {
      const { user } = render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /decrease servings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /decrease servings/i }));

      expect(screen.getByTestId('servings-adjuster-value')).toHaveTextContent('3');
    });

    it('should not decrease servings below 1', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(mockBackendRecipe({ servings: 1 }));
        })
      );

      const { user } = render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /decrease servings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /decrease servings/i }));

      expect(screen.getByTestId('servings-adjuster-value')).toHaveTextContent('1');
    });
  });

  describe('Ingredient Checkboxes', () => {
    it('should render ingredients with checkboxes', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should toggle checkbox when ingredient is clicked', async () => {
      const { user } = render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('checkbox').length).toBeGreaterThanOrEqual(1);
      });

      const checkbox = screen.getAllByRole('checkbox')[0];
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should apply visual strikethrough to checked ingredients', async () => {
      const { user } = render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('checkbox').length).toBeGreaterThanOrEqual(1);
      });

      const checkbox = screen.getAllByRole('checkbox')[0];
      await user.click(checkbox);

      const ingredientItem = checkbox.closest('[data-testid="ingredient"]');
      expect(ingredientItem?.className).toMatch(/line-through/);
    });
  });

  describe('Add to Shopping List', () => {
    it('should display "Add to Shopping List" button in ingredients panel', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add to shopping list/i })).toBeInTheDocument();
      });
    });
  });

  describe('Favorite Button', () => {
    it('should display a favorite/heart button in the hero section', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /favorite/i })).toBeInTheDocument();
      });
    });

    it('should place the favorite button in the hero area', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        const favoriteBtn = screen.getByRole('button', { name: /favorite/i });
        const hero = screen.getByTestId('recipe-hero');
        expect(hero.contains(favoriteBtn)).toBe(true);
      });
    });
  });

  describe('Add a Note', () => {
    it('should display "Add a note" button', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add a note/i })).toBeInTheDocument();
      });
    });

    it('should render the "Add a note" button with dashed border styling', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        const addNoteBtn = screen.getByRole('button', { name: /add a note/i });
        expect(addNoteBtn.className).toMatch(/border-dashed/);
      });
    });
  });

  describe('Start Cooking Bar', () => {
    it('should display a fixed "Start Cooking" bar at the bottom', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start cooking/i })).toBeInTheDocument();
      });
    });

    it('should show description text in the Start Cooking bar', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/ready to cook/i)).toBeInTheDocument();
        expect(
          screen.getByText(/guided mode will walk you through each step/i)
        ).toBeInTheDocument();
      });
    });

    it('should have fixed positioning on the Start Cooking bar', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        const bar = screen.getByTestId('start-cooking-bar');
        expect(bar.className).toMatch(/fixed/);
        expect(bar.className).toMatch(/bottom-0/);
      });
    });
  });
});
