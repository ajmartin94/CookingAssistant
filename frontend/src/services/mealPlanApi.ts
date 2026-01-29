import apiClient from './api';
import type { MealPlan, MealPlanEntry } from '../types/mealPlan';

interface BackendMealPlanResponse {
  id: string;
  week_start: string;
  entries: {
    id: string;
    day_of_week: number;
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    recipe: { id: string; title: string; cook_time_minutes: number } | null;
  }[];
  created_at: string;
  updated_at: string;
}

function transformMealPlan(data: BackendMealPlanResponse): MealPlan {
  return {
    id: data.id,
    weekStart: data.week_start,
    entries: data.entries.map(
      (e): MealPlanEntry => ({
        id: e.id,
        dayOfWeek: e.day_of_week,
        mealType: e.meal_type,
        recipe: e.recipe
          ? {
              id: e.recipe.id,
              title: e.recipe.title,
              cookTimeMinutes: e.recipe.cook_time_minutes,
            }
          : null,
      })
    ),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function fetchCurrentMealPlan(weekStart?: string): Promise<MealPlan> {
  if (weekStart) {
    const response = await apiClient.get<BackendMealPlanResponse>('/api/v1/meal-plans', {
      params: { week_start: weekStart },
    });
    return transformMealPlan(response.data);
  }
  const response = await apiClient.get<BackendMealPlanResponse>('/api/v1/meal-plans/current');
  return transformMealPlan(response.data);
}

export async function upsertMealPlanEntry(
  planId: string,
  data: { date: string; meal_type: string; recipe_id: string }
): Promise<MealPlanEntry> {
  const response = await apiClient.put<{
    id: string;
    day_of_week: number;
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    recipe: { id: string; title: string; cook_time_minutes: number } | null;
  }>(`/api/v1/meal-plans/${planId}/entries`, data);
  const e = response.data;
  return {
    id: e.id,
    dayOfWeek: e.day_of_week,
    mealType: e.meal_type,
    recipe: e.recipe
      ? { id: e.recipe.id, title: e.recipe.title, cookTimeMinutes: e.recipe.cook_time_minutes }
      : null,
  };
}

export async function deleteMealPlanEntry(planId: string, entryId: string): Promise<void> {
  await apiClient.delete(`/api/v1/meal-plans/${planId}/entries/${entryId}`);
}
