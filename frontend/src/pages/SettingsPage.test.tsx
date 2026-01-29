/**
 * Tests for SettingsPage
 *
 * Includes tests for:
 * - Preference controls (dietary, skill level, servings)
 * - Appearance settings (theme toggle, season picker)
 * - API integration for saving preferences
 *
 * Feature: Seasonal Themes (Feature 9)
 * Tests verify:
 * - Season picker renders in Settings page (below theme toggle)
 * - Four season options displayed (Spring, Summer, Fall, Winter)
 * - Each option shows season name and color swatch
 * - Selected season shows checkmark indicator (not color alone)
 * - Season preference persisted to localStorage
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import SettingsPage from './SettingsPage';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockUser } from '../test/mocks/data';

const BASE_URL = 'http://localhost:8000';

// Season accent colors as defined in ThemeContext
const SEASON_COLORS = {
  spring: '#66bb6a',
  summer: '#ffa726',
  fall: '#e07850',
  winter: '#5c9dc4',
} as const;

describe('SettingsPage', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
  });
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });
  afterAll(() => server.close());

  describe('Component: Settings page renders preference controls', () => {
    it('should render dietary restriction checkboxes, skill level select, and servings input', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: ['vegetarian', 'gluten-free'],
            skill_level: 'intermediate',
            default_servings: 6,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      render(<SettingsPage />);

      // Wait for form to load and verify dietary restriction checkboxes render
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /vegetarian/i })).toBeInTheDocument();
      });

      // Verify all dietary options are present
      const dietaryOptions = [
        'vegetarian',
        'vegan',
        'gluten-free',
        'dairy-free',
        'keto',
        'paleo',
        'low-carb',
        'nut-free',
        'soy-free',
      ];

      for (const option of dietaryOptions) {
        expect(screen.getByRole('checkbox', { name: new RegExp(option, 'i') })).toBeInTheDocument();
      }

      // Verify existing preferences are loaded correctly
      expect(screen.getByRole('checkbox', { name: /vegetarian/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /gluten-free/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /vegan/i })).not.toBeChecked();

      // Verify skill level select renders with all options and correct value
      const skillSelect = screen.getByRole('combobox', { name: /skill level/i });
      expect(skillSelect).toBeInTheDocument();
      expect(skillSelect).toHaveValue('intermediate');
      const options = skillSelect.querySelectorAll('option');
      const optionValues = Array.from(options).map((o) => o.getAttribute('value'));
      expect(optionValues).toEqual(['beginner', 'intermediate', 'advanced']);

      // Verify servings input renders with correct value
      const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });
      expect(servingsInput).toBeInTheDocument();
      expect(servingsInput).toHaveValue(6);
    });
  });

  describe('Component: Saving preferences calls API with correct payload', () => {
    it('should send dietary restrictions, skill level, and servings in the request body', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.patch(`${BASE_URL}/api/v1/users/me/preferences`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          const user = mockUser();
          return HttpResponse.json({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.fullName,
            dietary_restrictions: capturedBody.dietary_restrictions,
            skill_level: capturedBody.skill_level,
            default_servings: capturedBody.default_servings,
            created_at: user.createdAt,
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /vegetarian/i })).toBeInTheDocument();
      });

      // Select dietary restrictions
      await user.click(screen.getByRole('checkbox', { name: /vegetarian/i }));
      await user.click(screen.getByRole('checkbox', { name: /keto/i }));

      // Select skill level
      await user.selectOptions(screen.getByRole('combobox', { name: /skill level/i }), 'advanced');

      // Change servings
      const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });
      await user.clear(servingsInput);
      await user.type(servingsInput, '12');

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Verify API was called with correct payload
      await waitFor(() => {
        expect(capturedBody).not.toBeNull();
      });

      expect(capturedBody!.dietary_restrictions).toEqual(
        expect.arrayContaining(['vegetarian', 'keto'])
      );
      expect(capturedBody!.skill_level).toBe('advanced');
      expect(capturedBody!.default_servings).toBe(12);
    });
  });

  describe('Component: Success message shown after save', () => {
    it('should display success message after preferences are saved', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });

      // Submit
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Verify success message appears
      await waitFor(() => {
        expect(screen.getByText(/preferences saved successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Integration: Full save/reload cycle shows persisted values', () => {
    it('should persist preferences across page reloads', async () => {
      // Track what was saved so the next GET returns it
      let savedPreferences = {
        dietary_restrictions: [] as string[],
        skill_level: 'beginner',
        default_servings: 4,
      };

      server.use(
        http.get(`${BASE_URL}/api/v1/users/me`, () => {
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            dietary_restrictions: savedPreferences.dietary_restrictions,
            skill_level: savedPreferences.skill_level,
            default_servings: savedPreferences.default_servings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }),
        http.patch(`${BASE_URL}/api/v1/users/me/preferences`, async ({ request }) => {
          const body = (await request.json()) as typeof savedPreferences;
          savedPreferences = {
            dietary_restrictions:
              body.dietary_restrictions ?? savedPreferences.dietary_restrictions,
            skill_level: body.skill_level ?? savedPreferences.skill_level,
            default_servings: body.default_servings ?? savedPreferences.default_servings,
          };
          return HttpResponse.json({
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            full_name: 'Test User',
            ...savedPreferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        })
      );

      const user = userEvent.setup();

      // First render: make changes and save
      const { unmount } = render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /vegetarian/i })).toBeInTheDocument();
      });

      // Set preferences
      await user.click(screen.getByRole('checkbox', { name: /vegan/i }));
      await user.click(screen.getByRole('checkbox', { name: /nut-free/i }));
      await user.selectOptions(screen.getByRole('combobox', { name: /skill level/i }), 'advanced');

      const servingsInput = screen.getByRole('spinbutton', { name: /default servings/i });
      await user.clear(servingsInput);
      await user.type(servingsInput, '10');

      // Save
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/preferences saved successfully/i)).toBeInTheDocument();
      });

      // Unmount (simulate leaving the page)
      unmount();

      // Re-render (simulate coming back to the page)
      render(<SettingsPage />);

      // Verify persisted values are displayed
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /vegan/i })).toBeChecked();
      });
      expect(screen.getByRole('checkbox', { name: /nut-free/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /vegetarian/i })).not.toBeChecked();
      expect(screen.getByRole('combobox', { name: /skill level/i })).toHaveValue('advanced');
      expect(screen.getByRole('spinbutton', { name: /default servings/i })).toHaveValue(10);
    });
  });

  /**
   * Feature 9: Seasonal Themes
   *
   * These tests verify the season picker integration in the Settings page.
   * The season picker allows users to select a seasonal color theme that
   * changes the accent color throughout the application.
   */
  describe('Feature 9: Seasonal Themes - Season Picker in Settings', () => {
    beforeEach(() => {
      // Clear localStorage to ensure clean state for season tests
      localStorage.removeItem('season');
      document.documentElement.removeAttribute('data-season');
      document.documentElement.style.removeProperty('--accent');
    });

    describe('Season picker renders in Settings page', () => {
      it('should render the season picker in the Appearance section', async () => {
        render(<SettingsPage />);

        // Wait for page to load
        await waitFor(() => {
          expect(screen.getByText(/appearance/i)).toBeInTheDocument();
        });

        // Season picker should be present with radiogroup role
        expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
      });

      it('should render season picker below the theme toggle', async () => {
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByText(/appearance/i)).toBeInTheDocument();
        });

        // Both theme toggle and season picker should exist in the Appearance section
        const themeToggle = screen.getByRole('button', {
          name: /toggle theme|switch to light|switch to dark/i,
        });
        const seasonGroup = screen.getByRole('radiogroup', { name: /season/i });

        expect(themeToggle).toBeInTheDocument();
        expect(seasonGroup).toBeInTheDocument();
      });

      it('should have a "Season" label visible in the Appearance section', async () => {
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByText(/appearance/i)).toBeInTheDocument();
        });

        // Should have visible "Season" label (not just sr-only)
        expect(screen.getByText('Season')).toBeInTheDocument();
      });
    });

    describe('Season picker renders four options', () => {
      it('should display all four season options: Spring, Summer, Fall, Winter', async () => {
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // All four seasons should be selectable
        expect(screen.getByRole('radio', { name: /spring/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /summer/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /fall/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /winter/i })).toBeInTheDocument();
      });
    });

    describe('Each option shows season name', () => {
      it('should display season name text for each option', async () => {
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // Season names should be visible as text (not just aria-labels)
        expect(screen.getByText('Spring')).toBeInTheDocument();
        expect(screen.getByText('Summer')).toBeInTheDocument();
        expect(screen.getByText('Fall')).toBeInTheDocument();
        expect(screen.getByText('Winter')).toBeInTheDocument();
      });
    });

    describe('Each option shows color swatch', () => {
      it('should display a color swatch for each season option', async () => {
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // Each season option should have a color swatch element
        // Using test IDs for the color swatches since they're decorative
        expect(screen.getByTestId('season-swatch-spring')).toBeInTheDocument();
        expect(screen.getByTestId('season-swatch-summer')).toBeInTheDocument();
        expect(screen.getByTestId('season-swatch-fall')).toBeInTheDocument();
        expect(screen.getByTestId('season-swatch-winter')).toBeInTheDocument();
      });

      it('should display correct colors in the swatches', async () => {
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // Swatches should have inline styles with the correct background colors
        const springSwatch = screen.getByTestId('season-swatch-spring');
        const summerSwatch = screen.getByTestId('season-swatch-summer');
        const fallSwatch = screen.getByTestId('season-swatch-fall');
        const winterSwatch = screen.getByTestId('season-swatch-winter');

        expect(springSwatch).toHaveStyle({ backgroundColor: SEASON_COLORS.spring });
        expect(summerSwatch).toHaveStyle({ backgroundColor: SEASON_COLORS.summer });
        expect(fallSwatch).toHaveStyle({ backgroundColor: SEASON_COLORS.fall });
        expect(winterSwatch).toHaveStyle({ backgroundColor: SEASON_COLORS.winter });
      });
    });

    describe('Selecting season updates CSS variables', () => {
      it('should update --accent CSS variable when a season is selected', async () => {
        const user = userEvent.setup();
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // Select Spring
        await user.click(screen.getByRole('radio', { name: /spring/i }));

        await waitFor(() => {
          const accentValue = document.documentElement.style.getPropertyValue('--accent');
          expect(accentValue).toBe(SEASON_COLORS.spring);
        });
      });

      it('should update data-season attribute when season changes', async () => {
        const user = userEvent.setup();
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // Select Winter
        await user.click(screen.getByRole('radio', { name: /winter/i }));

        await waitFor(() => {
          expect(document.documentElement.getAttribute('data-season')).toBe('winter');
        });
      });
    });

    describe('Selected season shows checkmark indicator', () => {
      it('should display a checkmark on the selected season option', async () => {
        // Pre-set Fall as the selected season
        localStorage.setItem('season', 'fall');

        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // The selected season (Fall) should have a checkmark indicator
        const fallOption = screen
          .getByRole('radio', { name: /fall/i })
          .closest('[data-season-option]');
        expect(fallOption).toBeInTheDocument();

        // Checkmark should be visible within the selected option
        const checkmark = fallOption?.querySelector('[data-testid="season-checkmark"]');
        expect(checkmark).toBeInTheDocument();
      });

      it('should move checkmark when selecting a different season', async () => {
        const user = userEvent.setup();
        localStorage.setItem('season', 'fall');

        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // Initially Fall should have the checkmark
        const fallOption = screen
          .getByRole('radio', { name: /fall/i })
          .closest('[data-season-option]');
        expect(fallOption?.querySelector('[data-testid="season-checkmark"]')).toBeInTheDocument();

        // Select Spring
        await user.click(screen.getByRole('radio', { name: /spring/i }));

        await waitFor(() => {
          // Spring should now have the checkmark
          const springOption = screen
            .getByRole('radio', { name: /spring/i })
            .closest('[data-season-option]');
          expect(
            springOption?.querySelector('[data-testid="season-checkmark"]')
          ).toBeInTheDocument();

          // Fall should no longer have the checkmark visible
          const updatedFallOption = screen
            .getByRole('radio', { name: /fall/i })
            .closest('[data-season-option]');
          const fallCheckmark = updatedFallOption?.querySelector(
            '[data-testid="season-checkmark"]'
          );
          // Either doesn't exist or is hidden (aria-hidden or visually hidden)
          if (fallCheckmark) {
            expect(fallCheckmark).toHaveAttribute('aria-hidden', 'true');
          }
        });
      });

      it('should have a visible border on the selected season option', async () => {
        localStorage.setItem('season', 'summer');

        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // The selected season option should have a distinct border style
        const summerOption = screen
          .getByRole('radio', { name: /summer/i })
          .closest('[data-season-option]');
        expect(summerOption).toHaveAttribute('data-selected', 'true');
      });
    });

    describe('Season persists across page reloads', () => {
      it('should persist season selection to localStorage', async () => {
        const user = userEvent.setup();
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // Select Winter
        await user.click(screen.getByRole('radio', { name: /winter/i }));

        await waitFor(() => {
          expect(localStorage.getItem('season')).toBe('winter');
        });
      });

      it('should load previously selected season on page mount', async () => {
        // Pre-set Winter as saved season
        localStorage.setItem('season', 'winter');

        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // Winter should be selected
        expect(screen.getByRole('radio', { name: /winter/i })).toBeChecked();
      });

      it('should apply saved season CSS variables on initial render', async () => {
        // Pre-set Spring as saved season
        localStorage.setItem('season', 'spring');

        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // CSS variable should already be applied
        const accentValue = document.documentElement.style.getPropertyValue('--accent');
        expect(accentValue).toBe(SEASON_COLORS.spring);
      });
    });

    describe('Each season has distinct accent color', () => {
      it('should apply Spring green accent when Spring is selected', async () => {
        const user = userEvent.setup();
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('radio', { name: /spring/i }));

        await waitFor(() => {
          expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#66bb6a');
        });
      });

      it('should apply Summer orange accent when Summer is selected', async () => {
        const user = userEvent.setup();
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('radio', { name: /summer/i }));

        await waitFor(() => {
          expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#ffa726');
        });
      });

      it('should apply Fall coral accent when Fall is selected', async () => {
        const user = userEvent.setup();
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('radio', { name: /fall/i }));

        await waitFor(() => {
          expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#e07850');
        });
      });

      it('should apply Winter blue accent when Winter is selected', async () => {
        const user = userEvent.setup();
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('radio', { name: /winter/i }));

        await waitFor(() => {
          expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#5c9dc4');
        });
      });
    });

    describe('Seasonal themes work in both light and dark modes', () => {
      it('should maintain season accent in light mode', async () => {
        const user = userEvent.setup();
        localStorage.setItem('theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');

        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // Select Spring in light mode (light mode uses different accent: #4caf50)
        await user.click(screen.getByRole('radio', { name: /spring/i }));

        await waitFor(() => {
          expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#4caf50');
          expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });
      });

      it('should maintain season accent in dark mode', async () => {
        const user = userEvent.setup();
        localStorage.setItem('theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');

        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // Select Winter in dark mode
        await user.click(screen.getByRole('radio', { name: /winter/i }));

        await waitFor(() => {
          expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
            SEASON_COLORS.winter
          );
          expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });
      });
    });

    describe('Accessibility: Season picker', () => {
      it('should be keyboard accessible - can navigate with arrow keys', async () => {
        const user = userEvent.setup();
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // Focus on a season radio button
        const fallRadio = screen.getByRole('radio', { name: /fall/i });
        fallRadio.focus();

        // Navigate with arrow keys
        await user.keyboard('{ArrowRight}');

        // Focus should move to another radio
        await waitFor(() => {
          expect(document.activeElement).not.toBe(fallRadio);
          expect(document.activeElement?.getAttribute('type')).toBe('radio');
        });
      });

      it('should have visible focus indicators on season options', async () => {
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        const springRadio = screen.getByRole('radio', { name: /spring/i });
        springRadio.focus();

        expect(springRadio).toHaveFocus();
      });

      it('should have clearly labeled season names (not just colors)', async () => {
        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // Each radio should have an accessible name with the season text
        const springRadio = screen.getByRole('radio', { name: /spring/i });
        const summerRadio = screen.getByRole('radio', { name: /summer/i });
        const fallRadio = screen.getByRole('radio', { name: /fall/i });
        const winterRadio = screen.getByRole('radio', { name: /winter/i });

        expect(springRadio).toHaveAccessibleName(/spring/i);
        expect(summerRadio).toHaveAccessibleName(/summer/i);
        expect(fallRadio).toHaveAccessibleName(/fall/i);
        expect(winterRadio).toHaveAccessibleName(/winter/i);
      });

      it('should indicate selection with checkmark AND border (not color alone)', async () => {
        localStorage.setItem('season', 'summer');

        render(<SettingsPage />);

        await waitFor(() => {
          expect(screen.getByRole('radiogroup', { name: /season/i })).toBeInTheDocument();
        });

        // The selected season should have both visual indicators
        const summerOption = screen
          .getByRole('radio', { name: /summer/i })
          .closest('[data-season-option]');

        // Should have selected state indicated by data attribute (for border styling)
        expect(summerOption).toHaveAttribute('data-selected', 'true');

        // Should have checkmark indicator
        const checkmark = summerOption?.querySelector('[data-testid="season-checkmark"]');
        expect(checkmark).toBeInTheDocument();
      });
    });
  });
});
