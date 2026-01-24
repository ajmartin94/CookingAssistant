/**
 * Chat API Client
 *
 * API functions for AI recipe chat interactions
 */

import apiClient from './api';
import type { RecipeFormData } from '../types';

// Backend types (snake_case)
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

interface BackendRecipeFormData {
  title: string;
  description: string;
  ingredients: BackendIngredient[];
  instructions: BackendInstruction[];
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  cuisine_type: string;
  dietary_tags: string[];
  difficulty_level: 'easy' | 'medium' | 'hard';
  source_url?: string;
  source_name?: string;
  notes?: string;
}

interface BackendChatResponse {
  message: string;
  proposed_recipe: BackendRecipeFormData | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  current_recipe: BackendRecipeFormData;
}

export interface ChatResponse {
  reply: string;
  proposedRecipe: RecipeFormData | null;
}

// Transform frontend RecipeFormData to backend format
const transformRecipeToBackend = (data: RecipeFormData): BackendRecipeFormData => ({
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

// Transform backend proposed recipe to frontend RecipeFormData
const transformProposedRecipe = (backend: Partial<BackendRecipeFormData>): RecipeFormData => ({
  title: backend.title || '',
  description: backend.description || '',
  ingredients: (backend.ingredients || []).map((ing) => ({
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    notes: ing.notes || '',
  })),
  instructions: (backend.instructions || []).map((inst) => ({
    stepNumber: inst.step_number,
    instruction: inst.instruction,
    durationMinutes: inst.duration_minutes,
  })),
  prepTimeMinutes: backend.prep_time_minutes || 0,
  cookTimeMinutes: backend.cook_time_minutes || 0,
  servings: backend.servings || 4,
  cuisineType: backend.cuisine_type || '',
  dietaryTags: backend.dietary_tags || [],
  difficultyLevel: backend.difficulty_level || 'easy',
  sourceUrl: backend.source_url,
  sourceName: backend.source_name,
  notes: backend.notes,
});

/**
 * Send a chat message to the AI assistant
 */
export const sendChatMessage = async (
  messages: ChatMessage[],
  currentRecipe: RecipeFormData
): Promise<ChatResponse> => {
  const requestBody: ChatRequest = {
    messages,
    current_recipe: transformRecipeToBackend(currentRecipe),
  };

  const response = await apiClient.post<BackendChatResponse>('/api/v1/chat', requestBody);
  const data = response.data;

  return {
    reply: data.message,
    proposedRecipe: data.proposed_recipe ? transformProposedRecipe(data.proposed_recipe) : null,
  };
};

export const chatApi = {
  sendChatMessage,
};
