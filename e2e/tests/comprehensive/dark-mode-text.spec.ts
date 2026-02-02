/**
 * Comprehensive: Dark Mode Text Visibility
 *
 * Spot-checks that key text elements are readable in dark mode across pages.
 * Text is considered "visible" when its computed color has sufficient contrast
 * against the computed background color (WCAG minimum contrast ratio >= 3.0).
 *
 * These tests target components known to use hardcoded Tailwind colors
 * (e.g., text-neutral-800, bg-white) that do not respond to dark-mode
 * design tokens, making text unreadable in dark mode.
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';

/**
 * Parse a CSS color string (rgb/rgba) into {r, g, b} components.
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
}

/**
 * Compute relative luminance per WCAG 2.0.
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Compute WCAG contrast ratio between two colors.
 */
function contrastRatio(
  fg: { r: number; g: number; b: number },
  bg: { r: number; g: number; b: number }
): number {
  const l1 = relativeLuminance(fg.r, fg.g, fg.b);
  const l2 = relativeLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Minimum WCAG AA contrast for large text (headings)
const MIN_CONTRAST = 3.0;

test.describe('Comprehensive: Dark Mode Text Visibility', () => {
  /**
   * Helper: enable dark mode by setting localStorage before navigation,
   * so the ThemeProvider initializes with dark mode from the start.
   */
  async function enableDarkMode(page: import('@playwright/test').Page) {
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
  }

  /**
   * Helper: get the computed foreground and background colors of an element,
   * walking up ancestors if background is transparent.
   */
  async function getElementColors(
    locator: import('@playwright/test').Locator
  ): Promise<{ fg: string; bg: string }> {
    return locator.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const fg = style.color;

      // Walk up ancestors to find the first non-transparent background
      let bg = style.backgroundColor;
      let current: HTMLElement | null = el as HTMLElement;
      while (
        current &&
        (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')
      ) {
        current = current.parentElement;
        if (current) {
          bg = window.getComputedStyle(current).backgroundColor;
        }
      }
      // If we hit the root with no bg, assume white (browser default)
      if (!current || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
        bg = 'rgb(255, 255, 255)';
      }

      return { fg, bg };
    });
  }

  /**
   * Assert that a locator's text has sufficient contrast against its background.
   */
  async function assertContrast(
    locator: import('@playwright/test').Locator,
    label: string
  ) {
    const { fg, bg } = await getElementColors(locator);
    const fgParsed = parseColor(fg);
    const bgParsed = parseColor(bg);

    expect(fgParsed, `Could not parse foreground color "${fg}" for ${label}`).not.toBeNull();
    expect(bgParsed, `Could not parse background color "${bg}" for ${label}`).not.toBeNull();

    const ratio = contrastRatio(fgParsed!, bgParsed!);
    expect(
      ratio,
      `${label} contrast ratio ${ratio.toFixed(2)} is below ${MIN_CONTRAST} ` +
        `(fg: ${fg}, bg: ${bg}). Text may be invisible in dark mode.`
    ).toBeGreaterThanOrEqual(MIN_CONTRAST);
  }

  test('library card text is readable in dark mode on libraries page', async ({
    authenticatedPage,
    request,
  }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    // Create a library so LibraryCard renders on the libraries page
    await api.createLibrary(token!, {
      name: 'Dark Mode Test Library',
      description: 'Library to test dark mode text contrast',
    });

    // Enable dark mode and navigate to the libraries page
    await enableDarkMode(authenticatedPage);
    await authenticatedPage.goto('/libraries');

    // Wait for the library card heading to appear
    // LibraryCard uses hardcoded text-neutral-800 which is dark text on dark bg
    const libraryHeading = authenticatedPage.getByText('Dark Mode Test Library');
    await expect(libraryHeading).toBeVisible();

    await assertContrast(libraryHeading, 'Library card heading (text-neutral-800)');
  });

  test('library card description text is readable in dark mode', async ({
    authenticatedPage,
    request,
  }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    // Create a library with a description so LibraryCard renders description text
    await api.createLibrary(token!, {
      name: 'Contrast Check Library',
      description: 'This description uses text-neutral-600 which is unreadable in dark mode',
    });

    // Enable dark mode and navigate to the libraries page
    await enableDarkMode(authenticatedPage);
    await authenticatedPage.goto('/libraries');

    // Wait for the library card description to appear
    // LibraryCard uses hardcoded text-neutral-600 for descriptions -- dark text on dark bg
    const description = authenticatedPage.getByText('This description uses text-neutral-600');
    await expect(description).toBeVisible();

    await assertContrast(description, 'Library card description (text-neutral-600)');
  });

  test('key text elements are visible in dark mode on settings page', async ({
    authenticatedPage,
  }) => {
    await enableDarkMode(authenticatedPage);
    await authenticatedPage.goto('/settings');

    // The "Settings" heading uses text-text-primary (semantic token) - should pass
    const heading = authenticatedPage.getByRole('heading', { name: /settings/i });
    await expect(heading).toBeVisible();
    await assertContrast(heading, 'Settings page heading');

    // Check secondary text elements
    const themeLabel = authenticatedPage.getByText('Theme');
    await expect(themeLabel).toBeVisible();
    await assertContrast(themeLabel, 'Theme label');

    const seasonLabel = authenticatedPage.getByText('Season');
    await expect(seasonLabel).toBeVisible();
    await assertContrast(seasonLabel, 'Season label');
  });
});
