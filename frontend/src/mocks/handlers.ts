/**
 * MSW Request Handlers
 *
 * Mock API handlers for testing
 */

import { http, HttpResponse } from 'msw'

const API_URL = 'http://test/api/v1'

export const handlers = [
  // Auth handlers
  http.post(`${API_URL}/users/register`, async () => {
    return HttpResponse.json({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  http.post(`${API_URL}/users/login`, async () => {
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      token_type: 'bearer',
    })
  }),

  http.get(`${API_URL}/users/me`, async () => {
    return HttpResponse.json({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // Recipe handlers
  http.get(`${API_URL}/recipes`, async () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          title: 'Test Recipe',
          description: 'A test recipe',
          ingredients: [{ name: 'flour', amount: '2', unit: 'cups', notes: '' }],
          instructions: [{ step_number: 1, instruction: 'Mix', duration_minutes: 5 }],
          servings: 4,
          cuisine_type: 'American',
          difficulty_level: 'easy',
          owner_id: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })
  }),

  http.post(`${API_URL}/recipes`, async () => {
    return HttpResponse.json({
      id: '2',
      title: 'New Recipe',
      description: 'New recipe description',
      ingredients: [{ name: 'salt', amount: '1', unit: 'tsp', notes: '' }],
      instructions: [{ step_number: 1, instruction: 'Add salt', duration_minutes: 1 }],
      servings: 2,
      owner_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.get(`${API_URL}/recipes/:id`, async ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      title: 'Test Recipe',
      description: 'A test recipe',
      ingredients: [{ name: 'flour', amount: '2', unit: 'cups', notes: '' }],
      instructions: [{ step_number: 1, instruction: 'Mix', duration_minutes: 5 }],
      servings: 4,
      owner_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  http.put(`${API_URL}/recipes/:id`, async ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      title: 'Updated Recipe',
      description: 'Updated description',
      ingredients: [{ name: 'flour', amount: '2', unit: 'cups', notes: '' }],
      instructions: [{ step_number: 1, instruction: 'Mix', duration_minutes: 5 }],
      servings: 4,
      owner_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  http.delete(`${API_URL}/recipes/:id`, async () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Library handlers
  http.get(`${API_URL}/libraries`, async () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'My Favorites',
        description: 'Favorite recipes',
        is_public: false,
        owner_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
  }),
]
