/**
 * Design Token Migration Tests
 *
 * Verifies that all components and pages use semantic design tokens instead of
 * hardcoded Tailwind color classes. These tests will fail until the migration
 * is complete.
 *
 * Feature: Design Token Migration
 * Acceptance Criteria:
 * - All pages render correctly in both light and dark themes
 * - No hardcoded color classes remain (bg-white, text-neutral-*, bg-primary-*, etc.)
 * - All semantic colors use token classes (bg-primary, text-primary, etc.)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from './test-utils';
// Import pages to test
import HomePage from '../pages/HomePage';
import RecipesPage from '../pages/RecipesPage';
import LoginPage from '../pages/LoginPage';
import CreateRecipePage from '../pages/CreateRecipePage';
import EditRecipePage from '../pages/EditRecipePage';
import LibrariesPage from '../pages/LibrariesPage';
import LibraryDetailPage from '../pages/LibraryDetailPage';
import SettingsPage from '../pages/SettingsPage';
import SharedRecipePage from '../pages/SharedRecipePage';
import RecipeDetailPage from '../pages/RecipeDetailPage';
import ShoppingListPage from '../pages/ShoppingListPage';

// Import components to test
import RecipeCard from '../components/recipes/RecipeCard';
import RecipeForm from '../components/recipes/RecipeForm';
import { Sidebar } from '../components/common/layout/Sidebar';
import { MainLayout } from '../components/common/layout/MainLayout';
import { ChatPanel } from '../components/chat/ChatPanel';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

import type { Recipe, RecipeFormData } from '../types';
import { DEFAULT_RECIPE_FORM_DATA } from '../types';

// Mock recipe data
const mockRecipe: Recipe = {
  id: '1',
  title: 'Test Recipe',
  description: 'A test recipe description',
  ingredients: [{ name: 'Test ingredient', amount: '1', unit: 'cup' }],
  instructions: [{ stepNumber: 1, instruction: 'Test step' }],
  prepTimeMinutes: 15,
  cookTimeMinutes: 30,
  totalTimeMinutes: 45,
  servings: 4,
  cuisineType: 'Italian',
  difficultyLevel: 'easy',
  dietaryTags: ['vegetarian'],
  imageUrl: undefined,
  sourceUrl: undefined,
  sourceName: undefined,
  notes: undefined,
  ownerId: 'user1',
  libraryId: undefined,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Hardcoded color patterns that should NOT be present after migration
// These are the classes we're migrating away from
const HARDCODED_COLOR_PATTERNS = [
  // Background colors
  /\bbg-white\b/,
  /\bbg-black\b(?!\/)/,
  /\bbg-neutral-\d+\b/,
  /\bbg-primary-\d+\b/,
  /\bbg-secondary-\d+\b/,
  /\bbg-success-\d+\b/,
  /\bbg-warning-\d+\b/,
  /\bbg-error-\d+\b/,
  /\bbg-blue-\d+\b/,
  /\bbg-purple-\d+\b/,
  /\bbg-cream-\d+\b/,
  // Text colors
  /\btext-white\b/,
  /\btext-black\b/,
  /\btext-neutral-\d+\b/,
  /\btext-primary-\d+\b/,
  /\btext-secondary-\d+\b/,
  /\btext-success-\d+\b/,
  /\btext-warning-\d+\b/,
  /\btext-error-\d+\b/,
  /\btext-blue-\d+\b/,
  /\btext-purple-\d+\b/,
  // Border colors
  /\bborder-neutral-\d+\b/,
  /\bborder-primary-\d+\b/,
  /\bborder-error-\d+\b/,
  // Focus ring colors
  /\bfocus:ring-primary-\d+\b/,
  /\bfocus:border-primary-\d+\b/,
  // Hover colors
  /\bhover:bg-neutral-\d+\b/,
  /\bhover:bg-primary-\d+\b/,
  /\bhover:text-neutral-\d+\b/,
  /\bhover:text-primary-\d+\b/,
];

// Semantic token classes that SHOULD be present after migration
// (Used by hasSemanticTokens helper - kept for reference)
// const SEMANTIC_TOKEN_PATTERNS = [
//   /\bbg-primary\b/, // Uses CSS var --bg-primary
//   /\bbg-secondary\b/, // Uses CSS var --bg-secondary
//   /\bbg-card\b/, // Uses CSS var --bg-card
//   /\btext-primary\b/, // Uses CSS var --text-primary
//   /\btext-secondary\b/, // Uses CSS var --text-secondary
//   /\btext-muted\b/, // Uses CSS var --text-muted
//   /\bborder-default\b/, // Uses CSS var --border
//   /\bbg-accent\b/, // Uses CSS var --accent
//   /\btext-accent\b/, // Uses CSS var --accent
// ];

/**
 * Helper to check if an element's class list contains hardcoded color classes
 */
