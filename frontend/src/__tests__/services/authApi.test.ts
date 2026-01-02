/**
 * Auth API Tests
 *
 * Tests authentication API service functions
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { register, login, getCurrentUser } from '../../services/authApi'

describe('authApi', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('register', () => {
    it('registers a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }

      const result = await register(userData)

      expect(result).toBeDefined()
      expect(result.username).toBe('testuser')
      expect(result.email).toBe('test@example.com')
    })

    it('returns user data without password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }

      const result = await register(userData)

      expect(result).not.toHaveProperty('password')
      expect(result).not.toHaveProperty('hashed_password')
    })
  })

  describe('login', () => {
    it('logs in a user and returns token', async () => {
      const result = await login({ username: 'testuser', password: 'password123' })

      expect(result).toBeDefined()
      expect(result.access_token).toBe('mock-jwt-token')
      expect(result.token_type).toBe('bearer')
    })

    it('accepts LoginData object', async () => {
      const loginData = { username: 'testuser', password: 'password123' }
      const result = await login(loginData)

      expect(result).toBeDefined()
      expect(result.access_token).toBeDefined()
      expect(result.token_type).toBe('bearer')
    })
  })

  describe('getCurrentUser', () => {
    it('retrieves current user profile', async () => {
      // Set token first (using 'auth_token' key to match actual implementation)
      localStorage.setItem('auth_token', 'mock-jwt-token')

      const result = await getCurrentUser()

      expect(result).toBeDefined()
      expect(result.username).toBe('testuser')
      expect(result.email).toBe('test@example.com')
    })

    it('throws error when not authenticated', async () => {
      // No token set
      await expect(getCurrentUser()).rejects.toThrow()
    })
  })
})
