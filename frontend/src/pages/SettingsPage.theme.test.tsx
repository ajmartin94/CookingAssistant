/**
 * Tests for Theme Toggle in Settings Page
 *
 * Verifies that the Settings page includes theme toggle functionality per the
 * Design System Infrastructure plan requirements:
 * - Theme toggle component is IN Settings page (not header)
 * - Theme toggle is keyboard accessible in Settings context
 * - Theme toggle switches between light/dark modes
 * - Theme changes persist across page reloads
 *
 * RED PHASE: These tests are written to FAIL against the current implementation
 * because the ThemeToggle component is NOT yet integrated into SettingsPage.tsx
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import SettingsPage from './SettingsPage';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:8000';

describe('SettingsPage - Theme Toggle Integration', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.removeItem('theme');
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });
  afterAll(() => server.close());

  describe('Theme Toggle Presence in Settings Page', () => {
    it('should render a theme toggle button in the Settings page', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      render(<SettingsPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      });

      // CRITICAL: Theme toggle must be present in Settings page (per plan)
      // This test should FAIL because ThemeToggle is not in SettingsPage.tsx
      expect(
        screen.getByRole('button', { name: /switch to light|switch to dark|toggle theme/i })
      ).toBeInTheDocument();
    });

    it('should have an "Appearance" or "Theme" section heading', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      render(<SettingsPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      });

      // The Settings page should have an Appearance/Theme section
      // Check for a heading first (preferred), then fallback to any text match
      const appearanceHeading = screen.queryByRole('heading', { name: /appearance|theme/i });

      // If no heading found, look for text (use queryAllByText to handle multiple matches)
      const hasAppearanceSection =
        appearanceHeading !== null || screen.queryAllByText(/appearance|theme/i).length > 0;

      expect(hasAppearanceSection).toBe(true);
    });
  });

  describe('Theme Toggle Functionality in Settings Page', () => {
    it('should toggle theme from dark to light when clicking the toggle button', async () => {
      // Mock system preference for dark mode
      const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      vi.stubGlobal('matchMedia', mockMatchMedia);

      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      });

      // Find and click the theme toggle button
      // This should FAIL because no theme toggle exists in Settings page
      const toggleButton = screen.getByRole('button', {
        name: /switch to light|switch to dark|toggle theme/i,
      });

      // Should start in dark mode (based on system preference mock)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      await user.click(toggleButton);

      // After click, should be in light mode
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      });
    });

    it('should toggle theme from light to dark when clicking the toggle button', async () => {
      // Set initial theme to light
      localStorage.setItem('theme', 'light');

      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      });

      // Should start in light mode
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      });

      // Find and click the theme toggle button
      const toggleButton = screen.getByRole('button', {
        name: /switch to light|switch to dark|toggle theme/i,
      });

      await user.click(toggleButton);

      // After click, should be in dark mode
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      });
    });
  });

  describe('Theme Toggle Keyboard Accessibility in Settings Page', () => {
    it('should be focusable via Tab key when navigating through Settings page', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      });

      // The theme toggle button should exist and be focusable
      const toggleButton = screen.getByRole('button', {
        name: /switch to light|switch to dark|toggle theme/i,
      });

      // Tab through the page - theme toggle should be reachable
      // We tab multiple times to reach the toggle
      for (let i = 0; i < 20; i++) {
        await user.tab();
        if (document.activeElement === toggleButton) {
          break;
        }
      }

      expect(toggleButton).toHaveFocus();
    });

    it('should toggle theme when pressing Enter key on focused toggle', async () => {
      // Set initial theme to dark
      localStorage.setItem('theme', 'dark');

      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('button', {
        name: /switch to light|switch to dark|toggle theme/i,
      });

      // Focus the toggle button and press Enter
      toggleButton.focus();
      expect(toggleButton).toHaveFocus();

      await user.keyboard('{Enter}');

      // Theme should have toggled
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      });
    });

    it('should toggle theme when pressing Space key on focused toggle', async () => {
      // Set initial theme to dark
      localStorage.setItem('theme', 'dark');

      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('button', {
        name: /switch to light|switch to dark|toggle theme/i,
      });

      // Focus the toggle button and press Space
      toggleButton.focus();
      expect(toggleButton).toHaveFocus();

      await user.keyboard(' ');

      // Theme should have toggled
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      });
    });
  });

  describe('Theme Persistence from Settings Page', () => {
    it('should persist theme preference to localStorage when toggled in Settings', async () => {
      // Start with no stored preference
      localStorage.removeItem('theme');

      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('button', {
        name: /switch to light|switch to dark|toggle theme/i,
      });

      // Click to set a theme preference
      await user.click(toggleButton);

      // Theme should be persisted to localStorage
      await waitFor(() => {
        const storedTheme = localStorage.getItem('theme');
        expect(storedTheme).not.toBeNull();
        expect(['light', 'dark']).toContain(storedTheme);
      });
    });
  });

  describe('Theme Toggle Visual Feedback in Settings', () => {
    it('should show appropriate icon based on current theme state', async () => {
      // Start in dark mode
      localStorage.setItem('theme', 'dark');

      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      render(<SettingsPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      });

      // When in dark mode, button should indicate "switch to light"
      const toggleButton = screen.getByRole('button', {
        name: /switch to light|switch to dark|toggle theme/i,
      });

      // Button should have visible icon content
      expect(toggleButton.innerHTML.length).toBeGreaterThan(0);
      // In dark mode, aria-label should mention "light"
      expect(toggleButton.getAttribute('aria-label')).toMatch(/light/i);
    });

    it('should update aria-label after toggle to reflect new available action', async () => {
      // Start in dark mode
      localStorage.setItem('theme', 'dark');

      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: [],
            skill_level: 'beginner',
            default_servings: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('button', {
        name: /switch to light|switch to dark|toggle theme/i,
      });

      // Initially in dark mode - should say "switch to light"
      expect(toggleButton.getAttribute('aria-label')).toMatch(/light/i);

      // Toggle to light mode
      await user.click(toggleButton);

      // Now in light mode - should say "switch to dark"
      await waitFor(() => {
        expect(toggleButton.getAttribute('aria-label')).toMatch(/dark/i);
      });
    });
  });
});
