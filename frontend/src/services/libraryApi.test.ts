import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import * as libraryApi from './libraryApi';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:8000';

describe('libraryApi', () => {
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

  describe('getLibraries', () => {
    it('should fetch libraries successfully', async () => {
      const result = await libraryApi.getLibraries();

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
    });

    it('should send skip and limit parameters', async () => {
      let capturedParams: URLSearchParams | undefined;

      server.use(
        http.get(`${BASE_URL}/api/v1/libraries`, ({ request }) => {
          const url = new URL(request.url);
          capturedParams = url.searchParams;
          return HttpResponse.json([]);
        })
      );

      await libraryApi.getLibraries(10, 25);

      expect(capturedParams).toBeDefined();
      expect(capturedParams!.get('skip')).toBe('10');
      expect(capturedParams!.get('limit')).toBe('25');
    });

    it('should use default parameters when not provided', async () => {
      let capturedParams: URLSearchParams | undefined;

      server.use(
        http.get(`${BASE_URL}/api/v1/libraries`, ({ request }) => {
          const url = new URL(request.url);
          capturedParams = url.searchParams;
          return HttpResponse.json([]);
        })
      );

      await libraryApi.getLibraries();

      expect(capturedParams).toBeDefined();
      expect(capturedParams!.get('skip')).toBe('0');
      expect(capturedParams!.get('limit')).toBe('50');
    });

    it('should handle empty results', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/libraries`, () => {
          return HttpResponse.json([]);
        })
      );

      const result = await libraryApi.getLibraries();

      expect(result).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/libraries`, () => {
          return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
        })
      );

      await expect(libraryApi.getLibraries()).rejects.toThrow();
    });
  });

  describe('getLibrary', () => {
    it('should fetch a single library successfully', async () => {
      const library = await libraryApi.getLibrary('1');

      expect(library.id).toBe('1');
      expect(library.name).toBeTruthy();
      expect(library).toHaveProperty('ownerId');
    });

    it('should use correct library ID in request', async () => {
      let capturedId: string | null = null;

      server.use(
        http.get(`${BASE_URL}/api/v1/libraries/:id`, ({ params }) => {
          capturedId = params.id as string;
          return HttpResponse.json({
            id: params.id,
            name: 'Test Library',
            recipes: [],
          });
        })
      );

      await libraryApi.getLibrary('library-123');

      expect(capturedId).toBe('library-123');
    });

    it('should handle library not found error', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/libraries/:id`, () => {
          return HttpResponse.json({ detail: 'Library not found' }, { status: 404 });
        })
      );

      await expect(libraryApi.getLibrary('nonexistent')).rejects.toThrow();
    });
  });

  describe('createLibrary', () => {
    it('should create a library successfully', async () => {
      const newLibrary = {
        name: 'New Library',
        description: 'A test library',
        is_public: false,
      };

      const result = await libraryApi.createLibrary(newLibrary);

      expect(result.id).toBeTruthy();
      expect(result.name).toBe('New Library');
    });

    it('should send library data in request body', async () => {
      let capturedBody: Record<string, unknown> | undefined;

      server.use(
        http.post(`${BASE_URL}/api/v1/libraries`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            id: '1',
            ...capturedBody,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        })
      );

      const libraryData = {
        name: 'Test Library',
        description: 'Test description',
        is_public: true,
      };

      await libraryApi.createLibrary(libraryData);

      expect(capturedBody).toMatchObject(libraryData);
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/libraries`, () => {
          return HttpResponse.json({ detail: 'Name is required' }, { status: 400 });
        })
      );

      await expect(libraryApi.createLibrary({ name: '' })).rejects.toThrow();
    });
  });

  describe('updateLibrary', () => {
    it('should update a library successfully', async () => {
      const updates = {
        name: 'Updated Library Name',
        description: 'Updated description',
      };

      const result = await libraryApi.updateLibrary('1', updates);

      expect(result.id).toBe('1');
      expect(result.name).toBe('Updated Library Name');
    });

    it('should send partial update data', async () => {
      let capturedBody: Record<string, unknown> | undefined;

      server.use(
        http.put(`${BASE_URL}/api/v1/libraries/:id`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            id: '1',
            name: 'Original Name',
            ...capturedBody,
          });
        })
      );

      await libraryApi.updateLibrary('1', { is_public: true });

      expect(capturedBody).toEqual({ is_public: true });
      expect(capturedBody).not.toHaveProperty('name');
    });

    it('should use correct library ID in request', async () => {
      let capturedId: string | null = null;

      server.use(
        http.put(`${BASE_URL}/api/v1/libraries/:id`, ({ params }) => {
          capturedId = params.id as string;
          return HttpResponse.json({
            id: params.id,
            name: 'Test Library',
          });
        })
      );

      await libraryApi.updateLibrary('library-456', { name: 'New Name' });

      expect(capturedId).toBe('library-456');
    });

    it('should handle not found error', async () => {
      server.use(
        http.put(`${BASE_URL}/api/v1/libraries/:id`, () => {
          return HttpResponse.json({ detail: 'Library not found' }, { status: 404 });
        })
      );

      await expect(libraryApi.updateLibrary('nonexistent', { name: 'New Name' })).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      server.use(
        http.put(`${BASE_URL}/api/v1/libraries/:id`, () => {
          return HttpResponse.json(
            { detail: 'Not authorized to update this library' },
            { status: 403 }
          );
        })
      );

      await expect(libraryApi.updateLibrary('1', { name: 'New Name' })).rejects.toThrow();
    });
  });

  describe('deleteLibrary', () => {
    it('should delete a library successfully', async () => {
      await expect(libraryApi.deleteLibrary('1')).resolves.not.toThrow();
    });

    it('should use correct library ID in request', async () => {
      let capturedId: string | null = null;

      server.use(
        http.delete(`${BASE_URL}/api/v1/libraries/:id`, ({ params }) => {
          capturedId = params.id as string;
          return HttpResponse.json({ message: 'Library deleted' });
        })
      );

      await libraryApi.deleteLibrary('library-789');

      expect(capturedId).toBe('library-789');
    });

    it('should handle not found error', async () => {
      server.use(
        http.delete(`${BASE_URL}/api/v1/libraries/:id`, () => {
          return HttpResponse.json({ detail: 'Library not found' }, { status: 404 });
        })
      );

      await expect(libraryApi.deleteLibrary('nonexistent')).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      server.use(
        http.delete(`${BASE_URL}/api/v1/libraries/:id`, () => {
          return HttpResponse.json(
            { detail: 'Not authorized to delete this library' },
            { status: 403 }
          );
        })
      );

      await expect(libraryApi.deleteLibrary('1')).rejects.toThrow();
    });
  });
});
