/**
 * Tests for Home Page - Real Meal Plan Data (Story 3, Issue #38)
 *
 * Verifies that the home page fetches and displays real meal plan data
 * from the API instead of hardcoded placeholder data.
 *
 * These tests MUST FAIL against the current codebase (TDD RED phase)
 * because HomePage currently uses hardcoded data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import HomePage from './HomePage';

const BASE_URL = 'http://localhost:8000';

// Mock the auth context to return an authenticated user
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'testuser', email: 'test@example.com' },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Helper: get the Monday of the current week (ISO week starts Monday)
function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

// Helper: get today's day_of_week (0=Monday ... 6=Sunday)
function getTodayDayOfWeek(): number {
  const jsDay = new Date().getDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Factory for a meal plan API response with entries (snake_case, matching real backend)
function buildMealPlanResponse(
  entries: Array<{
    id: string;
    day_of_week: number;
    meal_type: string;
    recipe: {
      id: string;
      title: string;
      cook_time_minutes: number;
      servings: number;
      difficulty_level: string;
    } | null;
  }>
) {
  return {
    id: 'plan-current',
    week_start: getCurrentWeekMonday(),
    entries,
    created_at: '2026-01-26T00:00:00Z',
    updated_at: '2026-01-26T00:00:00Z',
  };
}

describe('HomePage - Real Meal Plan Data', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('1024'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Tonight's Dinner - API data", () => {
    it('should display recipe name, cook time, servings, and difficulty from API', async () => {
      const todayDow = getTodayDayOfWeek();

      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans/current`, () => {
          return HttpResponse.json(
            buildMealPlanResponse([
              {
                id: 'entry-tonight',
                day_of_week: todayDow,
                meal_type: 'dinner',
                recipe: {
                  id: 'r-salmon',
                  title: 'Teriyaki Salmon',
                  cook_time_minutes: 25,
                  servings: 2,
                  difficulty_level: 'medium',
                },
              },
            ])
          );
        })
      );

      render(<HomePage />);

      // Should show the recipe name from the API, not hardcoded "Honey Garlic Salmon"
      await waitFor(() => {
        expect(screen.getByText('Teriyaki Salmon')).toBeInTheDocument();
      });

      // Should show the cook time from the API
      expect(screen.getByText(/25 min/)).toBeInTheDocument();

      // Should show servings from the API
      expect(screen.getByText(/2 servings/)).toBeInTheDocument();

      // Should show difficulty from the API
      expect(screen.getByText(/medium/i)).toBeInTheDocument();
    });

    it('should show empty state when no dinner is planned for today', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans/current`, () => {
          return HttpResponse.json(
            buildMealPlanResponse([
              {
                id: 'entry-breakfast',
                day_of_week: getTodayDayOfWeek(),
                meal_type: 'breakfast',
                recipe: {
                  id: 'r-eggs',
                  title: 'Scrambled Eggs',
                  cook_time_minutes: 10,
                  servings: 2,
                  difficulty_level: 'easy',
                },
              },
            ])
          );
        })
      );

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText(/no dinner planned/i)).toBeInTheDocument();
      });

      // Should have a link to the meal plan page
      const planLink = screen.getByRole('link', { name: /meal plan|plan dinner/i });
      expect(planLink).toHaveAttribute('href', expect.stringContaining('/planning'));
    });

    it('should handle null recipe (entry exists but recipe was deleted)', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans/current`, () => {
          return HttpResponse.json(
            buildMealPlanResponse([
              {
                id: 'entry-deleted',
                day_of_week: getTodayDayOfWeek(),
                meal_type: 'dinner',
                recipe: null,
              },
            ])
          );
        })
      );

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText(/no dinner planned/i)).toBeInTheDocument();
      });
    });
  });

  describe('This Week - 5-day rolling window', () => {
    it('should show 5 days with correct recipe names from API', async () => {
      const todayDow = getTodayDayOfWeek();

      // Build entries for today and the next 4 days
      const entries = [
        {
          id: 'e1',
          day_of_week: todayDow,
          meal_type: 'dinner' as const,
          recipe: {
            id: 'r1',
            title: 'Pasta Bolognese',
            cook_time_minutes: 45,
            servings: 4,
            difficulty_level: 'medium',
          },
        },
        {
          id: 'e2',
          day_of_week: (todayDow + 1) % 7,
          meal_type: 'dinner' as const,
          recipe: {
            id: 'r2',
            title: 'Chicken Stir Fry',
            cook_time_minutes: 20,
            servings: 3,
            difficulty_level: 'easy',
          },
        },
        {
          id: 'e3',
          day_of_week: (todayDow + 2) % 7,
          meal_type: 'dinner' as const,
          recipe: {
            id: 'r3',
            title: 'Beef Tacos',
            cook_time_minutes: 30,
            servings: 4,
            difficulty_level: 'easy',
          },
        },
      ];

      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans/current`, () => {
          return HttpResponse.json(buildMealPlanResponse(entries));
        })
      );

      render(<HomePage />);

      // Should show recipe names from the API
      await waitFor(() => {
        expect(screen.getByText('Pasta Bolognese')).toBeInTheDocument();
      });
      expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
      expect(screen.getByText('Beef Tacos')).toBeInTheDocument();
    });

    it('should show "Not planned" for days without a dinner entry', async () => {
      // Only one dinner entry for today, so days +1 through +4 have no dinner
      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans/current`, () => {
          return HttpResponse.json(
            buildMealPlanResponse([
              {
                id: 'e-only',
                day_of_week: getTodayDayOfWeek(),
                meal_type: 'dinner',
                recipe: {
                  id: 'r1',
                  title: 'Grilled Chicken',
                  cook_time_minutes: 30,
                  servings: 4,
                  difficulty_level: 'easy',
                },
              },
            ])
          );
        })
      );

      render(<HomePage />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
      });

      // The other 4 days should show "Not planned"
      const notPlannedItems = screen.getAllByText(/not planned/i);
      expect(notPlannedItems.length).toBe(4);
    });
  });

  describe('Loading state', () => {
    it('should show skeleton loaders while meal plan data is loading', async () => {
      // Delay the response to observe loading state
      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans/current`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return HttpResponse.json(
            buildMealPlanResponse([
              {
                id: 'e1',
                day_of_week: getTodayDayOfWeek(),
                meal_type: 'dinner',
                recipe: {
                  id: 'r1',
                  title: 'Slow Response Recipe',
                  cook_time_minutes: 30,
                  servings: 4,
                  difficulty_level: 'easy',
                },
              },
            ])
          );
        })
      );

      render(<HomePage />);

      // Should show skeleton loaders immediately (before data arrives)
      // The hardcoded "Honey Garlic Salmon" should NOT appear
      expect(screen.queryByText('Honey Garlic Salmon')).not.toBeInTheDocument();

      // Skeleton loaders should be present
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);

      // After data loads, skeletons disappear and real content shows
      await waitFor(() => {
        expect(screen.getByText('Slow Response Recipe')).toBeInTheDocument();
      });
      expect(screen.queryAllByTestId(/skeleton/i)).toHaveLength(0);
    });
  });

  describe('Error state', () => {
    it("should show error message in Tonight's Dinner card when API fails", async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans/current`, () => {
          return HttpResponse.json({ detail: 'Internal server error' }, { status: 500 });
        })
      );

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText(/couldn.t load|error|failed to load/i)).toBeInTheDocument();
      });

      // Should NOT show hardcoded placeholder data
      expect(screen.queryByText('Honey Garlic Salmon')).not.toBeInTheDocument();
    });
  });
});
