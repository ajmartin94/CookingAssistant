/**
 * Test Setup File
 *
 * Configures testing environment for Vitest + React Testing Library
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './mocks/server'

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Reset handlers and cleanup after each test
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Close server after all tests
afterAll(() => {
  server.close()
})

// Mock window.matchMedia (used by some UI libraries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any
