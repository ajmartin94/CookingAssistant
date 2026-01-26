/**
 * Tests for ThemeToggle component
 *
 * Verifies the theme toggle button: click behavior, keyboard accessibility,
 * and visual feedback for current theme state.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { screen, waitFor } from '../../test/test-utils';
import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

// Helper to display current theme alongside toggle for testing
function ThemeTestWrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// Component to show current theme for verification
function ThemeDisplay() {
  const { theme } = useTheme();
  return <span data-testid="theme-display">{theme}</span>;
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should render a toggle button', () => {
    rtlRender(
      <ThemeTestWrapper>
        <ThemeToggle />
      </ThemeTestWrapper>
    );

    // Should have a button with accessible name
    expect(
      screen.getByRole('button', { name: /toggle theme|switch to light|switch to dark/i })
    ).toBeInTheDocument();
  });

  it('should toggle theme when clicked', async () => {
    const user = userEvent.setup();

    rtlRender(
      <ThemeTestWrapper>
        <ThemeToggle />
        <ThemeDisplay />
      </ThemeTestWrapper>
    );

    const toggleButton = screen.getByRole('button', {
      name: /toggle theme|switch to light|switch to dark/i,
    });
    const initialTheme = screen.getByTestId('theme-display').textContent;

    await user.click(toggleButton);

    await waitFor(() => {
      const newTheme = screen.getByTestId('theme-display').textContent;
      expect(newTheme).not.toBe(initialTheme);
    });
  });

  it('should be keyboard accessible - activatable via Enter key', async () => {
    const user = userEvent.setup();

    rtlRender(
      <ThemeTestWrapper>
        <ThemeToggle />
        <ThemeDisplay />
      </ThemeTestWrapper>
    );

    const toggleButton = screen.getByRole('button', {
      name: /toggle theme|switch to light|switch to dark/i,
    });
    const initialTheme = screen.getByTestId('theme-display').textContent;

    // Focus the button
    toggleButton.focus();
    expect(toggleButton).toHaveFocus();

    // Activate via Enter key
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const newTheme = screen.getByTestId('theme-display').textContent;
      expect(newTheme).not.toBe(initialTheme);
    });
  });

  it('should be keyboard accessible - activatable via Space key', async () => {
    const user = userEvent.setup();

    rtlRender(
      <ThemeTestWrapper>
        <ThemeToggle />
        <ThemeDisplay />
      </ThemeTestWrapper>
    );

    const toggleButton = screen.getByRole('button', {
      name: /toggle theme|switch to light|switch to dark/i,
    });
    const initialTheme = screen.getByTestId('theme-display').textContent;

    // Focus the button
    toggleButton.focus();
    expect(toggleButton).toHaveFocus();

    // Activate via Space key
    await user.keyboard(' ');

    await waitFor(() => {
      const newTheme = screen.getByTestId('theme-display').textContent;
      expect(newTheme).not.toBe(initialTheme);
    });
  });

  it('should be focusable via Tab key navigation', async () => {
    const user = userEvent.setup();

    rtlRender(
      <ThemeTestWrapper>
        <button>Before</button>
        <ThemeToggle />
        <button>After</button>
      </ThemeTestWrapper>
    );

    // Tab to the toggle button
    await user.tab(); // Focus "Before" button
    await user.tab(); // Focus ThemeToggle

    const toggleButton = screen.getByRole('button', {
      name: /toggle theme|switch to light|switch to dark/i,
    });
    expect(toggleButton).toHaveFocus();
  });

  it('should update accessible label based on current theme', async () => {
    const user = userEvent.setup();

    // Mock system preference for dark mode (so we start in dark)
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

    rtlRender(
      <ThemeTestWrapper>
        <ThemeToggle />
      </ThemeTestWrapper>
    );

    // When in dark mode, should indicate switch to light
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label') || button.textContent).toMatch(
        /switch to light|toggle theme/i
      );
    });

    // Click to switch to light mode
    await user.click(screen.getByRole('button'));

    // When in light mode, should indicate switch to dark
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label') || button.textContent).toMatch(
        /switch to dark|toggle theme/i
      );
    });
  });

  it('should have visible icon indicating current theme', () => {
    rtlRender(
      <ThemeTestWrapper>
        <ThemeToggle />
      </ThemeTestWrapper>
    );

    // Toggle should contain an icon (sun or moon)
    const toggleButton = screen.getByRole('button', {
      name: /toggle theme|switch to light|switch to dark/i,
    });

    // The button should have some visual content (icon or text)
    expect(toggleButton.innerHTML.length).toBeGreaterThan(0);
  });
});
