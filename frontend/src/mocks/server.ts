/**
 * MSW Server Setup
 *
 * Sets up Mock Service Worker for API mocking in tests
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
