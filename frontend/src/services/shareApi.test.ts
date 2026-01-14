import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import * as shareApi from './shareApi';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:8000';

describe('shareApi', () => {
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

  describe('createShare', () => {
    it('should create a share successfully', async () => {
      const result = await shareApi.createShare({
        recipeId: '1',
        permission: 'view',
      });

      expect(result.shareToken).toBeTruthy();
      expect(result.shareUrl).toBeTruthy();
    });

    it('should send correct data to API', async () => {
      let capturedBody: any = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/shares`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            share_token: 'test-token',
            share_url: '/shared/test-token',
            expires_at: null,
          });
        })
      );

      await shareApi.createShare({
        recipeId: 'recipe-123',
        permission: 'edit',
        sharedWithId: 'user-456',
      });

      expect(capturedBody.recipe_id).toBe('recipe-123');
      expect(capturedBody.permission).toBe('edit');
      expect(capturedBody.shared_with_id).toBe('user-456');
    });

    it('should handle API errors', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/shares`, () => {
          return HttpResponse.json(
            { detail: 'Recipe not found' },
            { status: 404 }
          );
        })
      );

      await expect(shareApi.createShare({ recipeId: 'invalid' })).rejects.toThrow();
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/shares`, () => {
          return HttpResponse.json(
            { detail: 'Not authorized to share this recipe' },
            { status: 403 }
          );
        })
      );

      await expect(shareApi.createShare({ recipeId: '1' })).rejects.toThrow();
    });
  });

  describe('getMyShares', () => {
    it('should fetch user shares successfully', async () => {
      const result = await shareApi.getMyShares();

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('share-1');
      expect(result[0].recipeId).toBe('1');
      expect(result[0].permission).toBe('view');
    });

    it('should handle empty results', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/shares/my-shares`, () => {
          return HttpResponse.json([]);
        })
      );

      const result = await shareApi.getMyShares();

      expect(result).toHaveLength(0);
    });

    it('should send pagination parameters', async () => {
      let capturedParams: URLSearchParams | null = null;

      server.use(
        http.get(`${BASE_URL}/api/v1/shares/my-shares`, ({ request }) => {
          const url = new URL(request.url);
          capturedParams = url.searchParams;
          return HttpResponse.json([]);
        })
      );

      await shareApi.getMyShares({ skip: 10, limit: 20 });

      expect(capturedParams?.get('skip')).toBe('10');
      expect(capturedParams?.get('limit')).toBe('20');
    });
  });

  describe('getSharedWithMe', () => {
    it('should fetch shares with user successfully', async () => {
      const result = await shareApi.getSharedWithMe();

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('share-3');
      expect(result[0].sharedById).toBe('2');
    });

    it('should handle empty results', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/shares/shared-with-me`, () => {
          return HttpResponse.json([]);
        })
      );

      const result = await shareApi.getSharedWithMe();

      expect(result).toHaveLength(0);
    });
  });

  describe('getSharedRecipe', () => {
    it('should fetch shared recipe via token', async () => {
      const result = await shareApi.getSharedRecipe('abc123token');

      expect(result.id).toBe('1');
      expect(result.title).toBe('Shared Recipe');
      expect(result.servings).toBe(4);
    });

    it('should use correct token in request', async () => {
      let capturedToken: string | null = null;

      server.use(
        http.get(`${BASE_URL}/api/v1/shares/token/:token/recipe`, ({ params }) => {
          capturedToken = params.token as string;
          return HttpResponse.json({
            id: '1',
            title: 'Test Recipe',
            ingredients: [],
            instructions: [],
            servings: 4,
            cuisine_type: '',
            dietary_tags: [],
            difficulty_level: 'easy',
            owner_id: '1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      await shareApi.getSharedRecipe('my-special-token');

      expect(capturedToken).toBe('my-special-token');
    });

    it('should handle invalid token error', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/shares/token/:token/recipe`, () => {
          return HttpResponse.json(
            { detail: 'Share not found' },
            { status: 404 }
          );
        })
      );

      await expect(shareApi.getSharedRecipe('invalid-token')).rejects.toThrow();
    });

    it('should handle expired share error', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/shares/token/:token/recipe`, () => {
          return HttpResponse.json(
            { detail: 'Share has expired' },
            { status: 410 }
          );
        })
      );

      await expect(shareApi.getSharedRecipe('expired-token')).rejects.toThrow();
    });
  });

  describe('getSharedLibrary', () => {
    it('should fetch shared library via token', async () => {
      const result = await shareApi.getSharedLibrary('abc123token');

      expect(result.id).toBe('1');
      expect(result.name).toBe('Shared Library');
    });

    it('should use correct token in request', async () => {
      let capturedToken: string | null = null;

      server.use(
        http.get(`${BASE_URL}/api/v1/shares/token/:token/library`, ({ params }) => {
          capturedToken = params.token as string;
          return HttpResponse.json({
            id: '1',
            name: 'Test Library',
            description: '',
            owner_id: '1',
            is_public: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      await shareApi.getSharedLibrary('library-token');

      expect(capturedToken).toBe('library-token');
    });

    it('should handle invalid token error', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/shares/token/:token/library`, () => {
          return HttpResponse.json(
            { detail: 'Share not found' },
            { status: 404 }
          );
        })
      );

      await expect(shareApi.getSharedLibrary('invalid-token')).rejects.toThrow();
    });
  });

  describe('deleteShare', () => {
    it('should delete a share successfully', async () => {
      await expect(shareApi.deleteShare('share-1')).resolves.not.toThrow();
    });

    it('should use correct share ID in request', async () => {
      let capturedId: string | null = null;

      server.use(
        http.delete(`${BASE_URL}/api/v1/shares/:id`, ({ params }) => {
          capturedId = params.id as string;
          return new HttpResponse(null, { status: 204 });
        })
      );

      await shareApi.deleteShare('share-abc');

      expect(capturedId).toBe('share-abc');
    });

    it('should handle not found error', async () => {
      server.use(
        http.delete(`${BASE_URL}/api/v1/shares/:id`, () => {
          return HttpResponse.json(
            { detail: 'Share not found' },
            { status: 404 }
          );
        })
      );

      await expect(shareApi.deleteShare('nonexistent')).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      server.use(
        http.delete(`${BASE_URL}/api/v1/shares/:id`, () => {
          return HttpResponse.json(
            { detail: 'Not authorized to delete this share' },
            { status: 403 }
          );
        })
      );

      await expect(shareApi.deleteShare('not-mine')).rejects.toThrow();
    });
  });
});
