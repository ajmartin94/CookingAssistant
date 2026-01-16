import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import DashboardPage from './DashboardPage';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockBackendRecipe, mockLibrary } from '../test/mocks/data';

const BASE_URL = 'http://localhost:8000';

describe('DashboardPage', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
  });
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });
  afterAll(() => server.close());

  describe('Stats Cards', () => {
    it('should render stats cards section', async () => {
      render(<DashboardPage />);

      // Wait for stats to load
      await waitFor(() => {
        expect(screen.getByText(/your recipes/i)).toBeInTheDocument();
      });

      // All stats cards should be present - use more specific queries to avoid duplicates
      expect(screen.getByText(/total recipes saved/i)).toBeInTheDocument();
      expect(screen.getByText(/recipe collections/i)).toBeInTheDocument();
      expect(screen.getByText(/meals planned/i)).toBeInTheDocument();
    });

    it('should display total recipe count from API', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [mockBackendRecipe()],
            total: 15,
            page: 1,
            page_size: 1,
            total_pages: 15,
          });
        })
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
      });
    });

    it('should display total library count from API', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/libraries`, () => {
          return HttpResponse.json([
            mockLibrary({ id: 'lib-1', name: 'Library 1' }),
            mockLibrary({ id: 'lib-2', name: 'Library 2' }),
            mockLibrary({ id: 'lib-3', name: 'Library 3' }),
          ]);
        })
      );

      render(<DashboardPage />);

      // Wait for library count to load - use findByText for better async handling
      const libraryCount = await screen.findByText('3');
      expect(libraryCount).toBeInTheDocument();
    });

    it('should show loading state for stats', async () => {
      const { container } = render(<DashboardPage />);

      // Initially should show loading placeholder or skeleton
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Recent Recipes Section', () => {
    it('should render recent recipes heading', async () => {
      render(<DashboardPage />);

      expect(screen.getByText(/recent recipes/i)).toBeInTheDocument();
    });

    it('should display up to 6 recent recipes', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: Array(6)
              .fill(null)
              .map((_, i) =>
                mockBackendRecipe({ id: String(i + 1), title: `Recipe ${i + 1}` })
              ),
            total: 20,
            page: 1,
            page_size: 6,
            total_pages: 4,
          });
        })
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Recipe 1')).toBeInTheDocument();
        expect(screen.getByText('Recipe 6')).toBeInTheDocument();
      });
    });

    it('should show empty state when no recipes exist', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 6,
            total_pages: 0,
          });
        })
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/no recipes yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('should render quick actions section', async () => {
      render(<DashboardPage />);

      expect(screen.getByText(/quick actions/i)).toBeInTheDocument();
    });

    it('should have new recipe link', async () => {
      render(<DashboardPage />);

      const newRecipeLink = screen.getByRole('link', { name: /new recipe/i });
      expect(newRecipeLink).toHaveAttribute('href', '/recipes/create');
    });

    it('should have browse recipes link', async () => {
      render(<DashboardPage />);

      const browseLink = screen.getByRole('link', { name: /browse recipes/i });
      expect(browseLink).toHaveAttribute('href', '/recipes');
    });

    it('should have view libraries link', async () => {
      render(<DashboardPage />);

      const librariesLink = screen.getByRole('link', { name: /view libraries/i });
      expect(librariesLink).toHaveAttribute('href', '/libraries');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
        })
      );

      render(<DashboardPage />);

      await waitFor(() => {
        // Should still render the page structure
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Layout', () => {
    it('should render in a grid layout', async () => {
      const { container } = render(<DashboardPage />);

      await waitFor(() => {
        const grids = container.querySelectorAll('.grid');
        expect(grids.length).toBeGreaterThan(0);
      });
    });
  });
});
