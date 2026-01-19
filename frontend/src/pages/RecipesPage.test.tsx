import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
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
    server.resetHandlers();
    mockNavigate.mockClear();
    localStorage.clear();
  });
  afterAll(() => server.close());

  describe('Rendering', () => {
    it('should render the page heading', async () => {
      render(<RecipesPage />);

      expect(screen.getByRole('heading', { name: /my recipes/i })).toBeInTheDocument();
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
        expect(screen.getByText(/clicking new recipe in the sidebar/i)).toBeInTheDocument();
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

    it('should show sidebar guidance in empty state', async () => {
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
        expect(screen.getByText(/clicking new recipe in the sidebar/i)).toBeInTheDocument();
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
});
