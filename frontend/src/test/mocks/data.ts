import type { User, Recipe, RecipeLibrary, RecipeShare, Ingredient, Instruction } from '../../types';

export const mockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  fullName: 'Test User',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockIngredient = (overrides?: Partial<Ingredient>): Ingredient => ({
  name: 'flour',
  amount: '2',
  unit: 'cups',
  notes: '',
  ...overrides,
});

export const mockInstruction = (overrides?: Partial<Instruction>): Instruction => ({
  stepNumber: 1,
  instruction: 'Mix ingredients',
  durationMinutes: 5,
  ...overrides,
});

export const mockRecipe = (overrides?: Partial<Recipe>): Recipe => ({
  id: '1',
  title: 'Test Recipe',
  description: 'A delicious test recipe',
  ingredients: [
    mockIngredient(),
    mockIngredient({ name: 'sugar', amount: '1', unit: 'cup' }),
  ],
  instructions: [
    mockInstruction(),
    mockInstruction({ stepNumber: 2, instruction: 'Bake at 350°F', durationMinutes: 30 }),
  ],
  prepTimeMinutes: 10,
  cookTimeMinutes: 30,
  totalTimeMinutes: 40,
  servings: 4,
  cuisineType: 'American',
  dietaryTags: ['vegetarian'],
  difficultyLevel: 'easy',
  sourceUrl: null,
  sourceName: null,
  notes: null,
  imageUrl: null,
  ownerId: '1',
  libraryId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockLibrary = (overrides?: Partial<RecipeLibrary>): RecipeLibrary => ({
  id: '1',
  name: 'Test Library',
  description: 'A test library',
  isPublic: false,
  ownerId: '1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  recipes: [],
  ...overrides,
});

export const mockShare = (overrides?: Partial<RecipeShare>): RecipeShare => ({
  id: 'share-1',
  recipeId: '1',
  libraryId: undefined,
  sharedById: '1',
  sharedWithId: undefined,
  shareToken: 'abc123token',
  permission: 'view',
  expiresAt: undefined,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const mockShareTokenResponse = (overrides?: Partial<{ shareToken: string; shareUrl: string; expiresAt?: string }>) => ({
  share_token: 'abc123token',
  share_url: '/shared/abc123token',
  expires_at: null,
  ...overrides,
});

export const mockToken = 'mock-jwt-token';

export const mockLoginResponse = {
  access_token: mockToken,
  token_type: 'bearer',
};
