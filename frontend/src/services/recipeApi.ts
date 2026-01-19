/**
 * Recipe API Client
 *
 * API functions for recipe CRUD operations
 */

import apiClient from './api';
import type { Recipe, RecipeFormData, Ingredient, Instruction } from '../types';

export interface RecipeListParams {
  library_id?: string;
  cuisine_type?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  dietary_tag?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface RecipeListResponse {
  data: Recipe[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Backend response types (snake_case)
interface BackendRecipeListResponse {
  recipes: BackendRecipe[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface BackendIngredient {
  name: string;
  amount: string;
  unit: string;
  notes?: string;
}

interface BackendInstruction {
  step_number: number;
  instruction: string;
  duration_minutes?: number;
}

interface BackendRecipe {
  id: string;
  title: string;
  description: string;
  ingredients: BackendIngredient[];
  instructions: BackendInstruction[];
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  servings: number;
  cuisine_type: string;
  dietary_tags: string[];
  difficulty_level: 'easy' | 'medium' | 'hard';
  source_url?: string;
  source_name?: string;
  notes?: string;
  image_url?: string;
  owner_id: string;
  library_id?: string;
  created_at: string;
  updated_at: string;
}

// Transform frontend form data to backend format for API requests
const transformFormToBackend = (data: RecipeFormData) => ({
  title: data.title,
  description: data.description,
  ingredients: data.ingredients.map((ing) => ({
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    notes: ing.notes,
  })),
  instructions: data.instructions.map((inst) => ({
    step_number: inst.stepNumber,
    instruction: inst.instruction,
    duration_minutes: inst.durationMinutes,
  })),
  prep_time_minutes: data.prepTimeMinutes,
  cook_time_minutes: data.cookTimeMinutes,
  servings: data.servings,
  cuisine_type: data.cuisineType,
  dietary_tags: data.dietaryTags,
  difficulty_level: data.difficultyLevel,
  source_url: data.sourceUrl,
  source_name: data.sourceName,
  notes: data.notes,
});

// Transform backend recipe to frontend recipe
const transformRecipe = (backend: BackendRecipe): Recipe => ({
  id: backend.id,
  title: backend.title,
  description: backend.description,
  ingredients: backend.ingredients.map(
    (ing): Ingredient => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      notes: ing.notes,
    })
  ),
  instructions: backend.instructions.map(
    (inst): Instruction => ({
      stepNumber: inst.step_number,
      instruction: inst.instruction,
      durationMinutes: inst.duration_minutes,
    })
  ),
  prepTimeMinutes: backend.prep_time_minutes,
  cookTimeMinutes: backend.cook_time_minutes,
  totalTimeMinutes: backend.total_time_minutes,
  servings: backend.servings,
  cuisineType: backend.cuisine_type,
  dietaryTags: backend.dietary_tags,
  difficultyLevel: backend.difficulty_level,
  sourceUrl: backend.source_url,
  sourceName: backend.source_name,
  notes: backend.notes,
  imageUrl: backend.image_url,
  ownerId: backend.owner_id,
  libraryId: backend.library_id,
  createdAt: backend.created_at,
  updatedAt: backend.updated_at,
});

/**
 * Get list of recipes with optional filters
 */
export const getRecipes = async (params?: RecipeListParams): Promise<RecipeListResponse> => {
  const response = await apiClient.get<BackendRecipeListResponse>('/api/v1/recipes', { params });
  const backend = response.data;
  return {
    data: backend.recipes.map(transformRecipe),
    total: backend.total,
    page: backend.page,
    pageSize: backend.page_size,
    totalPages: backend.total_pages,
  };
};

/**
 * Get a single recipe by ID
 */
export const getRecipe = async (recipeId: string): Promise<Recipe> => {
  const response = await apiClient.get<BackendRecipe>(`/api/v1/recipes/${recipeId}`);
  return transformRecipe(response.data);
};

/**
 * Create a new recipe
 */
export const createRecipe = async (data: RecipeFormData): Promise<Recipe> => {
  const backendData = transformFormToBackend(data);
  const response = await apiClient.post<BackendRecipe>('/api/v1/recipes', backendData);
  return transformRecipe(response.data);
};

/**
 * Update an existing recipe
 */
export const updateRecipe = async (
  recipeId: string,
  data: Partial<RecipeFormData>
): Promise<Recipe> => {
  // Transform partial data to backend format
  const backendData: Record<string, unknown> = {};
  if (data.title !== undefined) backendData.title = data.title;
  if (data.description !== undefined) backendData.description = data.description;
  if (data.ingredients !== undefined) {
    backendData.ingredients = data.ingredients.map((ing) => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      notes: ing.notes,
    }));
  }
  if (data.instructions !== undefined) {
    backendData.instructions = data.instructions.map((inst) => ({
      step_number: inst.stepNumber,
      instruction: inst.instruction,
      duration_minutes: inst.durationMinutes,
    }));
  }
  if (data.prepTimeMinutes !== undefined) backendData.prep_time_minutes = data.prepTimeMinutes;
  if (data.cookTimeMinutes !== undefined) backendData.cook_time_minutes = data.cookTimeMinutes;
  if (data.servings !== undefined) backendData.servings = data.servings;
  if (data.cuisineType !== undefined) backendData.cuisine_type = data.cuisineType;
  if (data.dietaryTags !== undefined) backendData.dietary_tags = data.dietaryTags;
  if (data.difficultyLevel !== undefined) backendData.difficulty_level = data.difficultyLevel;
  if (data.sourceUrl !== undefined) backendData.source_url = data.sourceUrl;
  if (data.sourceName !== undefined) backendData.source_name = data.sourceName;
  if (data.notes !== undefined) backendData.notes = data.notes;

  const response = await apiClient.put<BackendRecipe>(`/api/v1/recipes/${recipeId}`, backendData);
  return transformRecipe(response.data);
};

/**
 * Delete a recipe
 */
export const deleteRecipe = async (recipeId: string): Promise<void> => {
  await apiClient.delete(`/api/v1/recipes/${recipeId}`);
};

// Export as object for easier imports
export const recipeApi = {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
