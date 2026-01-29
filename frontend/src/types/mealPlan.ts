export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface MealPlanRecipe {
  id: string;
  title: string;
  cookTimeMinutes: number;
}

export interface MealPlanEntry {
  id: string;
  dayOfWeek: number;
  mealType: MealType;
  recipe: MealPlanRecipe | null;
}

export interface MealPlan {
  id: string;
  weekStart: string;
  entries: MealPlanEntry[];
  createdAt: string;
  updatedAt: string;
}
