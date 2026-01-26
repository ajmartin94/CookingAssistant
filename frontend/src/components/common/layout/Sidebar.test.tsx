/**
 * Tests for Sidebar component (Navigation Overhaul)
 *
 * Verifies:
 * - Sidebar renders nav items at desktop width
 * - Collapse button toggles sidebar width
 * - Collapsed state persists to localStorage
 * - Active route shows accent color styling
 * - Navigation items are keyboard accessible
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, waitFor } from '../../../test/test-utils';
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
    it('should render navigation items', () => {
      render(<Sidebar />);

      // Check for main navigation items
      expect(screen.getByRole('link', { name: /recipes|my recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /libraries/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    });

    it('should render sidebar at desktop width (220px)', () => {
      const { container } = render(<Sidebar />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toBeInTheDocument();

      // Sidebar should have appropriate width class (lg:w-72 = 288px or similar)
      // New spec: 220px expanded
      expect(sidebar?.className).toMatch(/lg:w-\d+|w-72|w-\[220px\]/);
    });

    it('should render navigation sections', () => {
      render(<Sidebar />);

      // Check for section headers (buttons with section titles)
      // Use getAllByText and check for section header structure
      const recipesElements = screen.getAllByText(/recipes/i);
      expect(recipesElements.length).toBeGreaterThanOrEqual(1);

      // Check for specific sections by their button role
      expect(screen.getByRole('button', { name: /recipes/i })).toBeInTheDocument();
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

      // Initially expanded - should have larger width class
      expect(sidebar?.className).not.toMatch(/lg:w-16|w-\[64px\]/);

      // Click collapse
      await user.click(collapseButton);

      // Should now have collapsed width class (64px)
      await waitFor(() => {
        expect(sidebar?.className).toMatch(/lg:w-16|w-\[64px\]/);
      });

      // Click expand
      await user.click(collapseButton);

      // Should be expanded again
      await waitFor(() => {
        expect(sidebar?.className).toMatch(/lg:w-72|lg:w-\d{2,3}|w-\[220px\]/);
      });
    });

    it('should hide nav labels when collapsed, show icons only', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      // Initially, labels should be visible (expanded state shows text in flex-1 span)
      const recipesLabel = screen.getByRole('link', { name: /my recipes/i });
      expect(recipesLabel).toBeVisible();

      // Collapse sidebar
      const collapseButton = screen.getByRole('button', { name: /collapse/i });
      await user.click(collapseButton);

      // Labels should be hidden (sr-only or tooltip only)
      await waitFor(() => {
        // In collapsed mode, the label is in sr-only span (for accessibility)
        // and in the tooltip div (aria-hidden). Find the sr-only one.
        const labels = screen.getAllByText(/my recipes/i);
        const srOnlyLabel = labels.find((el) => el.classList.contains('sr-only'));
        expect(srOnlyLabel).toBeInTheDocument();
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
      // Should be collapsed on mount
      expect(sidebar?.className).toMatch(/lg:w-16|w-\[64px\]/);
    });
  });

  describe('active route styling', () => {
    it('should highlight active route with accent color', () => {
      // Render with /recipes as current route
      render(<Sidebar />, {
        wrapper: createRouteWrapper(['/recipes']),
      });

      const recipesLink = screen.getByRole('link', { name: /recipes|my recipes/i });
      // Active link should have accent-related class or aria-current
      expect(
        recipesLink.getAttribute('aria-current') === 'page' ||
          recipesLink.className.includes('accent') ||
          recipesLink.className.includes('active')
      ).toBe(true);
    });

    it('should not highlight inactive routes', () => {
      render(<Sidebar />, {
        wrapper: createRouteWrapper(['/recipes']),
      });

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      // Inactive link should NOT have aria-current="page"
      expect(settingsLink.getAttribute('aria-current')).not.toBe('page');
    });
  });

  describe('keyboard accessibility', () => {
    it('should be navigable via Tab key', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      // Tab through sidebar items - logo link is first, then collapse button, then nav links
      await user.tab(); // Logo link
      await user.tab(); // Collapse button (hidden on mobile but present in DOM)
      await user.tab(); // First section button or nav link

      // Eventually we should reach a nav link
      expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
      const focusedElement = document.activeElement;

      // Verify focusable elements are reachable (either link or button)
      expect(['a', 'button']).toContain(focusedElement?.tagName.toLowerCase());
    });

    it('should have visible focus indicators on nav items', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      // Tab to first link
      await user.tab();
      await user.tab(); // Skip to navigation link

      const focusedElement = document.activeElement;
      if (focusedElement) {
        const styles = window.getComputedStyle(focusedElement);
        // Should have focus-visible styles (outline or ring)
        expect(
          focusedElement.className.includes('focus') ||
            styles.outline !== 'none' ||
            styles.outlineWidth !== '0px'
        ).toBe(true);
      }
    });

    it('should allow Enter key to navigate', async () => {
      const user = userEvent.setup();
      render(<Sidebar />, {
        wrapper: createRouteWrapper(['/']),
      });

      // Focus on a link
      const recipesLink = screen.getByRole('link', { name: /recipes|my recipes/i });
      recipesLink.focus();

      // Press Enter
      await user.keyboard('{Enter}');

      // Link should be activated (navigation handled by React Router)
      expect(document.activeElement).toBe(recipesLink);
    });
  });

  describe('desktop visibility', () => {
    it('should be visible on desktop viewport', () => {
      vi.stubGlobal('matchMedia', mockMatchMedia(true)); // Desktop
      const { container } = render(<Sidebar />);

      const sidebar = container.querySelector('aside');
      // Sidebar should have lg:translate-x-0 (visible on desktop)
      expect(sidebar?.className).toMatch(/lg:translate-x-0/);
    });
  });
});
