/**
 * Feature 5: Chat Persistence Tests
 *
 * Tests for useChatSession hook sessionStorage behavior:
 * 1. Chat messages saved to sessionStorage on new message
 * 2. Chat messages loaded from sessionStorage on mount
 * 3. Max 50 messages stored (oldest trimmed)
 * 4. Integration: Refresh page, reopen chat, history visible
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatSession } from './useChatSession';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Feature 5: Chat Persistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    server.close();
  });

  describe('Component: Chat messages saved to sessionStorage on new message', () => {
    it('saves messages to sessionStorage when a new message is added', async () => {
      // Setup: MSW handler for chat API
      server.use(
        http.post('/api/v1/chat', () => {
          return HttpResponse.json({
            message: 'AI response',
            proposed_recipe: null,
          });
        })
      );

      const { result } = renderHook(() => useChatSession('test-page'));

      // Initially no messages (hook initializes storage with empty array)
      expect(result.current.messages).toHaveLength(0);

      // Send a message
      await act(async () => {
        await result.current.sendMessage('Hello', {
          title: '',
          description: '',
          ingredients: [],
          instructions: [],
          prepTimeMinutes: 0,
          cookTimeMinutes: 0,
          servings: 4,
          cuisineType: '',
          dietaryTags: [],
          difficultyLevel: 'easy',
          sourceUrl: '',
          sourceName: '',
          notes: '',
        });
      });

      // Wait for the message to be processed
      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThan(0);
      });

      // Verify sessionStorage was updated
      const stored = sessionStorage.getItem('chat_history_test-page');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].content).toBe('Hello');
    });
  });

  describe('Component: Chat messages loaded from sessionStorage on mount', () => {
    it('loads existing messages from sessionStorage when hook mounts', () => {
      // Setup: Pre-populate sessionStorage
      const existingMessages = [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' },
      ];
      sessionStorage.setItem('chat_history_load-test', JSON.stringify(existingMessages));

      // Mount the hook
      const { result } = renderHook(() => useChatSession('load-test'));

      // Verify messages were loaded
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].content).toBe('Previous message');
      expect(result.current.messages[1].content).toBe('Previous response');
    });

    it('starts with empty messages if sessionStorage is empty', () => {
      const { result } = renderHook(() => useChatSession('empty-test'));
      expect(result.current.messages).toHaveLength(0);
    });
  });

  describe('Component: Max 50 messages stored (oldest trimmed)', () => {
    it('trims messages to 50 when storing more', async () => {
      // Setup: Create 52 messages (will be trimmed to 50)
      const manyMessages = Array.from({ length: 52 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));

      sessionStorage.setItem('chat_history_trim-test', JSON.stringify(manyMessages));

      // Mount hook - it should trim on first effect
      renderHook(() => useChatSession('trim-test'));

      // The hook loads all 52, but persistence effect trims to 50
      await waitFor(() => {
        const stored = sessionStorage.getItem('chat_history_trim-test');
        const parsed = JSON.parse(stored!);
        expect(parsed.length).toBe(50);
      });

      // Oldest messages (0, 1) should be trimmed, newest kept
      const stored = sessionStorage.getItem('chat_history_trim-test');
      const parsed = JSON.parse(stored!);
      expect(parsed[0].content).toBe('Message 2');
      expect(parsed[parsed.length - 1].content).toBe('Message 51');
    });
  });

  describe('Integration: Refresh page, reopen chat, history visible', () => {
    it('simulates page refresh by unmounting and remounting with persisted state', async () => {
      // First mount - send a message (uses default MSW handler)
      const { result, unmount } = renderHook(() => useChatSession('refresh-test'));

      await act(async () => {
        await result.current.sendMessage('Hello before refresh', {
          title: '',
          description: '',
          ingredients: [],
          instructions: [],
          prepTimeMinutes: 0,
          cookTimeMinutes: 0,
          servings: 4,
          cuisineType: '',
          dietaryTags: [],
          difficultyLevel: 'easy',
          sourceUrl: '',
          sourceName: '',
          notes: '',
        });
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBe(2); // user + assistant
      });

      // Capture the AI response content
      const aiResponse = result.current.messages[1].content;

      // Unmount (simulating page navigation away)
      unmount();

      // Remount (simulating page refresh/return)
      const { result: result2 } = renderHook(() => useChatSession('refresh-test'));

      // History should be visible with same messages
      expect(result2.current.messages.length).toBe(2);
      expect(result2.current.messages[0].content).toBe('Hello before refresh');
      expect(result2.current.messages[1].content).toBe(aiResponse);
    });
  });
});
