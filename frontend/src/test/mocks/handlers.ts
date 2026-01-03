import { http, HttpResponse } from 'msw';
import { mockUser, mockRecipe, mockLibrary, mockLoginResponse } from './data';

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
      recipes: [mockRecipe(), mockRecipe({ id: '2', title: 'Another Recipe' })],
      total: 2,
      page: 1,
      page_size: 10,
      total_pages: 1,
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
];
