/**
 * Library API Client
 *
 * API functions for recipe library management
 */

import apiClient from './api';
import type { RecipeLibrary, Recipe } from '../types';

interface LibraryFormData {
  name: string;
  description?: string;
  is_public?: boolean;
}

interface LibraryDetailResponse extends RecipeLibrary {
  recipes: Recipe[];
}

/**
 * Get list of user's libraries
 */
export const getLibraries = async (skip = 0, limit = 50): Promise<RecipeLibrary[]> => {
  const response = await apiClient.get('/api/v1/libraries', {
    params: { skip, limit },
  });
  return response.data;
};

/**
 * Get a single library by ID with recipes
 */
export const getLibrary = async (libraryId: string): Promise<LibraryDetailResponse> => {
  const response = await apiClient.get(`/api/v1/libraries/${libraryId}`);
  return response.data;
};

/**
 * Create a new library
 */
export const createLibrary = async (data: LibraryFormData): Promise<RecipeLibrary> => {
  const response = await apiClient.post('/api/v1/libraries', data);
  return response.data;
};

/**
 * Update an existing library
 */
export const updateLibrary = async (
  libraryId: string,
  data: Partial<LibraryFormData>
): Promise<RecipeLibrary> => {
  const response = await apiClient.put(`/api/v1/libraries/${libraryId}`, data);
  return response.data;
};

/**
 * Delete a library
 */
export const deleteLibrary = async (libraryId: string): Promise<void> => {
  await apiClient.delete(`/api/v1/libraries/${libraryId}`);
};
