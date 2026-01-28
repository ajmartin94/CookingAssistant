/**
 * Tests for SeasonPicker component
 *
 * Verifies the season picker: renders all season options, selecting a season
 * updates CSS variables (--accent), persists across page reloads, each season
 * has distinct accent color, and seasonal themes work in both light and dark modes.
 *
 * Feature: Seasonal Themes
 * Acceptance Criteria:
 * - Season selector renders four options (Spring, Summer, Fall, Winter)
 * - Selecting season updates CSS variables (--accent changes)
 * - Season persists across page reloads
 * - Each season has distinct accent color
 * - Seasonal themes work in both light and dark modes
 *
 * Colors:
 * - Spring: #66bb6a (fresh green)
 * - Summer: #ffa726 (warm orange)
 * - Fall: #e07850 (coral - default)
 * - Winter: #5c9dc4 (cool blue)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '../../test/test-utils';
import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { SeasonPicker } from './SeasonPicker';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Season accent colors as defined in the plan
const SEASON_COLORS = {
  spring: '#66bb6a',
  summer: '#ffa726',
  fall: '#e07850',
  winter: '#5c9dc4',
} as const;

// Wrapper that provides ThemeProvider for season tests
function SeasonTestWrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('SeasonPicker', () => {
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

  describe('Season selector renders four options', () => {
    it('should render all four season options: Spring, Summer, Fall, Winter', () => {
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      // Should have a radiogroup or select with season options
      expect(screen.getByRole('radio', { name: /spring/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /summer/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /fall/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /winter/i })).toBeInTheDocument();
    });

    it('should have Fall selected as the default season', () => {
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      // Fall should be the default (as per design system with #e07850 as default accent)
      expect(screen.getByRole('radio', { name: /fall/i })).toBeChecked();
    });

    it('should render within a labeled group for accessibility', () => {
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      // Should have an accessible group label
      expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
    });
  });

  describe('Selecting season updates CSS variables', () => {
    it('should update --accent CSS variable when Spring is selected', async () => {
      const user = userEvent.setup();
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      await user.click(screen.getByRole('radio', { name: /spring/i }));

      await waitFor(() => {
        const accentValue = document.documentElement.style.getPropertyValue('--accent');
        expect(accentValue).toBe(SEASON_COLORS.spring);
      });
    });

    it('should update --accent CSS variable when Summer is selected', async () => {
      const user = userEvent.setup();
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      await user.click(screen.getByRole('radio', { name: /summer/i }));

      await waitFor(() => {
        const accentValue = document.documentElement.style.getPropertyValue('--accent');
        expect(accentValue).toBe(SEASON_COLORS.summer);
      });
    });

    it('should update --accent CSS variable when Fall is selected', async () => {
      const user = userEvent.setup();
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      // First select a different season
      await user.click(screen.getByRole('radio', { name: /spring/i }));

      // Then select Fall
      await user.click(screen.getByRole('radio', { name: /fall/i }));

      await waitFor(() => {
        const accentValue = document.documentElement.style.getPropertyValue('--accent');
        expect(accentValue).toBe(SEASON_COLORS.fall);
      });
    });

    it('should update --accent CSS variable when Winter is selected', async () => {
      const user = userEvent.setup();
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      await user.click(screen.getByRole('radio', { name: /winter/i }));

      await waitFor(() => {
        const accentValue = document.documentElement.style.getPropertyValue('--accent');
        expect(accentValue).toBe(SEASON_COLORS.winter);
      });
    });

    it('should apply data-season attribute to document root when season changes', async () => {
      const user = userEvent.setup();
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      await user.click(screen.getByRole('radio', { name: /winter/i }));

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-season')).toBe('winter');
      });
    });
  });

  describe('Season persists across page reloads', () => {
    it('should persist selected season to localStorage', async () => {
      const user = userEvent.setup();
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      await user.click(screen.getByRole('radio', { name: /spring/i }));

      await waitFor(() => {
        expect(localStorage.getItem('season')).toBe('spring');
      });
    });

    it('should load saved season from localStorage on mount', () => {
      // Pre-set season in localStorage
      localStorage.setItem('season', 'winter');

      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      expect(screen.getByRole('radio', { name: /winter/i })).toBeChecked();
    });

    it('should apply saved season CSS variables on initial render', () => {
      // Pre-set season in localStorage
      localStorage.setItem('season', 'summer');

      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      // CSS variable should be applied immediately
      const accentValue = document.documentElement.style.getPropertyValue('--accent');
      expect(accentValue).toBe(SEASON_COLORS.summer);
    });

    it('should preserve season selection after unmount and remount', async () => {
      const user = userEvent.setup();

      // First render: select a season
      const { unmount } = rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      await user.click(screen.getByRole('radio', { name: /spring/i }));

      await waitFor(() => {
        expect(localStorage.getItem('season')).toBe('spring');
      });

      // Unmount (simulate leaving the page)
      unmount();

      // Clear document state (simulating page reload effect)
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.removeAttribute('data-season');

      // Re-render (simulate coming back)
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      // Verify persisted selection
      expect(screen.getByRole('radio', { name: /spring/i })).toBeChecked();
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
        SEASON_COLORS.spring
      );
    });
  });

  describe('Each season has distinct accent color', () => {
    it('should have unique accent colors for all seasons', () => {
      const colors = Object.values(SEASON_COLORS);
      const uniqueColors = new Set(colors);

      // All four seasons should have distinct colors
      expect(uniqueColors.size).toBe(4);
    });

    it('should apply Spring green accent (#66bb6a)', async () => {
      const user = userEvent.setup();
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      await user.click(screen.getByRole('radio', { name: /spring/i }));

      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#66bb6a');
      });
    });

    it('should apply Summer orange accent (#ffa726)', async () => {
      const user = userEvent.setup();
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      await user.click(screen.getByRole('radio', { name: /summer/i }));

      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#ffa726');
      });
    });

    it('should apply Fall coral accent (#e07850)', async () => {
      const user = userEvent.setup();
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      // Select something else first, then fall
      await user.click(screen.getByRole('radio', { name: /winter/i }));
      await user.click(screen.getByRole('radio', { name: /fall/i }));

      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#e07850');
      });
    });

    it('should apply Winter blue accent (#5c9dc4)', async () => {
      const user = userEvent.setup();
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      await user.click(screen.getByRole('radio', { name: /winter/i }));

      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#5c9dc4');
      });
    });
  });

  describe('Seasonal themes work in both light and dark modes', () => {
    it('should maintain season accent when theme is toggled to light mode', async () => {
      const user = userEvent.setup();

      // Start in dark mode (default)
      localStorage.setItem('theme', 'dark');

      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      // Select Spring season
      await user.click(screen.getByRole('radio', { name: /spring/i }));

      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
          SEASON_COLORS.spring
        );
      });

      // Simulate theme change to light (via localStorage change)
      localStorage.setItem('theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');

      // Season accent should still be Spring green
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
        SEASON_COLORS.spring
      );
    });

    it('should maintain season accent when theme is toggled to dark mode', async () => {
      const user = userEvent.setup();

      // Start in light mode
      localStorage.setItem('theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');

      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      // Select Winter season
      await user.click(screen.getByRole('radio', { name: /winter/i }));

      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
          SEASON_COLORS.winter
        );
      });

      // Simulate theme change to dark
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');

      // Season accent should still be Winter blue
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
        SEASON_COLORS.winter
      );
    });

    it('should apply season correctly regardless of initial theme setting (dark)', async () => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('season', 'summer');

      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      // Summer should be selected and applied
      expect(screen.getByRole('radio', { name: /summer/i })).toBeChecked();
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
        SEASON_COLORS.summer
      );
    });

    it('should apply season correctly regardless of initial theme setting (light)', async () => {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('season', 'winter');

      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      // Winter should be selected and applied
      expect(screen.getByRole('radio', { name: /winter/i })).toBeChecked();
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
        SEASON_COLORS.winter
      );
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible - can navigate with arrow keys', async () => {
      const user = userEvent.setup();
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      // Focus the radiogroup
      const fallRadio = screen.getByRole('radio', { name: /fall/i });
      fallRadio.focus();

      // Navigate with arrow keys
      await user.keyboard('{ArrowRight}');

      // Should move to next option
      await waitFor(() => {
        const focusedRadio = document.activeElement;
        expect(focusedRadio).toHaveAttribute('value');
      });
    });

    it('should have visible focus indicators', () => {
      rtlRender(<SeasonPicker />, { wrapper: SeasonTestWrapper });

      const springRadio = screen.getByRole('radio', { name: /spring/i });
      springRadio.focus();

      // The radio button should be focusable
      expect(springRadio).toHaveFocus();
    });
  });
});
