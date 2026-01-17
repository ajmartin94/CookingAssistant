import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import * as recipeApi from './recipeApi';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:8000';

describe('recipeApi', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    // Set up auth token for tests
    localStorage.setItem('auth_token', 'test-token');
  });

  describe('getRecipes', () => {
    it('should fetch recipes successfully', async () => {
      const result = await recipeApi.getRecipes();

      expect(result.data).toBeInstanceOf(Array);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should send query parameters for filtering', async () => {
      let capturedParams: URLSearchParams | null = null;

      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, ({ request }) => {
          const url = new URL(request.url);
          capturedParams = url.searchParams;
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 10,
            total_pages: 0,
          });
        })
      );

      await recipeApi.getRecipes({
        cuisine_type: 'Italian',
        difficulty_level: 'medium',
        search: 'pasta',
        page: 2,
        page_size: 20,
      });

      expect(capturedParams?.get('cuisine_type')).toBe('Italian');
      expect(capturedParams?.get('difficulty_level')).toBe('medium');
      expect(capturedParams?.get('search')).toBe('pasta');
      expect(capturedParams?.get('page')).toBe('2');
      expect(capturedParams?.get('page_size')).toBe('20');
    });

    it('should handle empty results', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({
            recipes: [],
            total: 0,
            page: 1,
            page_size: 10,
            total_pages: 0,
          });
        })
      );

      const result = await recipeApi.getRecipes();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle API errors', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
        })
      );

      await expect(recipeApi.getRecipes()).rejects.toThrow();
    });
  });

  describe('getRecipe', () => {
    it('should fetch a single recipe successfully', async () => {
      const recipe = await recipeApi.getRecipe('1');

      expect(recipe.id).toBe('1');
      expect(recipe.title).toBeTruthy();
      expect(recipe.ingredients).toBeInstanceOf(Array);
      expect(recipe.instructions).toBeInstanceOf(Array);
    });

    it('should use correct recipe ID in request', async () => {
      let capturedId: string | null = null;

      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, ({ params }) => {
          capturedId = params.id as string;
          return HttpResponse.json({
            id: params.id,
            title: 'Test Recipe',
            ingredients: [],
            instructions: [],
            servings: 4,
          });
        })
      );

      await recipeApi.getRecipe('recipe-123');

      expect(capturedId).toBe('recipe-123');
    });

    it('should handle recipe not found error', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json({ detail: 'Recipe not found' }, { status: 404 });
        })
      );

      await expect(recipeApi.getRecipe('nonexistent')).rejects.toThrow();
    });
  });

  describe('createRecipe', () => {
    it('should create a recipe successfully', async () => {
      const newRecipe = {
        title: 'New Recipe',
        description: 'A delicious new recipe',
        ingredients: [{ name: 'flour', amount: '2', unit: 'cups', notes: '' }],
        instructions: [{ stepNumber: 1, instruction: 'Mix ingredients', durationMinutes: 5 }],
        prepTimeMinutes: 10,
        cookTimeMinutes: 30,
        servings: 4,
        cuisineType: 'Italian',
        difficultyLevel: 'medium' as const,
        dietaryTags: ['vegetarian'],
      };

      const result = await recipeApi.createRecipe(newRecipe);

      expect(result.id).toBeTruthy();
      expect(result.title).toBe('New Recipe');
    });

    it('should send recipe data in request body', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/recipes`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: '1',
            ...capturedBody,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        })
      );

      const recipeData = {
        title: 'Test Recipe',
        description: 'Test description',
        ingredients: [],
        instructions: [],
        servings: 4,
        cuisineType: 'American',
        difficultyLevel: 'easy' as const,
      };

      await recipeApi.createRecipe(recipeData);

      expect(capturedBody).toMatchObject(recipeData);
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/recipes`, () => {
          return HttpResponse.json({ detail: 'Title is required' }, { status: 400 });
        })
      );

      const invalidRecipe = {
        title: '',
        ingredients: [],
        instructions: [],
        servings: 4,
      };
      await expect(
        // @ts-expect-error Testing invalid input
        recipeApi.createRecipe(invalidRecipe)
      ).rejects.toThrow();
    });
  });

  describe('updateRecipe', () => {
    it('should update a recipe successfully', async () => {
      const updates = {
        title: 'Updated Recipe Title',
        description: 'Updated description',
      };

      const result = await recipeApi.updateRecipe('1', updates);

      expect(result.id).toBe('1');
      expect(result.title).toBe('Updated Recipe Title');
    });

    it('should send partial update data', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.put(`${BASE_URL}/api/v1/recipes/:id`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: '1',
            title: 'Original Title',
            description: 'Test',
            ingredients: [],
            instructions: [],
            prep_time_minutes: 10,
            cook_time_minutes: 20,
            total_time_minutes: 30,
            servings: capturedBody.servings || 4,
            cuisine_type: 'American',
            dietary_tags: [],
            difficulty_level: 'easy',
            owner_id: '1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      await recipeApi.updateRecipe('1', { servings: 6 });

      expect(capturedBody).toEqual({ servings: 6 });
      expect(capturedBody).not.toHaveProperty('title');
    });

    it('should use correct recipe ID in request', async () => {
      let capturedId: string | null = null;

      server.use(
        http.put(`${BASE_URL}/api/v1/recipes/:id`, ({ params }) => {
          capturedId = params.id as string;
          return HttpResponse.json({
            id: params.id,
            title: 'Test Recipe',
            description: 'Test',
            ingredients: [],
            instructions: [],
            prep_time_minutes: 10,
            cook_time_minutes: 20,
            total_time_minutes: 30,
            servings: 4,
            cuisine_type: 'American',
            dietary_tags: [],
            difficulty_level: 'easy',
            owner_id: '1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      await recipeApi.updateRecipe('recipe-456', { title: 'New Title' });

      expect(capturedId).toBe('recipe-456');
    });

    it('should handle not found error', async () => {
      server.use(
        http.put(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json({ detail: 'Recipe not found' }, { status: 404 });
        })
      );

      await expect(recipeApi.updateRecipe('nonexistent', { title: 'New Title' })).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      server.use(
        http.put(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            { detail: 'Not authorized to update this recipe' },
            { status: 403 }
          );
        })
      );

      await expect(recipeApi.updateRecipe('1', { title: 'New Title' })).rejects.toThrow();
    });
  });

  describe('deleteRecipe', () => {
    it('should delete a recipe successfully', async () => {
      await expect(recipeApi.deleteRecipe('1')).resolves.not.toThrow();
    });

    it('should use correct recipe ID in request', async () => {
      let capturedId: string | null = null;

      server.use(
        http.delete(`${BASE_URL}/api/v1/recipes/:id`, ({ params }) => {
          capturedId = params.id as string;
          return HttpResponse.json({ message: 'Recipe deleted' });
        })
      );

      await recipeApi.deleteRecipe('recipe-789');

      expect(capturedId).toBe('recipe-789');
    });

    it('should handle not found error', async () => {
      server.use(
        http.delete(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json({ detail: 'Recipe not found' }, { status: 404 });
        })
      );

      await expect(recipeApi.deleteRecipe('nonexistent')).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      server.use(
        http.delete(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            { detail: 'Not authorized to delete this recipe' },
            { status: 403 }
          );
        })
      );

      await expect(recipeApi.deleteRecipe('1')).rejects.toThrow();
    });
  });
});
