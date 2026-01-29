/**
 * Tests for ThemeContext
 *
 * Verifies theming infrastructure: light/dark modes, system preference detection,
 * localStorage persistence, and CSS custom properties application.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { screen, waitFor } from '../test/test-utils';
import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { useTheme, ThemeProvider } from './ThemeContext';

// Test component that consumes the theme context
function TestComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <div data-testid="current-theme">Current theme: {theme}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  );
}

// Wrapper that provides ThemeProvider without other test-utils providers
function ThemeOnlyWrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset document data-theme attribute
    document.documentElement.removeAttribute('data-theme');
    // Reset matchMedia mock
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should provide current theme and toggle function', () => {
    rtlRender(<TestComponent />, { wrapper: ThemeOnlyWrapper });

    // Context should provide theme value
    expect(screen.getByTestId('current-theme')).toHaveTextContent(/Current theme:/);
    // Context should provide toggle function (button should be clickable)
    expect(screen.getByRole('button', { name: 'Toggle Theme' })).toBeInTheDocument();
  });

  it('should toggle between light and dark modes', async () => {
    const user = userEvent.setup();

    rtlRender(<TestComponent />, { wrapper: ThemeOnlyWrapper });

    const initialTheme = screen.getByTestId('current-theme').textContent;
    const toggleButton = screen.getByRole('button', { name: 'Toggle Theme' });

    await user.click(toggleButton);

    const newTheme = screen.getByTestId('current-theme').textContent;
    expect(newTheme).not.toBe(initialTheme);

    // Toggle again to verify it switches back
    await user.click(toggleButton);

    const toggledBackTheme = screen.getByTestId('current-theme').textContent;
    expect(toggledBackTheme).toBe(initialTheme);
  });

  it('should persist theme preference to localStorage', async () => {
    const user = userEvent.setup();

    rtlRender(<TestComponent />, { wrapper: ThemeOnlyWrapper });

    // Initially localStorage should be empty
    expect(localStorage.getItem('theme')).toBeNull();

    // Set theme to light
    await user.click(screen.getByRole('button', { name: 'Set Light' }));

    // Should be persisted
    expect(localStorage.getItem('theme')).toBe('light');

    // Set theme to dark
    await user.click(screen.getByRole('button', { name: 'Set Dark' }));

    // Should update
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should load theme from localStorage on mount', async () => {
    // Pre-set theme in localStorage
    localStorage.setItem('theme', 'light');

    rtlRender(<TestComponent />, { wrapper: ThemeOnlyWrapper });

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('Current theme: light');
    });
  });

  it('should respect system preference on first visit when no stored preference', async () => {
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

    // No stored preference
    expect(localStorage.getItem('theme')).toBeNull();

    rtlRender(<TestComponent />, { wrapper: ThemeOnlyWrapper });

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('Current theme: dark');
    });
  });

  it('should apply data-theme attribute to document root', async () => {
    const user = userEvent.setup();

    rtlRender(<TestComponent />, { wrapper: ThemeOnlyWrapper });

    // Set to light mode
    await user.click(screen.getByRole('button', { name: 'Set Light' }));

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    // Set to dark mode
    await user.click(screen.getByRole('button', { name: 'Set Dark' }));

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  it('should throw error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test since React will log the error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      function BadComponent() {
        useTheme();
        return null;
      }
      rtlRender(<BadComponent />, {
        wrapper: ({ children }: { children: ReactNode }) => <>{children}</>,
      });
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});

/**
 * Tests for Season functionality in ThemeContext
 *
 * Extends ThemeContext to support seasonal theme variations:
 * - Spring: #66bb6a (fresh green)
 * - Summer: #ffa726 (warm orange)
 * - Fall: #e07850 (coral - default)
 * - Winter: #5c9dc4 (cool blue)
 */

// Season-specific accent colors
const SEASON_COLORS = {
  spring: '#66bb6a',
  summer: '#ffa726',
  fall: '#e07850',
  winter: '#5c9dc4',
} as const;

