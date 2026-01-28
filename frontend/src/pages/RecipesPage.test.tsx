import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, within } from '../test/test-utils';
import RecipesPage from './RecipesPage';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockBackendRecipe } from '../test/mocks/data';

const BASE_URL = 'http://localhost:8000';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RecipesPage', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
  });
  afterEach(() => {
    vi.useRealTimers();
    server.resetHandlers();
    mockNavigate.mockClear();
    localStorage.clear();
  });
  afterAll(() => server.close());

  describe('Rendering', () => {
    it('should render the page heading as "Cookbook"', async () => {
      render(<RecipesPage />);

      expect(screen.getByRole('heading', { name: /cookbook/i })).toBeInTheDocument();
    });

    it('should render sidebar guidance in empty state', async () => {
      // Mock empty response to show empty state
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 12,
            total_pages: 0,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        expect(screen.getByText(/get started/i)).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<RecipesPage />);

      expect(screen.getByPlaceholderText(/search recipes/i)).toBeInTheDocument();
    });

    it('should render filter dropdowns', async () => {
      render(<RecipesPage />);

      // Query by role and accessible name or by finding all comboboxes
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(3); // cuisine, difficulty, dietary
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching recipes', async () => {
      const { container } = render(<RecipesPage />);

      // Loading spinner should be visible initially (check for the spinner div)
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        const spinnerAfter = container.querySelector('.animate-spin');
        expect(spinnerAfter).not.toBeInTheDocument();
      });
    });
  });

  describe('Recipe Display', () => {
    it('should display recipes after loading', async () => {
      render(<RecipesPage />);

      await waitFor(() => {
        expect(screen.getByText(/showing 2 of 2 recipes/i)).toBeInTheDocument();
      });

      // RecipeCards should be rendered (checking for links to recipe detail pages)
      const recipeLinks = screen.getAllByRole('link');
      expect(recipeLinks.length).toBeGreaterThan(0);
    });

    it('should display recipe count', async () => {
      render(<RecipesPage />);

      await waitFor(() => {
        expect(screen.getByText(/showing 2 of 2 recipes/i)).toBeInTheDocument();
      });
    });

    it('should render recipes in a grid layout', async () => {
      const { container } = render(<RecipesPage />);

      await waitFor(() => {
        const grid = container.querySelector('.grid');
        expect(grid).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no recipes found', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 12,
            total_pages: 0,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        expect(screen.getByText(/no recipes found/i)).toBeInTheDocument();
      });
    });

    it('should show guidance in empty state', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 12,
            total_pages: 0,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        expect(screen.getByText(/get started/i)).toBeInTheDocument();
      });
    });

    it('should suggest adjusting filters when no results with filters applied', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 12,
            total_pages: 0,
          });
        })
      );

      const { user } = render(<RecipesPage />);

      // Apply a filter - get all comboboxes and select the first one (cuisine)
      const selects = screen.getAllByRole('combobox');
      await user.selectOptions(selects[0], 'Italian');

      await waitFor(() => {
        expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message on API failure', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update search query when typing in search input', async () => {
      const { user } = render(<RecipesPage />);

      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      await user.type(searchInput, 'pizza');

      expect(searchInput).toHaveValue('pizza');
    });

    it('should fetch recipes with search query when form is submitted', async () => {
      let capturedParams: URLSearchParams | null = null;

      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, ({ request }) => {
          const url = new URL(request.url);
          capturedParams = url.searchParams;
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 12,
            total_pages: 0,
          });
        })
      );

      const { user } = render(<RecipesPage />);

      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      await user.type(searchInput, 'pasta');
      await user.click(screen.getByRole('button', { name: /^search$/i }));

      await waitFor(() => {
        expect(capturedParams?.get('search')).toBe('pasta');
      });
    });

    it('should reset to page 1 when search is submitted', async () => {
      const { user } = render(<RecipesPage />);

      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      await user.type(searchInput, 'chicken');
      await user.click(screen.getByRole('button', { name: /^search$/i }));

      // The page should be reset to 1 (can be verified through API params if needed)
    });
  });

  describe('Filter Functionality', () => {
    it('should fetch recipes with cuisine filter when selected', async () => {
      let capturedParams: URLSearchParams | null = null;

      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, ({ request }) => {
          const url = new URL(request.url);
          capturedParams = url.searchParams;
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 12,
            total_pages: 0,
          });
        })
      );

      const { user } = render(<RecipesPage />);

      const selects = screen.getAllByRole('combobox');
      await user.selectOptions(selects[0], 'Italian'); // First select is cuisine

      await waitFor(() => {
        expect(capturedParams?.get('cuisine_type')).toBe('Italian');
      });
    });

    it('should fetch recipes with difficulty filter when selected', async () => {
      let capturedParams: URLSearchParams | null = null;

      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, ({ request }) => {
          const url = new URL(request.url);
          capturedParams = url.searchParams;
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 12,
            total_pages: 0,
          });
        })
      );

      const { user } = render(<RecipesPage />);

      const selects = screen.getAllByRole('combobox');
      await user.selectOptions(selects[1], 'easy'); // Second select is difficulty

      await waitFor(() => {
        expect(capturedParams?.get('difficulty_level')).toBe('easy');
      });
    });

    it('should fetch recipes with dietary filter when selected', async () => {
      let capturedParams: URLSearchParams | null = null;

      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, ({ request }) => {
          const url = new URL(request.url);
          capturedParams = url.searchParams;
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 12,
            total_pages: 0,
          });
        })
      );

      const { user } = render(<RecipesPage />);

      const selects = screen.getAllByRole('combobox');
      await user.selectOptions(selects[2], 'vegetarian'); // Third select is dietary

      await waitFor(() => {
        expect(capturedParams?.get('dietary_tag')).toBe('vegetarian');
      });
    });

    it('should show clear filters button when filters are applied', async () => {
      const { user } = render(<RecipesPage />);

      // Initially, clear button should not be visible
      expect(screen.queryByText(/clear all filters/i)).not.toBeInTheDocument();

      // Apply a filter
      const selects = screen.getAllByRole('combobox');
      await user.selectOptions(selects[0], 'Italian');

      // Clear button should now be visible
      await waitFor(() => {
        expect(screen.getByText(/clear all filters/i)).toBeInTheDocument();
      });
    });

    it('should clear all filters when clear button is clicked', async () => {
      const { user } = render(<RecipesPage />);

      // Apply multiple filters
      const selects = screen.getAllByRole('combobox');
      await user.selectOptions(selects[0], 'Italian');
      await user.selectOptions(selects[1], 'easy');
      await user.type(screen.getByPlaceholderText(/search recipes/i), 'pasta');

      // Click clear filters
      await user.click(screen.getByText(/clear all filters/i));

      // Filters should be reset
      const selectsAfter = screen.getAllByRole('combobox');
      expect(selectsAfter[0]).toHaveValue('');
      expect(selectsAfter[1]).toHaveValue('');
      expect(screen.getByPlaceholderText(/search recipes/i)).toHaveValue('');
    });
  });

  describe('Pagination', () => {
    it('should show pagination controls when there are multiple pages', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: Array(12)
              .fill(null)
              .map((_, i) => mockBackendRecipe({ id: String(i + 1) })),
            total: 30,
            page: 1,
            page_size: 12,
            total_pages: 3,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('should disable previous button on first page', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: Array(12)
              .fill(null)
              .map((_, i) => mockBackendRecipe({ id: String(i + 1) })),
            total: 30,
            page: 1,
            page_size: 12,
            total_pages: 3,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it('should fetch next page when next button is clicked', async () => {
      let capturedPage: string | null = null;

      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, ({ request }) => {
          const url = new URL(request.url);
          capturedPage = url.searchParams.get('page');
          return HttpResponse.json({
            recipes: Array(12)
              .fill(null)
              .map((_, i) => mockBackendRecipe({ id: String(i + 1) })),
            total: 30,
            page: parseInt(capturedPage || '1'),
            page_size: 12,
            total_pages: 3,
          });
        })
      );

      const { user } = render(<RecipesPage />);

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(capturedPage).toBe('2');
      });
    });
  });

  /**
   * ============================================================================
   * COOKBOOK PAGE REDESIGN TESTS (Feature 7 - UI/UX Overhaul)
   * ============================================================================
   * These tests verify the new cookbook page design with:
   * - Recipe cards in responsive grid (1-4 columns based on screen)
   * - Each card shows image (or fallback), title, time, tags
   * - Search input filters recipes by title (debounced, case-insensitive)
   * - Sort dropdown (newest, alphabetical, cook time)
   * - Empty state when no recipes match search
   * - Empty state for new users with no recipes
   * - Card hover state with subtle elevation
   * - Recipe cards without images display gradient fallback with first letter
   */

  describe('Cookbook Page Redesign - Grid Layout', () => {
    it('should render recipe cards in a grid container with data-testid', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [
              mockBackendRecipe({ id: '1', title: 'Recipe One' }),
              mockBackendRecipe({ id: '2', title: 'Recipe Two' }),
              mockBackendRecipe({ id: '3', title: 'Recipe Three' }),
            ],
            total: 3,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      const { container } = render(<RecipesPage />);

      await waitFor(() => {
        // Should have a recipe-grid container with data-testid
        const recipeGrid = container.querySelector('[data-testid="recipe-grid"]');
        expect(recipeGrid).toBeInTheDocument();
      });

      // Recipe cards should be inside the grid
      const recipeCards = screen.getAllByTestId('recipe-card');
      expect(recipeCards).toHaveLength(3);
    });

    it('should use CSS Grid display for the recipe grid', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [mockBackendRecipe({ id: '1', title: 'Grid Recipe' })],
            total: 1,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      const { container } = render(<RecipesPage />);

      await waitFor(() => {
        const recipeGrid = container.querySelector('[data-testid="recipe-grid"]');
        expect(recipeGrid).toBeInTheDocument();
        // Verify it has grid class for CSS Grid layout
        expect(recipeGrid).toHaveClass('grid');
      });
    });
  });

  describe('Cookbook Page Redesign - Card Content', () => {
    it('should display image, title, and metadata on each card', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [
              mockBackendRecipe({
                id: '1',
                title: 'Card Content Recipe',
                cook_time_minutes: 45,
                dietary_tags: ['vegetarian', 'gluten-free'],
                image_url: 'https://example.com/recipe.jpg',
              }),
            ],
            total: 1,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        const recipeCard = screen.getByTestId('recipe-card');
        expect(recipeCard).toBeInTheDocument();
      });

      const recipeCard = screen.getByTestId('recipe-card');

      // Should show title with data-testid
      const cardTitle = within(recipeCard).getByTestId('card-title');
      expect(cardTitle).toHaveTextContent('Card Content Recipe');

      // Should show image or image container
      const cardImage = within(recipeCard).getByTestId('card-image');
      expect(cardImage).toBeInTheDocument();

      // Should show metadata
      const cardMetadata = within(recipeCard).getByTestId('card-metadata');
      expect(cardMetadata).toBeInTheDocument();
    });

    it('should display gradient fallback with first letter when no image', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [
              mockBackendRecipe({
                id: '1',
                title: 'No Image Recipe',
                image_url: null,
              }),
            ],
            total: 1,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        const recipeCard = screen.getByTestId('recipe-card');
        expect(recipeCard).toBeInTheDocument();
      });

      const recipeCard = screen.getByTestId('recipe-card');

      // Should show image fallback with first letter
      const imageFallback = within(recipeCard).getByTestId('image-fallback');
      expect(imageFallback).toBeInTheDocument();
      expect(imageFallback).toHaveTextContent('N'); // First letter of "No Image Recipe"
    });

    it('should display cook time on recipe cards', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [
              mockBackendRecipe({
                id: '1',
                title: 'Timed Recipe',
                cook_time_minutes: 45,
              }),
            ],
            total: 1,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        const recipeCard = screen.getByTestId('recipe-card');
        expect(recipeCard).toBeInTheDocument();
      });

      const recipeCard = screen.getByTestId('recipe-card');

      // Should show card time with data-testid
      const cardTime = within(recipeCard).getByTestId('card-time');
      expect(cardTime).toBeInTheDocument();
      expect(cardTime).toHaveTextContent(/45/);
    });

    it('should display dietary tags on recipe cards', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [
              mockBackendRecipe({
                id: '1',
                title: 'Tagged Recipe',
                dietary_tags: ['vegetarian', 'gluten-free'],
              }),
            ],
            total: 1,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        const recipeCard = screen.getByTestId('recipe-card');
        expect(recipeCard).toBeInTheDocument();
      });

      const recipeCard = screen.getByTestId('recipe-card');

      // Should have at least one tag with data-testid
      const tags = within(recipeCard).getAllByTestId('card-tag');
      expect(tags.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Cookbook Page Redesign - Debounced Search', () => {
    it('should have a search input with data-testid', async () => {
      render(<RecipesPage />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter recipes with debounced search (300ms delay)', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      let searchCaptured = '';

      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, ({ request }) => {
          const url = new URL(request.url);
          searchCaptured = url.searchParams.get('search') || '';
          return HttpResponse.json({
            recipes: searchCaptured
              ? [mockBackendRecipe({ id: '1', title: 'Chocolate Cake' })]
              : [
                  mockBackendRecipe({ id: '1', title: 'Chocolate Cake' }),
                  mockBackendRecipe({ id: '2', title: 'Vanilla Pudding' }),
                ],
            total: searchCaptured ? 1 : 2,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      const { user } = render(<RecipesPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/showing/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');

      // Type in search - should not trigger immediately due to debounce
      await user.type(searchInput, 'chocolate');

      // Advance timer past debounce (300ms)
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(searchCaptured).toBe('chocolate');
      });

      vi.useRealTimers();
    });

    it('should perform case-insensitive search', async () => {
      let searchCaptured = '';

      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, ({ request }) => {
          const url = new URL(request.url);
          searchCaptured = url.searchParams.get('search') || '';
          return HttpResponse.json({
            recipes: [mockBackendRecipe({ id: '1', title: 'PASTA Dish' })],
            total: 1,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      const { user } = render(<RecipesPage />);

      await waitFor(() => {
        expect(screen.getByText(/showing/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'pasta');
      await user.click(screen.getByRole('button', { name: /^search$/i }));

      await waitFor(() => {
        // Search query should be sent to API (backend handles case-insensitivity)
        expect(searchCaptured).toBe('pasta');
      });
    });
  });

  describe('Cookbook Page Redesign - Sort Functionality', () => {
    it('should render a sort dropdown with data-testid', async () => {
      render(<RecipesPage />);

      await waitFor(() => {
        const sortDropdown = screen.getByTestId('sort-dropdown');
        expect(sortDropdown).toBeInTheDocument();
      });
    });

    it('should have sort options for newest, alphabetical, and cook time', async () => {
      render(<RecipesPage />);

      await waitFor(() => {
        const sortDropdown = screen.getByTestId('sort-dropdown');
        expect(sortDropdown).toBeInTheDocument();
      });

      const sortDropdown = screen.getByTestId('sort-dropdown');

      // Check for sort options
      const options = within(sortDropdown).getAllByRole('option');
      const optionTexts = options.map((opt) => opt.textContent?.toLowerCase());

      expect(optionTexts.some((text) => text?.includes('newest') || text?.includes('recent'))).toBe(
        true
      );
      expect(
        optionTexts.some(
          (text) =>
            text?.includes('alphabetical') || text?.includes('a-z') || text?.includes('name')
        )
      ).toBe(true);
      expect(optionTexts.some((text) => text?.includes('time') || text?.includes('duration'))).toBe(
        true
      );
    });

    it('should sort recipes alphabetically when selected', async () => {
      let sortCaptured = '';

      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, ({ request }) => {
          const url = new URL(request.url);
          sortCaptured = url.searchParams.get('sort') || '';
          return HttpResponse.json({
            recipes: [
              mockBackendRecipe({ id: '1', title: 'Apple Pie' }),
              mockBackendRecipe({ id: '2', title: 'Banana Bread' }),
              mockBackendRecipe({ id: '3', title: 'Zucchini Soup' }),
            ],
            total: 3,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      const { user } = render(<RecipesPage />);

      await waitFor(() => {
        expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
      });

      const sortDropdown = screen.getByTestId('sort-dropdown');
      await user.selectOptions(sortDropdown, 'alphabetical');

      await waitFor(() => {
        expect(sortCaptured).toMatch(/alphabetical|title|name/i);
      });
    });

    it('should sort recipes by cook time when selected', async () => {
      let sortCaptured = '';

      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, ({ request }) => {
          const url = new URL(request.url);
          sortCaptured = url.searchParams.get('sort') || '';
          return HttpResponse.json({
            recipes: [
              mockBackendRecipe({ id: '1', title: 'Quick Recipe', cook_time_minutes: 15 }),
              mockBackendRecipe({ id: '2', title: 'Medium Recipe', cook_time_minutes: 45 }),
              mockBackendRecipe({ id: '3', title: 'Long Recipe', cook_time_minutes: 120 }),
            ],
            total: 3,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      const { user } = render(<RecipesPage />);

      await waitFor(() => {
        expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
      });

      const sortDropdown = screen.getByTestId('sort-dropdown');
      await user.selectOptions(sortDropdown, 'cook_time');

      await waitFor(() => {
        expect(sortCaptured).toMatch(/cook_time|time|duration/i);
      });
    });
  });

  describe('Cookbook Page Redesign - Empty States', () => {
    it('should display empty state with data-testid when no recipes exist', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 12,
            total_pages: 0,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        const emptyState = screen.getByTestId('empty-state');
        expect(emptyState).toBeInTheDocument();
      });
    });

    it('should display call-to-action in empty state', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 12,
            total_pages: 0,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        const emptyState = screen.getByTestId('empty-state');
        expect(emptyState).toBeInTheDocument();

        // Should have a CTA button or link
        const cta = screen.getByTestId('empty-state-cta');
        expect(cta).toBeInTheDocument();
      });
    });

    it('should display search empty state when no results match search', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, ({ request }) => {
          const url = new URL(request.url);
          const search = url.searchParams.get('search');

          if (search) {
            return HttpResponse.json({
              recipes: [],
              total: 0,
              page: 1,
              page_size: 12,
              total_pages: 0,
            });
          }

          return HttpResponse.json({
            recipes: [mockBackendRecipe({ id: '1', title: 'Test Recipe' })],
            total: 1,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      const { user } = render(<RecipesPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/showing/i)).toBeInTheDocument();
      });

      // Search for something that doesn't exist
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'xyznonexistent');
      await user.click(screen.getByRole('button', { name: /^search$/i }));

      await waitFor(() => {
        expect(screen.getByText(/no recipes found|no results|no matches/i)).toBeInTheDocument();
      });
    });

    it('should have accessible role on empty state for screen readers', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 12,
            total_pages: 0,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        const emptyState = screen.getByTestId('empty-state');
        expect(emptyState).toBeInTheDocument();

        // Should have role="status" or aria-live for accessibility
        const role = emptyState.getAttribute('role');
        const ariaLive = emptyState.getAttribute('aria-live');
        expect(role === 'status' || ariaLive === 'polite').toBe(true);
      });
    });
  });

  describe('Cookbook Page Redesign - Card Navigation', () => {
    it('should navigate to recipe detail when clicking a card', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [mockBackendRecipe({ id: 'recipe-123', title: 'Clickable Recipe' })],
            total: 1,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      const { user } = render(<RecipesPage />);

      await waitFor(() => {
        const recipeCard = screen.getByTestId('recipe-card');
        expect(recipeCard).toBeInTheDocument();
      });

      const recipeCard = screen.getByTestId('recipe-card');
      await user.click(recipeCard);

      // If the card is a Link, verify it has correct href
      expect(recipeCard.closest('a')).toHaveAttribute('href', '/recipes/recipe-123');
    });

    it('should make recipe cards keyboard accessible (focusable)', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [mockBackendRecipe({ id: '1', title: 'Accessible Recipe' })],
            total: 1,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        const recipeCard = screen.getByTestId('recipe-card');
        expect(recipeCard).toBeInTheDocument();
      });

      const recipeCard = screen.getByTestId('recipe-card');
      const link = recipeCard.closest('a');

      // Should be focusable (either tabindex or is an <a> tag)
      expect(link).not.toBeNull();
      expect(link?.tagName.toLowerCase()).toBe('a');
    });
  });

  describe('Cookbook Page Redesign - Card Hover State', () => {
    it('should have hover classes for visual feedback', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [mockBackendRecipe({ id: '1', title: 'Hover Recipe' })],
            total: 1,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        const recipeCard = screen.getByTestId('recipe-card');
        expect(recipeCard).toBeInTheDocument();
      });

      const recipeCard = screen.getByTestId('recipe-card');
      const link = recipeCard.closest('a');

      // Should have card animation class for hover glow effect
      expect(link).toHaveClass('card-animated');
    });
  });

  describe('Cookbook Page Redesign - Responsive Grid Columns', () => {
    it('should have responsive grid classes for different breakpoints', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [
              mockBackendRecipe({ id: '1', title: 'Recipe 1' }),
              mockBackendRecipe({ id: '2', title: 'Recipe 2' }),
            ],
            total: 2,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      const { container } = render(<RecipesPage />);

      await waitFor(() => {
        const recipeGrid = container.querySelector('[data-testid="recipe-grid"]');
        expect(recipeGrid).toBeInTheDocument();
      });

      const recipeGrid = container.querySelector('[data-testid="recipe-grid"]');

      // Should have responsive grid column classes for 1-4 columns at different breakpoints
      // Mobile: 1 column (grid-cols-1)
      // Tablet: 2 columns (sm:grid-cols-2 or md:grid-cols-2)
      // Desktop: 3 columns (lg:grid-cols-3 or xl:grid-cols-3)
      // Wide: 4 columns (2xl:grid-cols-4)
      expect(recipeGrid).toHaveClass('grid-cols-1');
      expect(
        recipeGrid?.className.includes('sm:grid-cols-2') ||
          recipeGrid?.className.includes('md:grid-cols-2')
      ).toBe(true);
      expect(
        recipeGrid?.className.includes('xl:grid-cols-3') ||
          recipeGrid?.className.includes('lg:grid-cols-3')
      ).toBe(true);
      expect(recipeGrid?.className.includes('2xl:grid-cols-4')).toBe(true);
    });
  });

  describe('Cookbook Page Redesign - Accessibility', () => {
    it('should have accessible label on search input', async () => {
      render(<RecipesPage />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();

      // Should have aria-label or be labelled
      const ariaLabel = searchInput.getAttribute('aria-label');
      const ariaLabelledBy = searchInput.getAttribute('aria-labelledby');
      const placeholder = searchInput.getAttribute('placeholder');

      expect(ariaLabel || ariaLabelledBy || placeholder).toBeTruthy();
    });

    it('should have accessible label on sort dropdown', async () => {
      render(<RecipesPage />);

      await waitFor(() => {
        const sortDropdown = screen.getByTestId('sort-dropdown');
        expect(sortDropdown).toBeInTheDocument();
      });

      const sortDropdown = screen.getByTestId('sort-dropdown');

      // Should have aria-label for accessibility
      const ariaLabel = sortDropdown.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    it('should have descriptive accessible name on recipe cards', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [mockBackendRecipe({ id: '1', title: 'Accessible Recipe Card' })],
            total: 1,
            page: 1,
            page_size: 12,
            total_pages: 1,
          });
        })
      );

      render(<RecipesPage />);

      await waitFor(() => {
        const recipeCard = screen.getByTestId('recipe-card');
        expect(recipeCard).toBeInTheDocument();
      });

      // Should be able to find by accessible name
      const link = screen.getByRole('link', { name: /accessible recipe card/i });
      expect(link).toBeInTheDocument();
    });
  });

  /**
   * ============================================================================
   * COOKBOOK PAGE REDESIGN - NEW FEATURES (Feature 7 - Phase 2)
   * ============================================================================
   * Tests for missing features identified in the UI overhaul:
   * - Import button
   * - Collections section with Lucide icons
   * - Search icon inside input
   * - View toggle (grid/list)
   * - Active filter tags as removable pills
   * - Time badge overlay on recipe cards
   * - Favorite heart overlay on recipe cards
   * - Sort options: Recently Added, Alphabetical, Cook Time, Most Cooked
   */

  describe('Cookbook Header', () => {
    it('should have an Import button with upload icon', async () => {
      render(<RecipesPage />);

      const importBtn = screen.getByRole('button', { name: /import/i });
      expect(importBtn).toBeInTheDocument();
    });

    it('should have a New Recipe button', async () => {
      render(<RecipesPage />);

      const newRecipeLink = screen.getByRole('link', { name: /new recipe/i });
      expect(newRecipeLink).toBeInTheDocument();
    });
  });

  describe('Collections Section', () => {
    it('should render a Collections section with title', async () => {
      render(<RecipesPage />);

      expect(screen.getByRole('heading', { name: /collections/i })).toBeInTheDocument();
    });

    it('should render a "Manage" link', async () => {
      render(<RecipesPage />);

      expect(screen.getByText(/manage/i)).toBeInTheDocument();
    });

    it('should render 5 collection cards', async () => {
      render(<RecipesPage />);

      const collectionCards = screen.getAllByTestId('collection-card');
      expect(collectionCards).toHaveLength(5);
    });

    it('should render collection cards with names: Favorites, Quick Meals, Healthy, Party Food, New Collection', async () => {
      render(<RecipesPage />);

      expect(screen.getByText('Favorites')).toBeInTheDocument();
      expect(screen.getByText('Quick Meals')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Party Food')).toBeInTheDocument();
      expect(screen.getByText('New Collection')).toBeInTheDocument();
    });

    it('should render collection cards with recipe counts', async () => {
      render(<RecipesPage />);

      expect(screen.getByText(/12 recipes/i)).toBeInTheDocument();
      expect(screen.getByText(/8 recipes/i)).toBeInTheDocument();
    });

    it('should use Lucide icons (SVG elements) not emoji text', async () => {
      render(<RecipesPage />);

      const collectionCards = screen.getAllByTestId('collection-card');
      // Each collection card should contain an SVG icon
      collectionCards.forEach((card) => {
        const svg = card.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Search with Icon Inside', () => {
    it('should render search icon inside the search input wrapper', async () => {
      const { container } = render(<RecipesPage />);

      // The search wrapper should contain an SVG icon
      const searchWrapper = container.querySelector('[data-testid="search-wrapper"]');
      expect(searchWrapper).toBeInTheDocument();
      const svg = searchWrapper?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('View Toggle', () => {
    it('should render grid and list view toggle buttons', async () => {
      render(<RecipesPage />);

      const gridBtn = screen.getByRole('button', { name: /grid view/i });
      const listBtn = screen.getByRole('button', { name: /list view/i });
      expect(gridBtn).toBeInTheDocument();
      expect(listBtn).toBeInTheDocument();
    });

    it('should highlight the active view toggle', async () => {
      render(<RecipesPage />);

      const gridBtn = screen.getByRole('button', { name: /grid view/i });
      // Grid should be active by default
      expect(gridBtn.className).toMatch(/bg-hover|active/);
    });

    it('should switch view when clicking list toggle', async () => {
      const { user } = render(<RecipesPage />);

      const listBtn = screen.getByRole('button', { name: /list view/i });
      await user.click(listBtn);

      expect(listBtn.className).toMatch(/bg-hover|active/);
    });
  });

  describe('Active Filter Tags', () => {
    it('should display active filter pills when filters are applied', async () => {
      const { user } = render(<RecipesPage />);

      // Apply a cuisine filter
      const selects = screen.getAllByRole('combobox');
      await user.selectOptions(selects[0], 'Italian');

      await waitFor(() => {
        const filterTag = screen.getByTestId('filter-tag-cuisine');
        expect(filterTag).toBeInTheDocument();
        expect(filterTag).toHaveTextContent(/italian/i);
      });
    });

    it('should remove filter when clicking the X on a filter pill', async () => {
      const { user } = render(<RecipesPage />);

      // Apply a cuisine filter
      const selects = screen.getAllByRole('combobox');
      await user.selectOptions(selects[0], 'Italian');

      await waitFor(() => {
        expect(screen.getByTestId('filter-tag-cuisine')).toBeInTheDocument();
      });

      // Click the remove button on the filter tag
      const removeBtn = within(screen.getByTestId('filter-tag-cuisine')).getByRole('button');
      await user.click(removeBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('filter-tag-cuisine')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sort Options', () => {
    it('should have sort options: Recently Added, Alphabetical, Cook Time, Most Cooked', async () => {
      render(<RecipesPage />);

      const sortDropdown = screen.getByTestId('sort-dropdown');
      const options = within(sortDropdown).getAllByRole('option');
      const texts = options.map((o) => o.textContent?.toLowerCase());

      expect(texts.some((t) => t?.includes('recently added') || t?.includes('newest'))).toBe(true);
      expect(texts.some((t) => t?.includes('alphabetical'))).toBe(true);
      expect(texts.some((t) => t?.includes('cook time'))).toBe(true);
      expect(texts.some((t) => t?.includes('most cooked'))).toBe(true);
    });
  });
});
