/**
 * Tests for authApi service
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import * as authApi from './authApi';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

describe('authApi', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });
  afterAll(() => server.close());

  describe('login', () => {
    it('should login successfully and return token', async () => {
      const result = await authApi.login({ username: 'testuser', password: 'password123' });

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.token_type).toBe('bearer');
    });

    it('should handle login failure', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/users/login`, () => {
          return HttpResponse.json(
            { detail: 'Incorrect credentials' },
            { status: 401 }
          );
        })
      );

      await expect(authApi.login({ username: 'wrong', password: 'wrong' })).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const result = await authApi.register({
        username: 'newuser',
        email: 'new@test.com',
        password: 'password123'
      });

      expect(result.username).toBe('newuser');
      expect(result.email).toBe('new@test.com');
    });

    it('should handle registration failure', async () => {
      server.use(
        http.post(`${BASE_URL}/api/v1/users/register`, () => {
          return HttpResponse.json(
            { detail: 'Username already exists' },
            { status: 400 }
          );
        })
      );

      await expect(
        authApi.register({ username: 'duplicate', email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user with valid token', async () => {
      localStorage.setItem('auth_token', 'valid-token');

      const user = await authApi.getCurrentUser();

      expect(user.username).toBe('testuser');
      expect(user.email).toBeTruthy();
    });

    it('should handle missing token', async () => {
      localStorage.removeItem('auth_token');

      await expect(authApi.getCurrentUser()).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('auth_token', 'some-token');

      authApi.logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      localStorage.setItem('auth_token', 'valid-token');

      const updated = await authApi.updateProfile({ email: 'new@email.com' });

      expect(updated.email).toBe('new@email.com');
    });
  });
});
