/**
 * Type Definitions for Cooking Assistant
 */

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  dietaryRestrictions: string[];
  skillLevel: string;
  defaultServings: number;
  createdAt: string;
  updatedAt: string;
}

// Recipe Types
export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  notes?: string;
}

export interface Instruction {
  stepNumber: number;
  instruction: string;
  durationMinutes?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  servings: number;
  cuisineType: string;
  dietaryTags: string[];
  difficultyLevel: 'easy' | 'medium' | 'hard';
  sourceUrl?: string;
  sourceName?: string;
  notes?: string;
  imageUrl?: string;
  ownerId: string;
  libraryId?: string;
  createdAt: string;
  updatedAt: string;
}

// Library Types
export interface RecipeLibrary {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Share Types
export interface RecipeShare {
  id: string;
  recipeId?: string;
  libraryId?: string;
  sharedById: string;
  sharedWithId?: string;
  shareToken: string;
  permission: 'view' | 'edit';
  expiresAt?: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form Types
export interface RecipeFormData {
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  cuisineType: string;
  dietaryTags: string[];
  difficultyLevel: 'easy' | 'medium' | 'hard';
  sourceUrl?: string;
  sourceName?: string;
  notes?: string;
}

export const DEFAULT_RECIPE_FORM_DATA: RecipeFormData = {
  title: '',
  description: '',
  ingredients: [{ name: '', amount: '', unit: '' }],
  instructions: [{ stepNumber: 1, instruction: '' }],
  prepTimeMinutes: 0,
  cookTimeMinutes: 0,
  servings: 4,
  cuisineType: '',
  dietaryTags: [],
  difficultyLevel: 'easy',
  sourceUrl: '',
  sourceName: '',
  notes: '',
};