type Season = keyof typeof SEASON_COLORS;

// Extended test component that consumes season from theme context
function SeasonTestComponent() {
  // This will need to be extended in ThemeContext to include season
  const { theme, season, setSeason } = useTheme() as {
    theme: string;
    season: Season;
    setSeason: (season: Season) => void;
  };

  return (
    <div>
      <div data-testid="current-theme">Current theme: {theme}</div>
      <div data-testid="current-season">Current season: {season}</div>
      <button onClick={() => setSeason('spring')}>Set Spring</button>
      <button onClick={() => setSeason('summer')}>Set Summer</button>
      <button onClick={() => setSeason('fall')}>Set Fall</button>
      <button onClick={() => setSeason('winter')}>Set Winter</button>
    </div>
  );
}

describe('ThemeContext - Season functionality', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-season');
    document.documentElement.style.removeProperty('--accent');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-season');
    document.documentElement.style.removeProperty('--accent');
  });

  it('should provide current season via context', () => {
    rtlRender(<SeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    // Context should provide season value
    expect(screen.getByTestId('current-season')).toHaveTextContent(/Current season:/);
  });

  it('should default to Fall season', () => {
    rtlRender(<SeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    expect(screen.getByTestId('current-season')).toHaveTextContent('Current season: fall');
  });

  it('should allow changing season via setSeason', async () => {
    const user = userEvent.setup();

    rtlRender(<SeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    await user.click(screen.getByRole('button', { name: 'Set Spring' }));

    await waitFor(() => {
      expect(screen.getByTestId('current-season')).toHaveTextContent('Current season: spring');
    });
  });

  it('should persist season preference to localStorage', async () => {
    const user = userEvent.setup();

    rtlRender(<SeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    await user.click(screen.getByRole('button', { name: 'Set Winter' }));

    await waitFor(() => {
      expect(localStorage.getItem('season')).toBe('winter');
    });
  });

  it('should load season from localStorage on mount', () => {
    localStorage.setItem('season', 'summer');

    rtlRender(<SeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    expect(screen.getByTestId('current-season')).toHaveTextContent('Current season: summer');
  });

  it('should apply data-season attribute to document root', async () => {
    const user = userEvent.setup();

    rtlRender(<SeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    await user.click(screen.getByRole('button', { name: 'Set Spring' }));

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-season')).toBe('spring');
    });
  });

  it('should update --accent CSS variable when season changes', async () => {
    const user = userEvent.setup();

    rtlRender(<SeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    // Change to each season and verify accent color
    await user.click(screen.getByRole('button', { name: 'Set Spring' }));
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
        SEASON_COLORS.spring
      );
    });

    await user.click(screen.getByRole('button', { name: 'Set Summer' }));
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
        SEASON_COLORS.summer
      );
    });

    await user.click(screen.getByRole('button', { name: 'Set Winter' }));
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
        SEASON_COLORS.winter
      );
    });
  });

  it('should apply correct accent color for each season', async () => {
    const user = userEvent.setup();

    rtlRender(<SeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    // Verify each season has its designated accent color
    for (const [season, expectedColor] of Object.entries(SEASON_COLORS)) {
      await user.click(
        screen.getByRole('button', {
          name: `Set ${season.charAt(0).toUpperCase() + season.slice(1)}`,
        })
      );
      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--accent')).toBe(expectedColor);
      });
    }
  });

  it('should maintain season when theme changes from dark to light', async () => {
    const user = userEvent.setup();

    // Start with dark theme and winter season
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('season', 'winter');

    // Need a component that can toggle theme and show season
    function ThemeAndSeasonComponent() {
      const { theme, toggleTheme, season } = useTheme() as {
        theme: string;
        toggleTheme: () => void;
        season: Season;
      };

      return (
        <div>
          <div data-testid="current-theme">{theme}</div>
          <div data-testid="current-season">{season}</div>
          <button onClick={toggleTheme}>Toggle Theme</button>
        </div>
      );
    }

    rtlRender(<ThemeAndSeasonComponent />, { wrapper: ThemeOnlyWrapper });

    // Verify initial state
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('current-season')).toHaveTextContent('winter');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe(SEASON_COLORS.winter);

    // Toggle theme to light
    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }));

    // Season should still be winter, but accent updates to light-mode value
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
    expect(screen.getByTestId('current-season')).toHaveTextContent('winter');
    // Light mode winter accent is #4a8ab4 (mode-specific accent values)
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#4a8ab4');
  });

  it('should maintain season when theme changes from light to dark', async () => {
    const user = userEvent.setup();

    // Start with light theme and spring season
    localStorage.setItem('theme', 'light');
    localStorage.setItem('season', 'spring');

    function ThemeAndSeasonComponent() {
      const { theme, toggleTheme, season } = useTheme() as {
        theme: string;
        toggleTheme: () => void;
        season: Season;
      };

      return (
        <div>
          <div data-testid="current-theme">{theme}</div>
          <div data-testid="current-season">{season}</div>
          <button onClick={toggleTheme}>Toggle Theme</button>
        </div>
      );
    }

    rtlRender(<ThemeAndSeasonComponent />, { wrapper: ThemeOnlyWrapper });

    // Verify initial state
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('current-season')).toHaveTextContent('spring');

    // Toggle theme to dark
    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }));

    // Season should still be spring with correct accent
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
    expect(screen.getByTestId('current-season')).toHaveTextContent('spring');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe(SEASON_COLORS.spring);
  });
});

