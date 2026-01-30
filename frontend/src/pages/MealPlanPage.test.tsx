import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import MealPlanPage from './MealPlanPage';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockMealPlanWeek, mockMealPlanEntry } from '../test/mocks/mealPlanData';

const BASE_URL = 'http://localhost:8000';

describe('MealPlanPage', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
  });
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });
  afterAll(() => server.close());

  describe('Layout', () => {
    it('should render 7 days with correct day names', async () => {
      render(<MealPlanPage />);

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
        expect(screen.getByText('Tuesday')).toBeInTheDocument();
        expect(screen.getByText('Wednesday')).toBeInTheDocument();
        expect(screen.getByText('Thursday')).toBeInTheDocument();
        expect(screen.getByText('Friday')).toBeInTheDocument();
        expect(screen.getByText('Saturday')).toBeInTheDocument();
        expect(screen.getByText('Sunday')).toBeInTheDocument();
      });
    });

    it('should show 3 meal slots per day (Breakfast, Lunch, Dinner)', async () => {
      render(<MealPlanPage />);

      await waitFor(() => {
        const breakfastSlots = screen.getAllByText('Breakfast');
        const lunchSlots = screen.getAllByText('Lunch');
        const dinnerSlots = screen.getAllByText('Dinner');

        expect(breakfastSlots).toHaveLength(7);
        expect(lunchSlots).toHaveLength(7);
        expect(dinnerSlots).toHaveLength(7);
      });
    });

    it("should highlight today's column with accent styling", async () => {
      render(<MealPlanPage />);

      await waitFor(() => {
        const todayColumn = screen.getByTestId('day-column-today');
        expect(todayColumn).toBeInTheDocument();
        expect(todayColumn.className).toMatch(/accent|today|highlight/);
      });
    });
  });

  describe('Empty Slots', () => {
    it('should render "+ Add" text with meal type label for empty slots', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans`, () => {
          return HttpResponse.json(mockMealPlanWeek({ entries: [] }));
        })
      );

      render(<MealPlanPage />);

      await waitFor(() => {
        // 7 days * 3 meals = 21 empty slots, each showing "+ Add"
        const addButtons = screen.getAllByText(/\+ Add/);
        expect(addButtons).toHaveLength(21);
      });
    });
  });

  describe('Filled Slots', () => {
    it('should render recipe name and cook time for filled slots', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans`, () => {
          return HttpResponse.json(
            mockMealPlanWeek({
              entries: [
                mockMealPlanEntry({
                  day_of_week: 0,
                  meal_type: 'breakfast',
                  recipe: {
                    id: 'r1',
                    title: 'Scrambled Eggs',
                    cook_time_minutes: 10,
                    servings: 2,
                    difficulty_level: 'easy',
                  },
                }),
              ],
            })
          );
        })
      );

      render(<MealPlanPage />);

      await waitFor(() => {
        expect(screen.getByText('Scrambled Eggs')).toBeInTheDocument();
        expect(screen.getByText(/10 min/)).toBeInTheDocument();
      });
    });

    it('should show "Recipe removed" for slots with null recipe', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans`, () => {
          return HttpResponse.json(
            mockMealPlanWeek({
              entries: [
                mockMealPlanEntry({
                  day_of_week: 0,
                  meal_type: 'breakfast',
                  recipe: null,
                }),
              ],
            })
          );
        })
      );

      render(<MealPlanPage />);

      await waitFor(() => {
        expect(screen.getByText('Recipe removed')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching meal plan', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans`, () => {
          // Delay response to observe loading state
          return new Promise(() => {
            // Never resolve - we just want to see loading
          });
        })
      );

      render(<MealPlanPage />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error state on API failure', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/meal-plans`, () => {
          return HttpResponse.json({ detail: 'Internal server error' }, { status: 500 });
        })
      );

      render(<MealPlanPage />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
