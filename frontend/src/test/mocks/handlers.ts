import { http, HttpResponse } from 'msw';
import {
  mockUser,
  mockBackendRecipe,
  mockLibrary,
  mockShareTokenResponse,
  mockLoginResponse,
} from './data';
import { mockMealPlanWeek } from './mealPlanData';
import { mockBackendShoppingList, mockBackendShoppingListItem } from './shoppingListData';

const BASE_URL = 'http://localhost:8000';

// Request body types for mock handlers
interface RegisterRequest {
  username: string;
  email: string;
  full_name?: string;
}

interface UserUpdateRequest {
  email?: string;
  full_name?: string;
}

interface PreferencesUpdateRequest {
  dietary_restrictions?: string[];
  skill_level?: string;
  default_servings?: number;
}

type RecipeRequest = Record<string, unknown>;
type LibraryRequest = Record<string, unknown>;

interface FeedbackRequest {
  message: string;
  page_url: string;
  screenshot?: string;
}

interface ShoppingListCreateRequest {
  name: string;
}

interface ShoppingListItemCreateRequest {
  name: string;
  amount?: string | null;
  unit?: string | null;
  category?: string | null;
}

export const handlers = [
  // Auth endpoints
  http.post(`${BASE_URL}/api/v1/users/register`, async ({ request }) => {
    const body = (await request.json()) as RegisterRequest;
    return HttpResponse.json(
      mockUser({
        username: body.username,
        email: body.email,
        fullName: body.full_name || 'Test User',
      })
    );
  }),

  http.post(`${BASE_URL}/api/v1/users/login`, async ({ request }) => {
    // Login can receive form data or JSON
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Consume the request body (form data) but we don't need to inspect it for tests
      await request.text();
      // Basic check - just return success for any login attempt in tests
      return HttpResponse.json(mockLoginResponse);
    }
    return HttpResponse.json(mockLoginResponse);
  }),

  http.get(`${BASE_URL}/api/v1/users/me`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    const user = mockUser();
    return HttpResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.fullName,
      dietary_restrictions: user.dietaryRestrictions,
      skill_level: user.skillLevel,
      default_servings: user.defaultServings,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    });
  }),

  http.put(`${BASE_URL}/api/v1/users/me`, async ({ request }) => {
    const body = (await request.json()) as UserUpdateRequest;
    return HttpResponse.json(mockUser({ ...body }));
  }),

  http.patch(`${BASE_URL}/api/v1/users/me/preferences`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    const body = (await request.json()) as PreferencesUpdateRequest;
    const user = mockUser();
    return HttpResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.fullName,
      dietary_restrictions: body.dietary_restrictions ?? user.dietaryRestrictions,
      skill_level: body.skill_level ?? user.skillLevel,
      default_servings: body.default_servings ?? user.defaultServings,
      created_at: user.createdAt,
      updated_at: new Date().toISOString(),
    });
  }),

  // Recipe endpoints - return snake_case like real backend
  http.get(`${BASE_URL}/api/v1/recipes`, async () => {
    return HttpResponse.json({
      recipes: [mockBackendRecipe(), mockBackendRecipe({ id: '2', title: 'Another Recipe' })],
      total: 2,
      page: 1,
      page_size: 10,
      total_pages: 1,
    });
  }),

  http.get(`${BASE_URL}/api/v1/recipes/:id`, async ({ params }) => {
    const { id } = params;
    return HttpResponse.json(mockBackendRecipe({ id: id as string }));
  }),

  http.post(`${BASE_URL}/api/v1/recipes`, async ({ request }) => {
    const body = (await request.json()) as RecipeRequest;
    return HttpResponse.json(mockBackendRecipe(body));
  }),

  http.put(`${BASE_URL}/api/v1/recipes/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as RecipeRequest;
    return HttpResponse.json(mockBackendRecipe({ id: id as string, ...body }));
  }),

  http.delete(`${BASE_URL}/api/v1/recipes/:id`, async () => {
    return HttpResponse.json({ message: 'Recipe deleted successfully' });
  }),

  // Library endpoints
  http.get(`${BASE_URL}/api/v1/libraries`, async () => {
    const lib1 = mockLibrary();
    const lib2 = mockLibrary({ id: '2', name: 'Another Library' });
    return HttpResponse.json([
      {
        id: lib1.id,
        name: lib1.name,
        description: lib1.description,
        owner_id: lib1.ownerId,
        is_public: lib1.isPublic,
        recipe_count: lib1.recipeCount,
        created_at: lib1.createdAt,
        updated_at: lib1.updatedAt,
      },
      {
        id: lib2.id,
        name: lib2.name,
        description: lib2.description,
        owner_id: lib2.ownerId,
        is_public: lib2.isPublic,
        recipe_count: lib2.recipeCount,
        created_at: lib2.createdAt,
        updated_at: lib2.updatedAt,
      },
    ]);
  }),

  http.get(`${BASE_URL}/api/v1/libraries/:id`, async ({ params }) => {
    const { id } = params;
    return HttpResponse.json(mockLibrary({ id: id as string }));
  }),

  http.post(`${BASE_URL}/api/v1/libraries`, async ({ request }) => {
    const body = (await request.json()) as LibraryRequest;
    return HttpResponse.json(mockLibrary(body));
  }),

  http.put(`${BASE_URL}/api/v1/libraries/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as LibraryRequest;
    return HttpResponse.json(mockLibrary({ id: id as string, ...body }));
  }),

  http.delete(`${BASE_URL}/api/v1/libraries/:id`, async () => {
    return HttpResponse.json({ message: 'Library deleted successfully' });
  }),

  // Share endpoints
  http.post(`${BASE_URL}/api/v1/shares`, async () => {
    return HttpResponse.json(mockShareTokenResponse());
  }),

  http.get(`${BASE_URL}/api/v1/shares/my-shares`, async () => {
    return HttpResponse.json([
      {
        id: 'share-1',
        recipe_id: '1',
        library_id: null,
        shared_by_id: '1',
        shared_with_id: null,
        share_token: 'abc123token',
        permission: 'view',
        expires_at: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 'share-2',
        recipe_id: '2',
        library_id: null,
        shared_by_id: '1',
        shared_with_id: '2',
        share_token: 'def456token',
        permission: 'edit',
        expires_at: null,
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  http.get(`${BASE_URL}/api/v1/shares/shared-with-me`, async () => {
    return HttpResponse.json([
      {
        id: 'share-3',
        recipe_id: '3',
        library_id: null,
        shared_by_id: '2',
        shared_with_id: '1',
        share_token: 'ghi789token',
        permission: 'view',
        expires_at: null,
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  http.get(`${BASE_URL}/api/v1/shares/token/:token/recipe`, async () => {
    return HttpResponse.json({
      id: '1',
      title: 'Shared Recipe',
      description: 'A shared test recipe',
      ingredients: [],
      instructions: [],
      prep_time_minutes: 10,
      cook_time_minutes: 30,
      total_time_minutes: 40,
      servings: 4,
      cuisine_type: 'American',
      dietary_tags: [],
      difficulty_level: 'easy',
      source_url: null,
      source_name: null,
      notes: null,
      image_url: null,
      owner_id: '2',
      library_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  http.get(`${BASE_URL}/api/v1/shares/token/:token/library`, async () => {
    return HttpResponse.json({
      id: '1',
      name: 'Shared Library',
      description: 'A shared test library',
      owner_id: '2',
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  http.delete(`${BASE_URL}/api/v1/shares/:id`, async () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Feedback endpoint
  http.post(`${BASE_URL}/api/v1/feedback`, async ({ request }) => {
    const body = (await request.json()) as FeedbackRequest;
    return HttpResponse.json({
      id: 'feedback-123',
      message: body.message,
      page_url: body.page_url,
      user_agent: 'Mozilla/5.0 (test)',
      user_id: null,
      screenshot: body.screenshot ?? null,
      github_issue_url: null,
      created_at: new Date().toISOString(),
    });
  }),

  // Meal plan endpoints
  http.get(`${BASE_URL}/api/v1/meal-plans/current`, () => {
    return HttpResponse.json(mockMealPlanWeek());
  }),

  http.get(`${BASE_URL}/api/v1/meal-plans`, ({ request }) => {
    const url = new URL(request.url);
    const weekStart = url.searchParams.get('week_start');
    return HttpResponse.json(mockMealPlanWeek(weekStart ? { week_start: weekStart } : undefined));
  }),

  // Chat endpoint
  http.post(`${BASE_URL}/api/v1/chat`, async ({ request }) => {
    const body = (await request.json()) as { messages: { role: string; content: string }[] };
    const lastMessage = body.messages[body.messages.length - 1];

    // Return a proposed recipe for "create" messages
    if (lastMessage?.content.toLowerCase().includes('create')) {
      return HttpResponse.json({
        message: 'Here is a recipe suggestion based on your request.',
        proposed_recipe: {
          title: 'AI Suggested Recipe',
          description: 'A recipe suggested by the AI assistant',
          ingredients: [
            { name: 'chicken breast', amount: '2', unit: 'pieces', notes: '' },
            { name: 'olive oil', amount: '2', unit: 'tbsp', notes: '' },
          ],
          instructions: [
            { step_number: 1, instruction: 'Season the chicken', duration_minutes: 5 },
            { step_number: 2, instruction: 'Cook in olive oil', duration_minutes: 15 },
          ],
          prep_time_minutes: 10,
          cook_time_minutes: 20,
          servings: 2,
          cuisine_type: 'American',
          dietary_tags: ['high-protein'],
          difficulty_level: 'easy',
        },
      });
    }

    // Return a text-only response for "hello" or other messages
    return HttpResponse.json({
      message: 'Hello! I can help you with your recipe. What would you like to do?',
      proposed_recipe: null,
    });
  }),

  // Shopping list endpoints
  http.get(`${BASE_URL}/api/v1/shopping-lists`, () => {
    return HttpResponse.json([
      mockBackendShoppingList(),
      mockBackendShoppingList({ id: 'list-2', name: 'Party Supplies' }),
    ]);
  }),

  http.post(`${BASE_URL}/api/v1/shopping-lists`, async ({ request }) => {
    const body = (await request.json()) as ShoppingListCreateRequest;
    return HttpResponse.json(mockBackendShoppingList({ id: 'list-new', name: body.name }), {
      status: 201,
    });
  }),

  http.get(`${BASE_URL}/api/v1/shopping-lists/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      mockBackendShoppingList({
        id: id as string,
        name: 'Weekly Groceries',
        items: [
          mockBackendShoppingListItem({
            id: 'item-1',
            name: 'Milk',
            category: 'Dairy',
            sort_order: 0,
          }),
          mockBackendShoppingListItem({
            id: 'item-2',
            name: 'Cheese',
            category: 'Dairy',
            amount: '200',
            unit: 'g',
            sort_order: 1,
          }),
          mockBackendShoppingListItem({
            id: 'item-3',
            name: 'Bread',
            category: 'Bakery',
            amount: '1',
            unit: 'loaf',
            sort_order: 2,
          }),
          mockBackendShoppingListItem({
            id: 'item-4',
            name: 'Apples',
            category: 'Produce',
            amount: '6',
            unit: 'pieces',
            sort_order: 3,
          }),
        ],
      })
    );
  }),

  http.delete(`${BASE_URL}/api/v1/shopping-lists/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE_URL}/api/v1/shopping-lists/:id/items`, async ({ request, params }) => {
    const body = (await request.json()) as ShoppingListItemCreateRequest;
    const { id } = params;
    const newItem = mockBackendShoppingListItem({
      id: 'item-new',
      name: body.name,
      amount: body.amount ?? null,
      unit: body.unit ?? null,
      category: body.category ?? null,
      sort_order: 99,
    });
    // Backend returns the full updated list, not just the item
    return HttpResponse.json(
      mockBackendShoppingList({
        id: id as string,
        name: 'Shopping List',
        items: [newItem],
      }),
      { status: 201 }
    );
  }),

  http.delete(`${BASE_URL}/api/v1/shopping-lists/:id/items/:itemId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Shopping list generate endpoint
  http.post(`${BASE_URL}/api/v1/shopping-lists/generate`, async ({ request }) => {
    const body = (await request.json()) as { week_start_date: string; name?: string };
    return HttpResponse.json(
      mockBackendShoppingList({
        id: 'list-generated',
        name: body.name || `Meal Plan - ${body.week_start_date}`,
        items: [
          mockBackendShoppingListItem({
            id: 'gen-1',
            name: 'Chicken Breast',
            amount: '2',
            unit: 'lbs',
            category: 'Meat',
            sort_order: 0,
          }),
          mockBackendShoppingListItem({
            id: 'gen-2',
            name: 'Olive Oil',
            amount: '2',
            unit: 'tbsp',
            category: 'Pantry',
            sort_order: 1,
          }),
          mockBackendShoppingListItem({
            id: 'gen-3',
            name: 'Eggs',
            amount: '6',
            unit: 'pieces',
            category: 'Dairy',
            sort_order: 2,
          }),
        ],
      }),
      { status: 201 }
    );
  }),
];
