import { http, HttpResponse } from 'msw';
import { mockUser, mockRecipe, mockLibrary, mockShareTokenResponse, mockLoginResponse } from './data';

const BASE_URL = 'http://localhost:8000';

export const handlers = [
  // Auth endpoints
  http.post(`${BASE_URL}/api/v1/users/register`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(mockUser({
      username: body.username,
      email: body.email,
      fullName: body.full_name || 'Test User',
    }));
  }),

  http.post(`${BASE_URL}/api/v1/users/login`, async ({ request }) => {
    // Login can receive form data or JSON
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.text();
      // Basic check - just return success for any login attempt in tests
      return HttpResponse.json(mockLoginResponse);
    }
    return HttpResponse.json(mockLoginResponse);
  }),

  http.get(`${BASE_URL}/api/v1/users/me`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      );
    }
    return HttpResponse.json(mockUser());
  }),

  http.put(`${BASE_URL}/api/v1/users/me`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json(mockUser({ ...body }));
  }),

  // Recipe endpoints
  http.get(`${BASE_URL}/api/v1/recipes`, async () => {
    return HttpResponse.json({
      data: [mockRecipe(), mockRecipe({ id: '2', title: 'Another Recipe' })],
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
  }),

  http.get(`${BASE_URL}/api/v1/recipes/:id`, async ({ params }) => {
    const { id } = params;
    return HttpResponse.json(mockRecipe({ id: id as string }));
  }),

  http.post(`${BASE_URL}/api/v1/recipes`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(mockRecipe(body as any));
  }),

  http.put(`${BASE_URL}/api/v1/recipes/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    return HttpResponse.json(mockRecipe({ id: id as string, ...body as any }));
  }),

  http.delete(`${BASE_URL}/api/v1/recipes/:id`, async () => {
    return HttpResponse.json({ message: 'Recipe deleted successfully' });
  }),

  // Library endpoints
  http.get(`${BASE_URL}/api/v1/libraries`, async () => {
    return HttpResponse.json([
      mockLibrary(),
      mockLibrary({ id: '2', name: 'Another Library' }),
    ]);
  }),

  http.get(`${BASE_URL}/api/v1/libraries/:id`, async ({ params }) => {
    const { id } = params;
    return HttpResponse.json(mockLibrary({ id: id as string }));
  }),

  http.post(`${BASE_URL}/api/v1/libraries`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(mockLibrary(body as any));
  }),

  http.put(`${BASE_URL}/api/v1/libraries/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    return HttpResponse.json(mockLibrary({ id: id as string, ...body as any }));
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
];
