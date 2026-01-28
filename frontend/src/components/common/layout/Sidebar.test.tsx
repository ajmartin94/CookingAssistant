/**
 * Tests for Sidebar component (Navigation Overhaul - RED phase)
 *
 * These tests define the TARGET sidebar behavior per the plan:
 * - Logo "CookingAssistant" links to /home (NOT /recipes)
 * - Exactly 4 nav items: Home, Cookbook, Meal Plan, Shopping (NO section groupings)
 * - Settings at bottom
 * - Removed: My Recipes, Libraries, Discover, Cook Mode
 * - 220px expanded, ~64px collapsed
 * - "New Recipe" button at bottom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, within, waitFor } from '../../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import { MemoryRouter } from 'react-router-dom';
import { SidebarProvider } from '../../../contexts/SidebarContext';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { AuthProvider } from '../../../contexts/AuthContext';

// Helper to create a wrapper with all providers for custom route testing
const createRouteWrapper =
  (initialEntries: string[]) =>
  ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <AuthProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

// Mock matchMedia for responsive tests
const mockMatchMedia = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('1024') ? matches : !matches, // lg breakpoint
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('matchMedia', mockMatchMedia(true)); // Default to desktop
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('nav items rendering', () => {
    it('should render exactly 4 main nav items plus Settings', () => {
      render(<Sidebar />);

      const nav = screen.getByRole('navigation');
      const navLinks = within(nav).getAllByRole('link');

      // 4 main nav items in nav area (Settings is at bottom, outside nav)
      expect(navLinks).toHaveLength(4);

      // Settings link exists in sidebar (outside nav, at bottom)
      const sidebar = screen.getByTestId('sidebar');
      const settingsLink = within(sidebar).getByRole('link', { name: /settings/i });
      expect(settingsLink).toBeInTheDocument();
    });

    it('should render Home nav item linking to /home', () => {
      render(<Sidebar />);

      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/home');
    });

    it('should render Cookbook nav item linking to /recipes', () => {
      render(<Sidebar />);

      const cookbookLink = screen.getByRole('link', { name: /cookbook/i });
      expect(cookbookLink).toBeInTheDocument();
      expect(cookbookLink).toHaveAttribute('href', '/recipes');
    });

    it('should render Meal Plan nav item linking to /planning', () => {
      render(<Sidebar />);

      const mealPlanLink = screen.getByRole('link', { name: /meal plan/i });
      expect(mealPlanLink).toBeInTheDocument();
      expect(mealPlanLink).toHaveAttribute('href', '/planning');
    });

    it('should render Shopping nav item linking to /shopping', () => {
      render(<Sidebar />);

      const shoppingLink = screen.getByRole('link', { name: /shopping/i });
      expect(shoppingLink).toBeInTheDocument();
      expect(shoppingLink).toHaveAttribute('href', '/shopping');
    });

    it('should render Settings at the bottom linking to /settings', () => {
      render(<Sidebar />);

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('should render nav items in correct order: Home, Cookbook, Meal Plan, Shopping', () => {
      render(<Sidebar />);

      const nav = screen.getByRole('navigation');
      const links = within(nav).getAllByRole('link');
      const labels = links.map((link) => link.textContent?.trim());

      // First 4 should be the main nav items in order
      expect(labels[0]).toMatch(/home/i);
      expect(labels[1]).toMatch(/cookbook/i);
      expect(labels[2]).toMatch(/meal plan/i);
      expect(labels[3]).toMatch(/shopping/i);
    });
  });

  describe('removed items', () => {
    it('should NOT contain "My Recipes" nav item', () => {
      render(<Sidebar />);

      expect(screen.queryByRole('link', { name: /my recipes/i })).not.toBeInTheDocument();
    });

    it('should NOT contain "Libraries" nav item', () => {
      render(<Sidebar />);

      expect(screen.queryByRole('link', { name: /libraries/i })).not.toBeInTheDocument();
    });

    it('should NOT contain "Discover" nav item', () => {
      render(<Sidebar />);

      expect(screen.queryByRole('link', { name: /discover/i })).not.toBeInTheDocument();
    });

    it('should NOT contain "Cook Mode" nav item', () => {
      render(<Sidebar />);

      expect(screen.queryByRole('link', { name: /cook mode/i })).not.toBeInTheDocument();
    });

    it('should NOT have section groupings (Recipes, Planning, Cooking, Account)', () => {
      render(<Sidebar />);

      // Old sidebar had section headers as buttons
      expect(screen.queryByRole('button', { name: /^recipes$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^planning$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^cooking$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^account$/i })).not.toBeInTheDocument();
    });
  });

  describe('logo', () => {
    it('should render logo text "CookingAssistant"', () => {
      render(<Sidebar />);

      expect(screen.getByText('CookingAssistant')).toBeInTheDocument();
    });

    it('should link logo to /home', () => {
      render(<Sidebar />);

      // Logo link should go to /home, not /recipes
      const logoLink = screen.getByText('CookingAssistant').closest('a');
      expect(logoLink).toHaveAttribute('href', '/home');
    });
  });

  describe('collapse functionality', () => {
    it('should have a collapse toggle button', () => {
      render(<Sidebar />);

      const collapseButton = screen.getByRole('button', { name: /collapse|expand/i });
      expect(collapseButton).toBeInTheDocument();
    });

    it('should toggle width when collapse button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<Sidebar />);

      const sidebar = container.querySelector('aside');
      const collapseButton = screen.getByRole('button', { name: /collapse|expand/i });

      // Initially expanded - should have 220px width class
      expect(sidebar?.className).toMatch(/w-\[220px\]|lg:w-\[220px\]/);

      // Click collapse
      await user.click(collapseButton);

      // Should now have collapsed width class (~64px)
      await waitFor(() => {
        expect(sidebar?.className).toMatch(/lg:w-16|w-\[64px\]|lg:w-\[64px\]/);
      });

      // Click expand
      await user.click(collapseButton);

      // Should be expanded again (220px)
      await waitFor(() => {
        expect(sidebar?.className).toMatch(/w-\[220px\]|lg:w-\[220px\]/);
      });
    });

    it('should persist collapse state to localStorage', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const collapseButton = screen.getByRole('button', { name: /collapse/i });
      await user.click(collapseButton);

      await waitFor(() => {
        const savedState = localStorage.getItem('sidebar-collapsed');
        expect(savedState).toBe('true');
      });
    });

    it('should load collapse state from localStorage on mount', () => {
      localStorage.setItem('sidebar-collapsed', 'true');

      const { container } = render(<Sidebar />);

      const sidebar = container.querySelector('aside');
      expect(sidebar?.className).toMatch(/lg:w-16|w-\[64px\]|lg:w-\[64px\]/);
    });
  });

  describe('active route styling', () => {
    it('should highlight active route with accent color', () => {
      render(<Sidebar />, {
        wrapper: createRouteWrapper(['/home']),
      });

      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(
        homeLink.getAttribute('aria-current') === 'page' ||
          homeLink.className.includes('accent') ||
          homeLink.className.includes('active')
      ).toBe(true);
    });

    it('should set aria-current="page" on active nav item', () => {
      render(<Sidebar />, {
        wrapper: createRouteWrapper(['/home']),
      });

      const homeLink = screen.getByRole('link', { name: /^home$/i });
      expect(homeLink).toHaveAttribute('aria-current', 'page');
    });

    it('should not highlight inactive routes', () => {
      render(<Sidebar />, {
        wrapper: createRouteWrapper(['/home']),
      });

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).not.toHaveAttribute('aria-current', 'page');
    });
  });

  describe('keyboard accessibility', () => {
    it('should be navigable via Tab key', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      // Tab through sidebar items
      await user.tab(); // Logo link
      await user.tab(); // Collapse button or first nav item

      const focusedElement = document.activeElement;
      expect(['a', 'button']).toContain(focusedElement?.tagName.toLowerCase());
    });

    it('should have visible focus indicators on nav items', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      await user.tab();
      await user.tab();

      const focusedElement = document.activeElement;
      if (focusedElement) {
        expect(
          focusedElement.className.includes('focus') || focusedElement.className.includes('ring')
        ).toBe(true);
      }
    });

    it('should allow Enter key to navigate', async () => {
      const user = userEvent.setup();
      render(<Sidebar />, {
        wrapper: createRouteWrapper(['/home']),
      });

      const cookbookLink = screen.getByRole('link', { name: /cookbook/i });
      cookbookLink.focus();

      await user.keyboard('{Enter}');

      expect(document.activeElement).toBe(cookbookLink);
    });
  });

  describe('new recipe button removed', () => {
    it('should NOT render "New Recipe" button in sidebar', () => {
      render(<Sidebar />);

      expect(screen.queryByRole('button', { name: /new recipe/i })).not.toBeInTheDocument();
    });
  });

  describe('desktop visibility', () => {
    it('should be visible on desktop viewport', () => {
      vi.stubGlobal('matchMedia', mockMatchMedia(true));
      const { container } = render(<Sidebar />);

      const sidebar = container.querySelector('aside');
      expect(sidebar?.className).toMatch(/lg:translate-x-0/);
    });
  });
});
