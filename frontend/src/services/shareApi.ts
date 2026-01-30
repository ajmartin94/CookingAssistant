/**
 * Share API Client
 *
 * API functions for sharing recipes and libraries
 */

import apiClient from './api';
import type { Recipe, RecipeLibrary, RecipeShare } from '../types';

export interface ShareCreateData {
  recipeId?: string;
  libraryId?: string;
  sharedWithId?: string;
  permission?: 'view' | 'edit';
  expiresAt?: string;
}

export interface ShareTokenResponse {
  shareToken: string;
  shareUrl: string;
  expiresAt?: string;
}

export interface ShareListParams {
  skip?: number;
  limit?: number;
}

/**
 * Create a new share for a recipe or library
 */
export const createShare = async (data: ShareCreateData): Promise<ShareTokenResponse> => {
  const response = await apiClient.post('/api/v1/shares', {
    recipe_id: data.recipeId,
    library_id: data.libraryId,
    shared_with_id: data.sharedWithId,
    permission: data.permission || 'view',
    expires_at: data.expiresAt,
  });
  return {
    shareToken: response.data.share_token,
    shareUrl: response.data.share_url,
    expiresAt: response.data.expires_at,
  };
};

/**
 * Get shares created by the current user
 */
export const getMyShares = async (params?: ShareListParams): Promise<RecipeShare[]> => {
  const response = await apiClient.get('/api/v1/shares/my-shares', { params });
  return response.data.map((share: Record<string, unknown>) => ({
    id: share.id,
    recipeId: share.recipe_id,
    libraryId: share.library_id,
    sharedById: share.shared_by_id,
    sharedWithId: share.shared_with_id,
    shareToken: share.share_token,
    permission: share.permission,
    expiresAt: share.expires_at,
    createdAt: share.created_at,
  }));
};

/**
 * Get content shared with the current user
 */
export const getSharedWithMe = async (params?: ShareListParams): Promise<RecipeShare[]> => {
  const response = await apiClient.get('/api/v1/shares/shared-with-me', { params });
  return response.data.map((share: Record<string, unknown>) => ({
    id: share.id,
    recipeId: share.recipe_id,
    libraryId: share.library_id,
    sharedById: share.shared_by_id,
    sharedWithId: share.shared_with_id,
    shareToken: share.share_token,
    permission: share.permission,
    expiresAt: share.expires_at,
    createdAt: share.created_at,
  }));
};

/**
 * Access a shared recipe via token (public endpoint)
 */
export const getSharedRecipe = async (shareToken: string): Promise<Recipe> => {
  const response = await apiClient.get(`/api/v1/shares/token/${shareToken}/recipe`);
  const data = response.data;
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    ingredients: data.ingredients,
    instructions: data.instructions,
    prepTimeMinutes: data.prep_time_minutes,
    cookTimeMinutes: data.cook_time_minutes,
    totalTimeMinutes: data.total_time_minutes,
    servings: data.servings,
    cuisineType: data.cuisine_type,
    dietaryTags: data.dietary_tags || [],
    difficultyLevel: data.difficulty_level,
    sourceUrl: data.source_url,
    sourceName: data.source_name,
    notes: data.notes,
    imageUrl: data.image_url,
    ownerId: data.owner_id,
    libraryId: data.library_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Access a shared library via token (public endpoint)
 */
export const getSharedLibrary = async (shareToken: string): Promise<RecipeLibrary> => {
  const response = await apiClient.get(`/api/v1/shares/token/${shareToken}/library`);
  const data = response.data;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    ownerId: data.owner_id,
    isPublic: data.is_public,
    recipeCount: data.recipe_count ?? 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Revoke/delete a share
 */
export const deleteShare = async (shareId: string): Promise<void> => {
  await apiClient.delete(`/api/v1/shares/${shareId}`);
};

// Export as object for easier imports
export const shareApi = {
  createShare,
  getMyShares,
  getSharedWithMe,
  getSharedRecipe,
  getSharedLibrary,
  deleteShare,
};
