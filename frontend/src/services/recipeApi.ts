/**
 * Recipe API Client
 *
 * API functions for recipe CRUD operations
 */

import apiClient from './api';
import type { Recipe, RecipeFormData } from '../types';

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

/**
 * Get list of recipes with optional filters
 */
export const getRecipes = async (params?: RecipeListParams): Promise<RecipeListResponse> => {
  const response = await apiClient.get('/api/v1/recipes', { params });
  return response.data;
};

/**
 * Get a single recipe by ID
 */
export const getRecipe = async (recipeId: string): Promise<Recipe> => {
  const response = await apiClient.get(`/api/v1/recipes/${recipeId}`);
  return response.data;
};

/**
 * Create a new recipe
 */
export const createRecipe = async (data: RecipeFormData): Promise<Recipe> => {
  const response = await apiClient.post('/api/v1/recipes', data);
  return response.data;
};

/**
 * Update an existing recipe
 */
export const updateRecipe = async (
  recipeId: string,
  data: Partial<RecipeFormData>
): Promise<Recipe> => {
  const response = await apiClient.put(`/api/v1/recipes/${recipeId}`, data);
  return response.data;
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
