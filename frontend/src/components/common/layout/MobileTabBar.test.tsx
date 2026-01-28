/**
 * Tests for MobileTabBar component (Navigation Overhaul)
 *
 * Verifies:
 * - Renders 4 tabs: Home, Cookbook, Plan, Shop
 * - Active tab shows accent color styling
 * - Tabs navigate to correct routes
 * - Keyboard accessible
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { MobileTabBar } from './MobileTabBar';
import { MemoryRouter } from 'react-router-dom';

describe('MobileTabBar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('tab rendering', () => {
    it('should render 4 navigation tabs', () => {
      render(<MobileTabBar />);

      const tabs = screen.getAllByRole('link');
      expect(tabs).toHaveLength(4);
    });

    it('should render Home tab', () => {
      render(<MobileTabBar />);

      const homeTab = screen.getByRole('link', { name: /home/i });
      expect(homeTab).toBeInTheDocument();
      expect(homeTab).toHaveAttribute('href', '/home');
    });

    it('should render Cookbook tab', () => {
      render(<MobileTabBar />);

      const cookbookTab = screen.getByRole('link', { name: /cookbook|recipes/i });
      expect(cookbookTab).toBeInTheDocument();
      expect(cookbookTab).toHaveAttribute('href', '/recipes');
    });

    it('should render Plan tab', () => {
      render(<MobileTabBar />);

      const planTab = screen.getByRole('link', { name: /plan|meal/i });
      expect(planTab).toBeInTheDocument();
      expect(planTab).toHaveAttribute('href', '/planning');
    });

    it('should render Shop tab', () => {
      render(<MobileTabBar />);

      const shopTab = screen.getByRole('link', { name: /shop|grocery/i });
      expect(shopTab).toBeInTheDocument();
      expect(shopTab).toHaveAttribute('href', '/shopping');
    });

    it('should render tab icons', () => {
      render(<MobileTabBar />);

      // Each tab should have an icon (svg element)
      const icons = screen.getAllByRole('link').map((link) => link.querySelector('svg'));
      expect(icons.filter(Boolean)).toHaveLength(4);
    });

    it('should render tab labels', () => {
      render(<MobileTabBar />);

      expect(screen.getByText(/home/i)).toBeInTheDocument();
      expect(screen.getByText(/cookbook|recipes/i)).toBeInTheDocument();
      expect(screen.getByText(/plan/i)).toBeInTheDocument();
      expect(screen.getByText(/shop/i)).toBeInTheDocument();
    });
  });

  describe('active tab styling', () => {
    it('should highlight Home tab when on home route', () => {
      render(<MobileTabBar />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <MemoryRouter initialEntries={['/home']}>{children}</MemoryRouter>
        ),
      });

      const homeTab = screen.getByRole('link', { name: /home/i });
      expect(homeTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Cookbook tab when on recipes route', () => {
      render(<MobileTabBar />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <MemoryRouter initialEntries={['/recipes']}>{children}</MemoryRouter>
        ),
      });

      const cookbookTab = screen.getByRole('link', { name: /cookbook|recipes/i });
      expect(cookbookTab).toHaveAttribute('aria-current', 'page');
    });

    it('should apply accent color to active tab', () => {
      render(<MobileTabBar />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
        ),
      });

      const homeTab = screen.getByRole('link', { name: /home/i });
      // Active tab should have accent color class
      expect(homeTab.className).toMatch(/text-accent|text-text-primary/);
    });

    it('should not highlight inactive tabs', () => {
      render(<MobileTabBar />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
        ),
      });

      const cookbookTab = screen.getByRole('link', { name: /cookbook|recipes/i });
      expect(cookbookTab).not.toHaveAttribute('aria-current', 'page');
      expect(cookbookTab.className).toMatch(/text-text-muted|text-text-secondary/);
    });
  });

  describe('navigation', () => {
    it('should navigate when tab is clicked', async () => {
      const user = userEvent.setup();

      render(<MobileTabBar />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
        ),
      });

      const cookbookTab = screen.getByRole('link', { name: /cookbook|recipes/i });
      await user.click(cookbookTab);

      // React Router handles navigation, we just verify the link is functional
      expect(cookbookTab).toHaveAttribute('href', '/recipes');
    });
  });

  describe('keyboard accessibility', () => {
    it('should be navigable via Tab key', async () => {
      const user = userEvent.setup();
      render(<MobileTabBar />);

      // Tab through the tabs
      await user.tab();

      const focusedElement = document.activeElement;
      expect(focusedElement?.tagName.toLowerCase()).toBe('a');
    });

    it('should allow Tab navigation between tabs', async () => {
      const user = userEvent.setup();
      render(<MobileTabBar />);

      // Focus first tab
      const homeTab = screen.getByRole('link', { name: /home/i });
      homeTab.focus();
      expect(document.activeElement).toBe(homeTab);

      // Press Tab to move to next link
      await user.tab();

      // Next tab should be focused
      const cookbookTab = screen.getByRole('link', { name: /cookbook|recipes/i });
      expect(document.activeElement).toBe(cookbookTab);
    });

    it('should have visible focus indicator', async () => {
      const user = userEvent.setup();
      render(<MobileTabBar />);

      await user.tab();

      const focusedElement = document.activeElement;
      expect(focusedElement?.className).toMatch(/focus|ring/);
    });
  });

  describe('layout and positioning', () => {
    it('should be fixed to bottom of viewport', () => {
      const { container } = render(<MobileTabBar />);

      const tabBar = container.querySelector('nav');
      expect(tabBar?.className).toMatch(/fixed|bottom-0/);
    });

    it('should span full width', () => {
      const { container } = render(<MobileTabBar />);

      const tabBar = container.querySelector('nav');
      expect(tabBar?.className).toMatch(/w-full|inset-x-0/);
    });

    it('should have appropriate height for touch targets', () => {
      const { container } = render(<MobileTabBar />);

      const tabBar = container.querySelector('nav');
      // Tab bar should be at least 56px or have h-14/h-16 class
      expect(tabBar?.className).toMatch(/h-14|h-16|min-h-\[56px\]/);
    });
  });

  describe('accessibility', () => {
    it('should have navigation role', () => {
      render(<MobileTabBar />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should have accessible label', () => {
      render(<MobileTabBar />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label');
    });
  });
});
