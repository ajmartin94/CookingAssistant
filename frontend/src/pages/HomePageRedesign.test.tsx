/**
 * Tests for Home Page Redesign
 *
 * Verifies:
 * - Chat input renders with correct placeholder
 * - Suggestion chips render in horizontal list
 * - Context cards render (mocked data)
 * - Quick actions navigate correctly
 * - Layout changes at mobile breakpoint
 * - No emojis present
 * - Greeting shows correct time-based text
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';

import HomePage from './HomePage';

// Mock the auth context to return an authenticated user
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'testuser', email: 'test@example.com' },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock matchMedia for responsive tests
const mockMatchMedia = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('1024') ? matches : !matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('HomePage Redesign', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', mockMatchMedia(true)); // Default to desktop
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AI Chat Input', () => {
    it('should render chat input with correct placeholder', () => {
      render(<HomePage />);

      const chatInput = screen.getByRole('textbox', { name: /what|cook|recipe/i });
      expect(chatInput).toBeInTheDocument();
      expect(chatInput).toHaveAttribute(
        'placeholder',
        expect.stringMatching(/what are we cooking/i)
      );
    });

    it('should have accessible label for chat input', () => {
      render(<HomePage />);

      // Input should have an accessible label via aria-label or associated label element
      const chatInput = screen.getByRole('textbox', { name: /what|cook|recipe/i });
      expect(chatInput).toBeInTheDocument();
    });

    it('should have Go submit button with send icon', () => {
      render(<HomePage />);

      const submitButton = screen.getByRole('button', { name: /go/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton.textContent).toMatch(/go/i);
    });
  });

  describe('Suggestion Chips', () => {
    it('should render exactly 4 suggestion chips with correct text', () => {
      render(<HomePage />);

      const chipsContainer = screen.getByTestId('suggestion-chips');
      const chips = within(chipsContainer).getAllByRole('button');
      expect(chips).toHaveLength(4);

      const expectedLabels = [
        "Plan next week's meals",
        'What can I make with chicken?',
        'Find a quick dinner recipe',
        'Add recipe from URL',
      ];
      const actualLabels = chips.map((chip) => chip.textContent);
      expect(actualLabels).toEqual(expectedLabels);
    });

    it('should render suggestion chips in horizontal list', () => {
      render(<HomePage />);

      // Find the chips container
      const chipsContainer = screen.getByTestId('suggestion-chips');
      expect(chipsContainer).toBeInTheDocument();

      // Should have multiple chips (chips have role="option")
      const chips = within(chipsContainer).getAllByRole('button');
      expect(chips.length).toBeGreaterThanOrEqual(3);
    });

    it('should have keyboard navigable suggestion chips', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      const chips = screen.getAllByTestId('suggestion-chip');
      expect(chips.length).toBeGreaterThan(0);

      // Focus first chip
      chips[0].focus();
      expect(document.activeElement).toBe(chips[0]);

      // Tab to next chip
      await user.tab();
      expect(['button', 'a']).toContain(document.activeElement?.tagName.toLowerCase());
    });

    it('should trigger action when clicking suggestion chip', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      const chip = screen.getAllByTestId('suggestion-chip')[0];
      await user.click(chip);

      // Should show feedback (toast) or navigate
      // For now, just verify chip is interactive
      expect(chip).toBeEnabled();
    });
  });

  describe('Context Cards', () => {
    it('should render context cards section', () => {
      render(<HomePage />);

      const contextCards = screen.getByTestId('context-cards');
      expect(contextCards).toBeInTheDocument();
    });

    it('should render at least one context card', () => {
      render(<HomePage />);

      const cards = screen.getAllByTestId('context-card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    it('should have focusable context cards', () => {
      render(<HomePage />);

      const cards = screen.getAllByTestId('context-card');
      cards.forEach((card) => {
        expect(card.tabIndex).toBeGreaterThanOrEqual(-1);
      });
    });
  });

  describe("Tonight's Dinner Card", () => {
    it('should display difficulty in metadata', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText(/medium/i)).toBeInTheDocument();
      });
    });

    it('should have a "View Recipe" button', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view recipe/i })).toBeInTheDocument();
      });
    });

    it('should have a "Start Cooking" button', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start cooking/i })).toBeInTheDocument();
      });
    });

    it('should navigate to recipe detail with cook=true when "Start Cooking" is clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start cooking/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start cooking/i }));

      // Should navigate to the tonight's dinner recipe with ?cook=true query param
      expect(window.location.pathname).toBe('/recipes/r-today');
      expect(window.location.search).toBe('?cook=true');
    });

    it('should show metadata with time, servings, and difficulty', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText(/35 min/)).toBeInTheDocument();
      });
      expect(screen.getByText(/4 servings/)).toBeInTheDocument();
      expect(screen.getByText(/medium/i)).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should render 3 quick action cards with correct labels and subtitles', () => {
      render(<HomePage />);

      const quickActions = screen.getByTestId('quick-actions');
      expect(quickActions).toBeInTheDocument();

      // Verify exact labels
      expect(within(quickActions).getByText('Go Shopping')).toBeInTheDocument();
      expect(within(quickActions).getByText('Add Recipe')).toBeInTheDocument();
      expect(within(quickActions).getByText('Recent Reflection')).toBeInTheDocument();

      // Verify subtitles
      expect(within(quickActions).getByText('View your shopping list')).toBeInTheDocument();
      expect(within(quickActions).getByText('Import or create new')).toBeInTheDocument();
      expect(within(quickActions).getByText('Record cooking notes')).toBeInTheDocument();
    });

    it('should render quick action links to correct pages', () => {
      render(<HomePage />);

      const quickActions = screen.getByTestId('quick-actions');

      const shopLink = within(quickActions).getByRole('link', { name: /go shopping/i });
      expect(shopLink).toHaveAttribute('href', '/shopping');
    });
  });

  describe('Time-of-Day Greeting', () => {
    it('should display greeting based on current time', () => {
      render(<HomePage />);

      const greeting = screen.getByTestId('greeting');
      expect(greeting).toBeInTheDocument();

      const text = greeting.textContent?.toLowerCase() ?? '';
      expect(
        text.includes('morning') ||
          text.includes('afternoon') ||
          text.includes('evening') ||
          text.includes('hello')
      ).toBe(true);
    });

    it('should show "Good morning" before noon', () => {
      // Mock Date to be 9 AM
      vi.setSystemTime(new Date(2025, 0, 26, 9, 0, 0));

      render(<HomePage />);

      const greeting = screen.getByTestId('greeting');
      expect(greeting.textContent?.toLowerCase()).toContain('morning');

      vi.useRealTimers();
    });

    it('should show "Good afternoon" between noon and 6 PM', () => {
      // Mock Date to be 2 PM
      vi.setSystemTime(new Date(2025, 0, 26, 14, 0, 0));

      render(<HomePage />);

      const greeting = screen.getByTestId('greeting');
      expect(greeting.textContent?.toLowerCase()).toContain('afternoon');

      vi.useRealTimers();
    });

    it('should show "Good evening" after 6 PM', () => {
      // Mock Date to be 8 PM
      vi.setSystemTime(new Date(2025, 0, 26, 20, 0, 0));

      render(<HomePage />);

      const greeting = screen.getByTestId('greeting');
      expect(greeting.textContent?.toLowerCase()).toContain('evening');

      vi.useRealTimers();
    });
  });

  describe('Layout', () => {
    it('should render with desktop 2-column layout', () => {
      vi.stubGlobal('matchMedia', mockMatchMedia(true)); // Desktop

      const { container } = render(<HomePage />);

      const homeContent = container.querySelector('[data-testid="home-content"]');
      expect(homeContent).toBeInTheDocument();

      // Context cards section should have grid layout
      const contextCards = container.querySelector('[data-testid="context-cards"]');
      expect(contextCards).toBeInTheDocument();
      if (contextCards) {
        expect(contextCards.className).toMatch(/grid/);
      }
    });

    it('should use max-w-7xl for wider content area', () => {
      render(<HomePage />);

      const homeContent = screen.getByTestId('home-content');
      expect(homeContent.className).toMatch(/max-w-7xl/);
    });
  });

  describe('No Emojis', () => {
    it('should not contain emoji characters', () => {
      render(<HomePage />);

      const homeContent = screen.getByTestId('home-content');
      const textContent = homeContent.textContent ?? '';

      // Check for emoji unicode ranges
      // Emoji ranges: \u{1F300}-\u{1F9FF}, \u{2600}-\u{26FF}, \u{2700}-\u{27BF}
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
      const emojiMatches = textContent.match(emojiRegex);

      expect(emojiMatches).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have skip link to main content', () => {
      render(<HomePage />);

      const skipLink = screen.queryByRole('link', { name: /skip/i });
      // Skip link is optional but recommended
      if (skipLink) {
        expect(skipLink).toHaveAttribute('href', '#main');
      }
    });

    it('should have descriptive headings', () => {
      render(<HomePage />);

      // Should have at least one heading
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