/**
 * Tests for Expanded Seasonal Theme System (14 CSS variables per season/mode)
 *
 * The new system replaces the 3-variable approach (--accent, --accent-hover, --accent-subtle)
 * with 14 CSS variables per season per mode (dark/light), enabling full theme customization.
 */

// All 14 CSS variables that must be set per season per mode
const EXPANDED_SEASON_VARIABLES = [
  '--accent',
  '--accent-hover',
  '--accent-subtle',
  '--bg-primary',
  '--bg-secondary',
  '--bg-card',
  '--bg-hover',
  '--border',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--card-shadow',
  '--card-border',
  '--season-gradient',
] as const;

// Expected values from the prototype for verification
const EXPECTED_SPRING_DARK = {
  '--accent': '#66bb6a',
  '--bg-primary': '#152215',
  '--text-primary': '#e8f5e8',
};

const EXPECTED_SPRING_LIGHT = {
  '--accent': '#4caf50',
  '--bg-primary': '#eaf5ea',
  '--text-primary': '#1a2e1a',
};

const EXPECTED_FALL_DARK = {
  '--accent': '#e07850',
  '--bg-primary': '#1e1410',
};

const EXPECTED_FALL_LIGHT = {
  '--accent': '#e07850',
  '--bg-primary': '#faf0ea',
};

// Test component that exposes both season and theme toggling
function ExpandedSeasonTestComponent() {
  const { theme, toggleTheme, season, setSeason } = useTheme() as {
    theme: string;
    toggleTheme: () => void;
    season: Season;
    setSeason: (season: Season) => void;
  };

  return (
    <div>
      <div data-testid="current-theme">Current theme: {theme}</div>
      <div data-testid="current-season">Current season: {season}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setSeason('spring')}>Set Spring</button>
      <button onClick={() => setSeason('summer')}>Set Summer</button>
      <button onClick={() => setSeason('fall')}>Set Fall</button>
      <button onClick={() => setSeason('winter')}>Set Winter</button>
    </div>
  );
}

