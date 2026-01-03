import { http, HttpResponse } from 'msw';
import { mockUser, mockRecipe, mockLibrary, mockLoginResponse } from './data';

const BASE_URL = 'http://localhost:8000';

export const handlers = [
  // Auth endpoints
  http.post(`${BASE_URL}/api/v1/users/register`, async () => {
    return HttpResponse.json(mockUser());
  }),

  http.post(`${BASE_URL}/api/v1/users/login`, async () => {
    return HttpResponse.json(mockLoginResponse);
  }),

  http.get(`${BASE_URL}/api/v1/users/me`, async () => {
    return HttpResponse.json(mockUser());
  }),

  http.put(`${BASE_URL}/api/v1/users/me`, async () => {
    return HttpResponse.json(mockUser({ email: 'updated@example.com' }));
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
