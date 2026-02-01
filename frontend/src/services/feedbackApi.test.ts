/**
 * Feedback API Service Tests
 *
 * Tests for the feedback API service with MSW mocking.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as feedbackApi from './feedbackApi';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

describe('feedbackApi', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async () => {
          return HttpResponse.json({
            id: 'feedback-123',
            message: 'Feedback received',
            created_at: '2026-01-25T12:00:00Z',
          });
        })
      );

      const result = await feedbackApi.submitFeedback({
        message: 'This is my feedback',
        pageUrl: 'http://localhost:3000/recipes/123',
      });

      expect(result.id).toBe('feedback-123');
      expect(result.message).toBe('Feedback received');
    });

    it('should send feedback message and page URL in request body', async () => {
      let capturedBody: { message: string; page_url: string } | null = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async ({ request }) => {
          capturedBody = (await request.json()) as { message: string; page_url: string };
          return HttpResponse.json({
            id: 'feedback-123',
            message: 'Feedback received',
            created_at: '2026-01-25T12:00:00Z',
          });
        })
      );

      await feedbackApi.submitFeedback({
        message: 'Great app!',
        pageUrl: 'http://localhost:3000/settings',
      });

      expect(capturedBody).not.toBeNull();
      // API uses snake_case per project conventions
      expect(capturedBody!.message).toBe('Great app!');
      expect(capturedBody!.page_url).toBe('http://localhost:3000/settings');
    });

    it('should include auth token if user is logged in', async () => {
      let capturedAuthHeader: string | null = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization');
          return HttpResponse.json({
            id: 'feedback-123',
            message: 'Feedback received',
            created_at: '2026-01-25T12:00:00Z',
          });
        })
      );

      // Set auth token
      localStorage.setItem('auth_token', 'valid-user-token');

      await feedbackApi.submitFeedback({
        message: 'Logged in feedback',
        pageUrl: 'http://localhost:3000/recipes',
      });

      expect(capturedAuthHeader).toBe('Bearer valid-user-token');
    });

    it('should work without auth token (anonymous feedback)', async () => {
      let capturedAuthHeader: string | null = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization');
          return HttpResponse.json({
            id: 'feedback-456',
            message: 'Feedback received',
            created_at: '2026-01-25T12:00:00Z',
          });
        })
      );

      // Ensure no auth token
      localStorage.removeItem('auth_token');

      const result = await feedbackApi.submitFeedback({
        message: 'Anonymous feedback',
        pageUrl: 'http://localhost:3000/',
      });

      expect(capturedAuthHeader).toBeNull();
      expect(result.id).toBe('feedback-456');
    });

    it('should throw error on server failure', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async () => {
          return HttpResponse.json({ detail: 'Internal server error' }, { status: 500 });
        })
      );

      await expect(
        feedbackApi.submitFeedback({
          message: 'This will fail',
          pageUrl: 'http://localhost:3000/',
        })
      ).rejects.toThrow();
    });

    it('should throw error on validation failure', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async () => {
          return HttpResponse.json(
            { detail: 'Message must be at least 10 characters' },
            { status: 422 }
          );
        })
      );

      await expect(
        feedbackApi.submitFeedback({
          message: 'Short',
          pageUrl: 'http://localhost:3000/',
        })
      ).rejects.toThrow();
    });

    it('should throw error on network failure', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async () => {
          return HttpResponse.error();
        })
      );

      await expect(
        feedbackApi.submitFeedback({
          message: 'Network will fail',
          pageUrl: 'http://localhost:3000/',
        })
      ).rejects.toThrow();
    });
  });

  describe('screenshot field', () => {
    it('should send screenshot in request body when provided', async () => {
      let capturedBody: { message: string; page_url: string; screenshot?: string } | null = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async ({ request }) => {
          capturedBody = (await request.json()) as {
            message: string;
            page_url: string;
            screenshot?: string;
          };
          return HttpResponse.json({
            id: 'feedback-123',
            message: 'Feedback received',
            created_at: '2026-01-25T12:00:00Z',
          });
        })
      );

      await feedbackApi.submitFeedback({
        message: 'Feedback with screenshot',
        pageUrl: 'http://localhost:3000/recipes/123',
        screenshot: 'data:image/jpeg;base64,abc123',
      });

      expect(capturedBody).not.toBeNull();
      expect(capturedBody!.screenshot).toBe('data:image/jpeg;base64,abc123');
    });

    it('should omit screenshot from request body when null', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            id: 'feedback-123',
            message: 'Feedback received',
            created_at: '2026-01-25T12:00:00Z',
          });
        })
      );

      await feedbackApi.submitFeedback({
        message: 'Feedback without screenshot',
        pageUrl: 'http://localhost:3000/recipes/123',
        screenshot: null,
      });

      expect(capturedBody).not.toBeNull();
      expect(capturedBody!).not.toHaveProperty('screenshot');
    });

    it('should omit screenshot from request body when undefined', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            id: 'feedback-123',
            message: 'Feedback received',
            created_at: '2026-01-25T12:00:00Z',
          });
        })
      );

      await feedbackApi.submitFeedback({
        message: 'Feedback without screenshot',
        pageUrl: 'http://localhost:3000/recipes/123',
      });

      expect(capturedBody).not.toBeNull();
      expect(capturedBody!).not.toHaveProperty('screenshot');
    });
  });

  describe('FeedbackResponse type', () => {
    it('should return properly typed response', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/feedback`, async () => {
          return HttpResponse.json({
            id: 'feedback-789',
            message: 'Thank you for your feedback',
            created_at: '2026-01-25T14:30:00Z',
          });
        })
      );

      const result = await feedbackApi.submitFeedback({
        message: 'Testing types',
        pageUrl: 'http://localhost:3000/',
      });

      // Verify response shape matches expected interface
      expect(typeof result.id).toBe('string');
      expect(typeof result.message).toBe('string');
      expect(typeof result.createdAt).toBe('string');
    });
  });
});