describe('ThemeContext - Expanded seasonal theme system (14 variables)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-season');
    EXPANDED_SEASON_VARIABLES.forEach((v) => document.documentElement.style.removeProperty(v));
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-season');
    EXPANDED_SEASON_VARIABLES.forEach((v) => document.documentElement.style.removeProperty(v));
  });

  it('should set all 14 CSS variables when a season is applied', async () => {
    const user = userEvent.setup();

    rtlRender(<ExpandedSeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    await user.click(screen.getByRole('button', { name: 'Set Spring' }));

    await waitFor(() => {
      for (const varName of EXPANDED_SEASON_VARIABLES) {
        const value = document.documentElement.style.getPropertyValue(varName);
        expect(value, `Expected ${varName} to be set but it was empty`).not.toBe('');
      }
    });
  });

  it('should set --bg-primary for spring dark to #152215', async () => {
    localStorage.setItem('theme', 'dark');

    rtlRender(<ExpandedSeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Set Spring' }));

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--bg-primary')).toBe(
        EXPECTED_SPRING_DARK['--bg-primary']
      );
    });
  });

  it('should set --text-primary for spring dark to #e8f5e8', async () => {
    localStorage.setItem('theme', 'dark');

    rtlRender(<ExpandedSeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Set Spring' }));

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--text-primary')).toBe(
        EXPECTED_SPRING_DARK['--text-primary']
      );
    });
  });

  it('should produce different --bg-primary values for dark vs light mode (spring)', async () => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('season', 'spring');

    rtlRender(<ExpandedSeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--bg-primary')).toBe(
        EXPECTED_SPRING_DARK['--bg-primary']
      );
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('Current theme: light');
    });

    // After toggling to light, --bg-primary should change to the light value
    expect(document.documentElement.style.getPropertyValue('--bg-primary')).toBe(
      EXPECTED_SPRING_LIGHT['--bg-primary']
    );
  });

  it('should use different --accent for spring light (#4caf50) vs spring dark (#66bb6a)', async () => {
    localStorage.setItem('theme', 'light');
    localStorage.setItem('season', 'spring');

    rtlRender(<ExpandedSeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
        EXPECTED_SPRING_LIGHT['--accent']
      );
    });
  });

  it('should set --bg-primary for fall dark to #1e1410', async () => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('season', 'fall');

    rtlRender(<ExpandedSeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--bg-primary')).toBe(
        EXPECTED_FALL_DARK['--bg-primary']
      );
    });
  });

  it('should set --bg-primary for fall light to #faf0ea', async () => {
    localStorage.setItem('theme', 'light');
    localStorage.setItem('season', 'fall');

    rtlRender(<ExpandedSeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--bg-primary')).toBe(
        EXPECTED_FALL_LIGHT['--bg-primary']
      );
    });
  });

  it('should re-apply season colors with new mode values when theme is toggled', async () => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('season', 'fall');

    rtlRender(<ExpandedSeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--bg-primary')).toBe(
        EXPECTED_FALL_DARK['--bg-primary']
      );
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('Current theme: light');
    });

    // After toggling, fall light values should be applied
    expect(document.documentElement.style.getPropertyValue('--bg-primary')).toBe(
      EXPECTED_FALL_LIGHT['--bg-primary']
    );
  });

  it('should set --card-shadow CSS variable when season is applied', async () => {
    const user = userEvent.setup();

    rtlRender(<ExpandedSeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    await user.click(screen.getByRole('button', { name: 'Set Spring' }));

    await waitFor(() => {
      const cardShadow = document.documentElement.style.getPropertyValue('--card-shadow');
      expect(cardShadow, 'Expected --card-shadow to be set').not.toBe('');
    });
  });

  it('should set --season-gradient CSS variable when season is applied', async () => {
    const user = userEvent.setup();

    rtlRender(<ExpandedSeasonTestComponent />, { wrapper: ThemeOnlyWrapper });

    await user.click(screen.getByRole('button', { name: 'Set Spring' }));

    await waitFor(() => {
      const gradient = document.documentElement.style.getPropertyValue('--season-gradient');
      expect(gradient, 'Expected --season-gradient to be set').not.toBe('');
    });
  });
});