function findHardcodedColors(element: HTMLElement): string[] {
  const found: string[] = [];
  const classList = element.className || '';

  for (const pattern of HARDCODED_COLOR_PATTERNS) {
    const matches = classList.match(pattern);
    if (matches) {
      found.push(...matches);
    }
  }

  return found;
}

/**
 * Recursively find all hardcoded colors in an element tree
 */
function findAllHardcodedColors(container: HTMLElement): Map<string, string[]> {
  const results = new Map<string, string[]>();

  function traverse(element: HTMLElement, path: string) {
    const hardcoded = findHardcodedColors(element);
    if (hardcoded.length > 0) {
      results.set(path, hardcoded);
    }

    Array.from(element.children).forEach((child, index) => {
      if (child instanceof HTMLElement) {
        const tagName = child.tagName.toLowerCase();
        const id = child.id ? `#${child.id}` : '';
        const className = child.className?.split?.(' ')[0] || '';
        const identifier = id || (className ? `.${className}` : `[${index}]`);
        traverse(child, `${path} > ${tagName}${identifier}`);
      }
    });
  }

  traverse(container, 'root');
  return results;
}

// Note: hasSemanticTokens function available if needed for future tests
// function hasSemanticTokens(container: HTMLElement): boolean {
//   const allClasses = container.innerHTML;
//   return SEMANTIC_TOKEN_PATTERNS.some((pattern) => pattern.test(allClasses));
// }

