/**
 * Mock data factories for meal plan tests.
 * Backend returns snake_case; these match real API responses.
 */

export interface MockMealPlanRecipe {
  id: string;
  title: string;
  cook_time_minutes: number;
}

export interface MockMealPlanEntry {
  id: string;
  day_of_week: number; // 0=Monday, 6=Sunday
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  recipe: MockMealPlanRecipe | null;
}

export interface MockMealPlanWeek {
  id: string;
  week_start: string; // ISO date string (Monday)
  entries: MockMealPlanEntry[];
  created_at: string;
  updated_at: string;
}

export const mockMealPlanEntry = (overrides?: Partial<MockMealPlanEntry>): MockMealPlanEntry => ({
  id: 'entry-1',
  day_of_week: 0,
  meal_type: 'breakfast',
  recipe: {
    id: 'r1',
    title: 'Test Meal',
    cook_time_minutes: 20,
  },
  ...overrides,
});

export const mockMealPlanWeek = (overrides?: Partial<MockMealPlanWeek>): MockMealPlanWeek => ({
  id: 'plan-1',
  week_start: '2026-01-26',
  entries: [
    mockMealPlanEntry({
      id: 'entry-1',
      day_of_week: 0,
      meal_type: 'breakfast',
      recipe: { id: 'r1', title: 'Scrambled Eggs', cook_time_minutes: 10 },
    }),
    mockMealPlanEntry({
      id: 'entry-2',
      day_of_week: 2,
      meal_type: 'dinner',
      recipe: { id: 'r2', title: 'Grilled Chicken', cook_time_minutes: 30 },
    }),
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});