describe('Design Token Migration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    // Mock matchMedia for system preference detection
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });

  describe('RecipeCard Component', () => {
    it('should use semantic design tokens instead of hardcoded colors', () => {
      const { container } = render(<RecipeCard recipe={mockRecipe} />);

      const hardcodedColors = findAllHardcodedColors(container);

      expect(
        hardcodedColors.size,
        `Found hardcoded colors: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
      ).toBe(0);
    });

    it('should use bg-card token for card background', () => {
      const { container } = render(<RecipeCard recipe={mockRecipe} />);

      // Card should use bg-card token class, not bg-white
      const cardElement = container.querySelector('[data-testid="recipe-card"]');
      expect(cardElement?.className).toMatch(/\bbg-card\b/);
      expect(cardElement?.className).not.toMatch(/\bbg-white\b/);
    });

    it('should use text-primary token for title', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const titleElement = screen.getByRole('heading', { name: 'Test Recipe' });
      expect(titleElement.className).toMatch(/\btext-primary\b/);
      expect(titleElement.className).not.toMatch(/\btext-neutral-\d+\b/);
    });

    it('should use semantic difficulty badge tokens', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const difficultyBadge = screen.getByText('easy');
      // Should use semantic success token classes, not hardcoded bg-success-100
      expect(difficultyBadge.className).toMatch(/\bbg-success\b/);
      expect(difficultyBadge.className).not.toMatch(/\bbg-success-\d+\b/);
    });
  });

  describe('Sidebar Component', () => {
    it('should use semantic design tokens instead of hardcoded colors', () => {
      const { container } = render(<Sidebar />);

      const hardcodedColors = findAllHardcodedColors(container);

      expect(
        hardcodedColors.size,
        `Found hardcoded colors: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
      ).toBe(0);
    });

    it('should use bg-card token for sidebar background', () => {
      const { container } = render(<Sidebar />);

      const sidebar = container.querySelector('aside');
      expect(sidebar?.className).toMatch(/\bbg-card\b/);
      expect(sidebar?.className).not.toMatch(/\bbg-white\b/);
    });

    it('should use border-default token for borders', () => {
      const { container } = render(<Sidebar />);

      const sidebar = container.querySelector('aside');
      expect(sidebar?.className).toMatch(/\bborder-default\b/);
      expect(sidebar?.className).not.toMatch(/\bborder-neutral-\d+\b/);
    });
  });

  describe('HomePage', () => {
    it('should use semantic design tokens instead of hardcoded colors', () => {
      const { container } = render(<HomePage />);

      const hardcodedColors = findAllHardcodedColors(container);

      expect(
        hardcodedColors.size,
        `Found hardcoded colors: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
      ).toBe(0);
    });

    it('should use bg-primary token for page background', () => {
      const { container } = render(<HomePage />);

      // Should use theme-aware background, not gradient with hardcoded colors
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/\bbg-primary\b/);
      expect(mainDiv?.className).not.toMatch(/\bfrom-primary-\d+\b/);
    });

    it('should use text-primary token for headings', () => {
      render(<HomePage />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.className).toMatch(/\btext-primary\b/);
      expect(heading.className).not.toMatch(/\btext-neutral-\d+\b/);
    });

    it('should use bg-card token for feature cards', () => {
      const { container } = render(<HomePage />);

      // Feature cards should use bg-card
      const cards = container.querySelectorAll('.shadow-soft');
      cards.forEach((card) => {
        expect(card.className).toMatch(/\bbg-card\b/);
        expect(card.className).not.toMatch(/\bbg-white\b/);
      });
    });
  });

  describe('LoginPage', () => {
    it('should use semantic design tokens instead of hardcoded colors', () => {
      const { container } = render(<LoginPage />);

      const hardcodedColors = findAllHardcodedColors(container);

      expect(
        hardcodedColors.size,
        `Found hardcoded colors: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
      ).toBe(0);
    });

    it('should use bg-card token for form container', () => {
      const { container } = render(<LoginPage />);

      // Form container should use bg-card, not bg-white
      const formContainer = container.querySelector('.shadow-soft-md');
      expect(formContainer?.className).toMatch(/\bbg-card\b/);
      expect(formContainer?.className).not.toMatch(/\bbg-white\b/);
    });

    it('should use text-text-secondary token for labels', () => {
      render(<LoginPage />);

      const label = screen.getByText('Username');
      expect(label.className).toMatch(/\btext-text-secondary\b/);
      expect(label.className).not.toMatch(/\btext-neutral-\d+\b/);
    });

    it('should use border-default token for input borders', () => {
      render(<LoginPage />);

      const input = screen.getByLabelText('Username');
      expect(input.className).toMatch(/\bborder-default\b/);
      expect(input.className).not.toMatch(/\bborder-neutral-\d+\b/);
    });

    it('should use accent token for primary button', () => {
      render(<LoginPage />);

      const button = screen.getByRole('button', { name: /login/i });
      expect(button.className).toMatch(/\bbg-accent\b/);
      expect(button.className).not.toMatch(/\bbg-primary-\d+\b/);
    });
  });

  describe('RecipesPage', () => {
    it('should use semantic design tokens instead of hardcoded colors', async () => {
      const { container } = render(<RecipesPage />);

      // Wait for page to render
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Cookbook' })).toBeInTheDocument();
      });

      const hardcodedColors = findAllHardcodedColors(container);

      expect(
        hardcodedColors.size,
        `Found hardcoded colors: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
      ).toBe(0);
    });

    it('should use bg-card token for filter container', async () => {
      const { container } = render(<RecipesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Cookbook' })).toBeInTheDocument();
      });

      const filterContainer = container.querySelector('.shadow-soft');
      expect(filterContainer?.className).toMatch(/\bbg-card\b/);
      expect(filterContainer?.className).not.toMatch(/\bbg-white\b/);
    });

    it('should use text-primary token for page heading', async () => {
      render(<RecipesPage />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: 'Cookbook' });
        expect(heading.className).toMatch(/\btext-primary\b/);
        expect(heading.className).not.toMatch(/\btext-neutral-\d+\b/);
      });
    });
  });

  describe('ErrorBoundary', () => {
    // Create a component that throws
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    it('should use semantic design tokens in error UI', () => {
      // Suppress console error for expected error
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const hardcodedColors = findAllHardcodedColors(container);

      expect(
        hardcodedColors.size,
        `Found hardcoded colors: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
      ).toBe(0);

      spy.mockRestore();
    });

    it('should use bg-primary token for error page background', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const mainDiv = container.querySelector('.min-h-screen');
      expect(mainDiv?.className).toMatch(/\bbg-primary\b/);
      expect(mainDiv?.className).not.toMatch(/\bbg-neutral-\d+\b/);

      spy.mockRestore();
    });
  });

  describe('ChatPanel Component', () => {
    const chatPanelProps = {
      isOpen: true,
      onClose: () => {},
      currentRecipe: {
        title: 'Test',
        description: '',
        ingredients: [],
        instructions: [],
        prepTimeMinutes: 0,
        cookTimeMinutes: 0,
        servings: 1,
        cuisineType: '',
        difficultyLevel: 'easy' as const,
        dietaryTags: [],
      },
      onApply: () => {},
    };

    it('should use semantic design tokens instead of hardcoded colors', () => {
      const { container } = render(<ChatPanel {...chatPanelProps} />);

      const hardcodedColors = findAllHardcodedColors(container);

      expect(
        hardcodedColors.size,
        `Found hardcoded colors: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
      ).toBe(0);
    });

    it('should use bg-card token for panel background', () => {
      const { container } = render(<ChatPanel {...chatPanelProps} />);

      const panel = container.querySelector('[role="complementary"]');
      expect(panel?.className).toMatch(/\bbg-card\b/);
      expect(panel?.className).not.toMatch(/\bbg-white\b/);
    });

    it('should use border-default token for panel borders', () => {
      const { container } = render(<ChatPanel {...chatPanelProps} />);

      const panel = container.querySelector('[role="complementary"]');
      expect(panel?.className).toMatch(/\bborder-default\b/);
      expect(panel?.className).not.toMatch(/\bborder-neutral-\d+\b/);
    });
  });

  describe('Theme Consistency', () => {
    it('should render all pages without errors in dark theme', () => {
      localStorage.setItem('theme', 'dark');

      // Render each page and ensure no errors
      expect(() => {
        render(<HomePage />);
      }).not.toThrow();

      expect(() => {
        render(<LoginPage />);
      }).not.toThrow();

      expect(() => {
        render(<RecipesPage />);
      }).not.toThrow();
    });

    it('should render all pages without errors in light theme', () => {
      localStorage.setItem('theme', 'light');

      expect(() => {
        render(<HomePage />);
      }).not.toThrow();

      expect(() => {
        render(<LoginPage />);
      }).not.toThrow();

      expect(() => {
        render(<RecipesPage />);
      }).not.toThrow();
    });

    it('should apply data-theme attribute to document root', () => {
      localStorage.setItem('theme', 'light');

      render(<HomePage />);

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('Tailwind Config Semantic Colors', () => {
    /**
     * This test verifies that the tailwind.config.js has been updated to
     * include semantic color tokens that reference CSS variables.
     *
     * Expected tailwind config colors:
     * colors: {
     *   primary: 'var(--bg-primary)',
     *   secondary: 'var(--bg-secondary)',
     *   card: 'var(--bg-card)',
     *   // ... etc
     * }
     */
    it('should have semantic token classes available in rendered output', () => {
      const { container } = render(
        <div className="bg-card text-primary border-default">Semantic token test</div>
      );

      // After migration, semantic classes should be recognized by Tailwind
      // This test will fail if Tailwind hasn't been configured to use CSS variables
      const testDiv = container.querySelector('div > div');
      expect(testDiv?.className).toContain('bg-card');
      expect(testDiv?.className).toContain('text-primary');
      expect(testDiv?.className).toContain('border-default');

      // Verify the CSS variables are applied (requires proper Tailwind setup)
      const computedStyle = window.getComputedStyle(testDiv as Element);
      // Background color should use CSS variable value, not be empty/transparent
      // This will fail until Tailwind config is updated to use CSS variables
      expect(computedStyle.backgroundColor).not.toBe('');
      expect(computedStyle.backgroundColor).not.toBe('transparent');
    });
  });

  /**
   * ============================================================================
   * ADDITIONAL PAGES AND COMPONENTS - Feature 2: Design Token Migration
   *
   * The following tests verify that ALL pages and components from the plan
   * use semantic design tokens instead of hardcoded Tailwind color classes.
   * ============================================================================
   */

  describe('CreateRecipePage', () => {
    it('should use semantic design tokens instead of hardcoded colors', () => {
      const { container } = render(<CreateRecipePage />);

      const hardcodedColors = findAllHardcodedColors(container);

      expect(
        hardcodedColors.size,
        `Found hardcoded colors in CreateRecipePage: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
      ).toBe(0);
    });

    it('should use text-text-primary token for page heading', () => {
      render(<CreateRecipePage />);

      const heading = screen.getByRole('heading', { level: 1 });
      // Should use text-text-primary, not text-neutral-900
      expect(heading.className).toMatch(/\btext-text-primary\b/);
      expect(heading.className).not.toMatch(/\btext-neutral-\d+\b/);
    });

    it('should use semantic tokens for back button', () => {
      render(<CreateRecipePage />);

      const backButton = screen.getByRole('button', { name: /back to recipes/i });
      // Should use text-accent, not text-primary-500
      expect(backButton.className).toMatch(/\btext-accent\b/);
      expect(backButton.className).not.toMatch(/\btext-primary-\d+\b/);
    });

    it('should use semantic tokens for AI Chat button', () => {
      render(<CreateRecipePage />);

      const chatButton = screen.getByRole('button', { name: /ai chat/i });
      // Should use bg-accent-subtle text-accent, not bg-primary-100 text-primary-700
      expect(chatButton.className).toMatch(/\bbg-accent-subtle\b/);
      expect(chatButton.className).not.toMatch(/\bbg-primary-\d+\b/);
    });
  });

  describe('EditRecipePage', () => {
    it('should use semantic design tokens instead of hardcoded colors', async () => {
      const { container } = render(<EditRecipePage />);

      // Wait for potential loading state
      await waitFor(() => {
        const hardcodedColors = findAllHardcodedColors(container);
        expect(
          hardcodedColors.size,
          `Found hardcoded colors in EditRecipePage: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
        ).toBe(0);
      });
    });

    it('should use semantic tokens for loading spinner', () => {
      const { container } = render(<EditRecipePage />);

      const spinner = container.querySelector('.animate-spin');
      // Should use border-accent, not border-primary-500
      expect(spinner?.className).toMatch(/\bborder-accent\b/);
      expect(spinner?.className).not.toMatch(/\bborder-primary-\d+\b/);
    });
  });

  describe('LibrariesPage', () => {
    it('should use semantic design tokens instead of hardcoded colors', async () => {
      const { container } = render(<LibrariesPage />);

      await waitFor(() => {
        const hardcodedColors = findAllHardcodedColors(container);
        expect(
          hardcodedColors.size,
          `Found hardcoded colors in LibrariesPage: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
        ).toBe(0);
      });
    });

    it('should use text-text-primary token for page heading', async () => {
      render(<LibrariesPage />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /my libraries/i });
        expect(heading.className).toMatch(/\btext-text-primary\b/);
        expect(heading.className).not.toMatch(/\btext-neutral-\d+\b/);
      });
    });

    it('should use bg-accent token for primary button', async () => {
      render(<LibrariesPage />);

      await waitFor(() => {
        const newLibraryButton = screen.getByRole('button', { name: /new library/i });
        // Should use bg-accent, not bg-primary-500
        expect(newLibraryButton.className).toMatch(/\bbg-accent\b/);
        expect(newLibraryButton.className).not.toMatch(/\bbg-primary-\d+\b/);
      });
    });

    it('should use bg-card token for modal background when shown', async () => {
      render(<LibrariesPage />);

      // Click to show create form
      const newLibraryButton = screen.getByRole('button', { name: /new library/i });
      newLibraryButton.click();

      await waitFor(() => {
        const modal = screen.getByRole('heading', { name: /create new library/i }).closest('div');
        // Modal container should use bg-card, not bg-white
        expect(modal?.className).toMatch(/\bbg-card\b/);
        expect(modal?.className).not.toMatch(/\bbg-white\b/);
      });
    });
  });

  describe('LibraryDetailPage', () => {
    it('should use semantic design tokens instead of hardcoded colors', async () => {
      const { container } = render(<LibraryDetailPage />);

      await waitFor(() => {
        const hardcodedColors = findAllHardcodedColors(container);
        expect(
          hardcodedColors.size,
          `Found hardcoded colors in LibraryDetailPage: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
        ).toBe(0);
      });
    });

    it('should use text-accent token for breadcrumb links', async () => {
      const { container } = render(<LibraryDetailPage />);

      await waitFor(() => {
        const breadcrumbLinks = container.querySelectorAll('nav a');
        breadcrumbLinks.forEach((link) => {
          // Should use text-accent, not text-primary-500
          expect(link.className).toMatch(/\btext-accent\b/);
          expect(link.className).not.toMatch(/\btext-primary-\d+\b/);
        });
      });
    });

    it('should use bg-card token for header container', async () => {
      const { container } = render(<LibraryDetailPage />);

      await waitFor(() => {
        const headerCard = container.querySelector('.shadow-soft');
        if (headerCard) {
          // Should use bg-card, not bg-white
          expect(headerCard.className).toMatch(/\bbg-card\b/);
          expect(headerCard.className).not.toMatch(/\bbg-white\b/);
        }
      });
    });
  });

  describe('SettingsPage', () => {
    it('should use semantic design tokens instead of hardcoded colors', async () => {
      const { container } = render(<SettingsPage />);

      await waitFor(() => {
        const hardcodedColors = findAllHardcodedColors(container);
        expect(
          hardcodedColors.size,
          `Found hardcoded colors in SettingsPage: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
        ).toBe(0);
      });
    });

    it('should use text-text-primary token for page heading', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading.className).toMatch(/\btext-text-primary\b/);
        expect(heading.className).not.toMatch(/\btext-neutral-\d+\b/);
      });
    });

    it('should use bg-card token for form container', async () => {
      const { container } = render(<SettingsPage />);

      await waitFor(() => {
        const formContainers = container.querySelectorAll('.shadow-soft');
        formContainers.forEach((formContainer) => {
          // Should use bg-card, not bg-white
          expect(formContainer.className).toMatch(/\bbg-card\b/);
          expect(formContainer.className).not.toMatch(/\bbg-white\b/);
        });
      });
    });

    it('should use border-default token for input borders', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach((input) => {
          // Should use border-default, not border-neutral-300
          expect(input.className).toMatch(/\bborder-default\b/);
          expect(input.className).not.toMatch(/\bborder-neutral-\d+\b/);
        });
      });
    });

    it('should use bg-accent token for save button', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save preferences/i });
        // Should use bg-accent, not bg-primary-500
        expect(saveButton.className).toMatch(/\bbg-accent\b/);
        expect(saveButton.className).not.toMatch(/\bbg-primary-\d+\b/);
      });
    });
  });

  describe('SharedRecipePage', () => {
    it('should use semantic design tokens instead of hardcoded colors', async () => {
      const { container } = render(<SharedRecipePage />);

      await waitFor(() => {
        const hardcodedColors = findAllHardcodedColors(container);
        expect(
          hardcodedColors.size,
          `Found hardcoded colors in SharedRecipePage: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
        ).toBe(0);
      });
    });

    it('should use bg-primary token for page background', async () => {
      const { container } = render(<SharedRecipePage />);

      await waitFor(() => {
        const pageContainer = container.querySelector('.min-h-screen');
        // Should use bg-primary, not bg-neutral-50
        expect(pageContainer?.className).toMatch(/\bbg-primary\b/);
        expect(pageContainer?.className).not.toMatch(/\bbg-neutral-\d+\b/);
      });
    });

    it('should use semantic info tokens for shared banner', async () => {
      const { container } = render(<SharedRecipePage />);

      await waitFor(() => {
        // The shared banner should use semantic info tokens, not hardcoded blue
        const banner = container.querySelector('[class*="border"]');
        if (banner && banner.textContent?.includes('shared')) {
          expect(banner.className).toMatch(/\bbg-info-subtle\b/);
          expect(banner.className).not.toMatch(/\bbg-blue-\d+\b/);
        }
      });
    });

    it('should use bg-card token for recipe card containers', async () => {
      const { container } = render(<SharedRecipePage />);

      await waitFor(() => {
        const cards = container.querySelectorAll('.shadow-soft');
        cards.forEach((card) => {
          // Should use bg-card, not bg-white
          expect(card.className).toMatch(/\bbg-card\b/);
          expect(card.className).not.toMatch(/\bbg-white\b/);
        });
      });
    });

    it('should use semantic difficulty badge tokens', async () => {
      const { container } = render(<SharedRecipePage />);

      await waitFor(() => {
        // Check that difficulty colors use semantic tokens
        const easyBadges = container.querySelectorAll('[class*="success"]');
        easyBadges.forEach((badge) => {
          // Should use bg-success, not bg-success-100
          expect(badge.className).not.toMatch(/\bbg-success-\d+\b/);
        });
      });
    });
  });

  describe('MainLayout Component', () => {
    it('should use semantic design tokens instead of hardcoded colors', () => {
      const { container } = render(
        <MainLayout>
          <div>Test content</div>
        </MainLayout>
      );

      const hardcodedColors = findAllHardcodedColors(container);

      expect(
        hardcodedColors.size,
        `Found hardcoded colors in MainLayout: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
      ).toBe(0);
    });

    it('should use bg-primary token for main background', () => {
      const { container } = render(
        <MainLayout>
          <div>Test content</div>
        </MainLayout>
      );

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer?.className).toMatch(/\bbg-primary\b/);
      expect(mainContainer?.className).not.toMatch(/\bbg-neutral-\d+\b/);
    });
  });

  describe('RecipeForm Component', () => {
    const mockFormData: RecipeFormData = {
      ...DEFAULT_RECIPE_FORM_DATA,
      title: 'Test Recipe',
      description: 'Test description',
    };

    const mockFormProps = {
      value: mockFormData,
      onChange: () => {},
      onSubmit: async () => {},
      onCancel: () => {},
      mode: 'create' as const,
      isSubmitting: false,
    };

    it('should use semantic design tokens instead of hardcoded colors', () => {
      const { container } = render(<RecipeForm {...mockFormProps} />);

      const hardcodedColors = findAllHardcodedColors(container);

      expect(
        hardcodedColors.size,
        `Found hardcoded colors in RecipeForm: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
      ).toBe(0);
    });

    it('should use bg-card token for section backgrounds', () => {
      const { container } = render(<RecipeForm {...mockFormProps} />);

      const sections = container.querySelectorAll('.shadow-soft');
      sections.forEach((section) => {
        // Should use bg-card, not bg-white
        expect(section.className).toMatch(/\bbg-card\b/);
        expect(section.className).not.toMatch(/\bbg-white\b/);
      });
    });

    it('should use text-text-primary token for section headings', () => {
      const { container } = render(<RecipeForm {...mockFormProps} />);

      const headings = container.querySelectorAll('h2');
      headings.forEach((heading) => {
        // Should use text-text-primary, not text-neutral-900
        expect(heading.className).toMatch(/\btext-text-primary\b/);
        expect(heading.className).not.toMatch(/\btext-neutral-\d+\b/);
      });
    });

    it('should use text-text-secondary token for labels', () => {
      const { container } = render(<RecipeForm {...mockFormProps} />);

      const labels = container.querySelectorAll('label');
      labels.forEach((label) => {
        // Should use text-text-secondary, not text-neutral-700
        expect(label.className).toMatch(/\btext-text-secondary\b/);
        expect(label.className).not.toMatch(/\btext-neutral-\d+\b/);
      });
    });

    it('should use border-default token for input borders', () => {
      const { container } = render(<RecipeForm {...mockFormProps} />);

      const inputs = container.querySelectorAll('input, textarea, select');
      inputs.forEach((input) => {
        // Should use border-default, not border-neutral-300
        expect(input.className).toMatch(/\bborder-default\b/);
        expect(input.className).not.toMatch(/\bborder-neutral-\d+\b/);
      });
    });

    it('should use semantic tokens for add/remove buttons', () => {
      const { container } = render(<RecipeForm {...mockFormProps} />);

      // Check "Add Ingredient" and "Add Step" buttons
      const addButtons = container.querySelectorAll('button');
      addButtons.forEach((button) => {
        const text = button.textContent || '';
        if (text.includes('Add')) {
          // Should use text-accent, not text-primary-500
          expect(button.className).toMatch(/\btext-accent\b/);
          expect(button.className).not.toMatch(/\btext-primary-\d+\b/);
        }
        if (text.includes('Remove')) {
          // Should use text-error, not text-error-500
          expect(button.className).toMatch(/\btext-error\b/);
          expect(button.className).not.toMatch(/\btext-error-\d+\b/);
        }
      });
    });

    it('should use bg-accent token for submit button', () => {
      render(<RecipeForm {...mockFormProps} />);

      const submitButton = screen.getByRole('button', { name: /create recipe/i });
      // Should use bg-accent, not bg-primary-500
      expect(submitButton.className).toMatch(/\bbg-accent\b/);
      expect(submitButton.className).not.toMatch(/\bbg-primary-\d+\b/);
    });

    it('should use semantic tokens for dietary tag buttons', () => {
      const { container } = render(<RecipeForm {...mockFormProps} />);

      // Find dietary tag buttons (they contain specific diet names)
      const tagButtons = Array.from(container.querySelectorAll('button')).filter(
        (btn) =>
          btn.textContent?.includes('vegetarian') ||
          btn.textContent?.includes('vegan') ||
          btn.textContent?.includes('gluten-free')
      );

      tagButtons.forEach((button) => {
        // Unselected should use bg-secondary, not bg-neutral-100
        // Selected should use bg-accent, not bg-purple-600
        const isSelected =
          button.className.includes('text-white') ||
          button.className.includes('text-text-on-accent');
        if (isSelected) {
          expect(button.className).toMatch(/\bbg-accent\b/);
          expect(button.className).not.toMatch(/\bbg-purple-\d+\b/);
        } else {
          expect(button.className).toMatch(/\bbg-secondary\b/);
          expect(button.className).not.toMatch(/\bbg-neutral-\d+\b/);
        }
      });
    });

    it('should use semantic step number indicator tokens', () => {
      const { container } = render(<RecipeForm {...mockFormProps} />);

      // Find step number indicators (they show instruction step numbers)
      const stepIndicators = container.querySelectorAll(
        '[data-testid="instruction-row"] > div:first-child'
      );
      stepIndicators.forEach((indicator) => {
        // Should use bg-accent-subtle text-accent, not bg-primary-100 text-primary-700
        expect(indicator.className).toMatch(/\bbg-accent-subtle\b/);
        expect(indicator.className).not.toMatch(/\bbg-primary-\d+\b/);
      });
    });
  });

  describe('RecipeDetailPage', () => {
    it('should use semantic design tokens instead of hardcoded colors', async () => {
      const { container } = render(<RecipeDetailPage />);

      await waitFor(() => {
        const hardcodedColors = findAllHardcodedColors(container);
        expect(
          hardcodedColors.size,
          `Found hardcoded colors in RecipeDetailPage: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
        ).toBe(0);
      });
    });
  });

  describe('ShoppingListPage', () => {
    it('should use semantic design tokens instead of hardcoded colors', async () => {
      const { container } = render(<ShoppingListPage />);

      await waitFor(() => {
        const hardcodedColors = findAllHardcodedColors(container);
        expect(
          hardcodedColors.size,
          `Found hardcoded colors in ShoppingListPage: ${JSON.stringify(Object.fromEntries(hardcodedColors))}`
        ).toBe(0);
      });
    });
  });

  describe('Complete Page Coverage - Theme Consistency', () => {
    it('should render all additional pages without errors in dark theme', () => {
      localStorage.setItem('theme', 'dark');

      expect(() => {
        render(<CreateRecipePage />);
      }).not.toThrow();

      expect(() => {
        render(<EditRecipePage />);
      }).not.toThrow();

      expect(() => {
        render(<LibrariesPage />);
      }).not.toThrow();

      expect(() => {
        render(<LibraryDetailPage />);
      }).not.toThrow();

      expect(() => {
        render(<SettingsPage />);
      }).not.toThrow();

      expect(() => {
        render(<SharedRecipePage />);
      }).not.toThrow();

      expect(() => {
        render(<ShoppingListPage />);
      }).not.toThrow();
    });

    it('should render all additional pages without errors in light theme', () => {
      localStorage.setItem('theme', 'light');

      expect(() => {
        render(<CreateRecipePage />);
      }).not.toThrow();

      expect(() => {
        render(<EditRecipePage />);
      }).not.toThrow();

      expect(() => {
        render(<LibrariesPage />);
      }).not.toThrow();

      expect(() => {
        render(<LibraryDetailPage />);
      }).not.toThrow();

      expect(() => {
        render(<SettingsPage />);
      }).not.toThrow();

      expect(() => {
        render(<SharedRecipePage />);
      }).not.toThrow();

      expect(() => {
        render(<ShoppingListPage />);
      }).not.toThrow();
    });
  });
});
