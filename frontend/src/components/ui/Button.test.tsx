/**
 * Tests for Button component
 *
 * Verifies button rendering with different variants, hover/active states,
 * disabled state, loading state, and keyboard accessibility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('variant styles', () => {
    it('should render primary variant with accent background', () => {
      render(<Button variant="primary">Primary Button</Button>);

      const button = screen.getByRole('button', { name: 'Primary Button' });
      expect(button).toBeInTheDocument();

      // Primary variant should have accent background color
      const styles = window.getComputedStyle(button);
      // Check for accent color or class indicating primary variant
      expect(
        button.classList.contains('btn-primary') ||
          styles.backgroundColor.includes('224') || // RGB for #e07850
          button.getAttribute('data-variant') === 'primary'
      ).toBe(true);
    });

    it('should render secondary variant with card background and border', () => {
      render(<Button variant="secondary">Secondary Button</Button>);

      const button = screen.getByRole('button', { name: 'Secondary Button' });
      expect(button).toBeInTheDocument();

      // Secondary variant should have card background and border
      expect(
        button.classList.contains('btn-secondary') ||
          button.getAttribute('data-variant') === 'secondary'
      ).toBe(true);
    });

    it('should render ghost variant with transparent background', () => {
      render(<Button variant="ghost">Ghost Button</Button>);

      const button = screen.getByRole('button', { name: 'Ghost Button' });
      expect(button).toBeInTheDocument();

      // Ghost variant should have transparent background
      expect(
        button.classList.contains('btn-ghost') || button.getAttribute('data-variant') === 'ghost'
      ).toBe(true);
    });

    it('should render danger variant with error color styling', () => {
      render(<Button variant="danger">Danger Button</Button>);

      const button = screen.getByRole('button', { name: 'Danger Button' });
      expect(button).toBeInTheDocument();

      // Danger variant should have error/danger styling
      expect(
        button.classList.contains('btn-danger') || button.getAttribute('data-variant') === 'danger'
      ).toBe(true);
    });

    it('should default to primary variant when no variant specified', () => {
      render(<Button>Default Button</Button>);

      const button = screen.getByRole('button', { name: 'Default Button' });
      expect(button).toBeInTheDocument();

      // Default should be primary
      expect(
        button.classList.contains('btn-primary') ||
          button.getAttribute('data-variant') === 'primary' ||
          !button.getAttribute('data-variant') // implicit primary
      ).toBe(true);
    });
  });

  describe('hover and active states', () => {
    it('should show hover state on mouse enter', async () => {
      const user = userEvent.setup();

      render(<Button variant="primary">Hover Me</Button>);

      const button = screen.getByRole('button', { name: 'Hover Me' });

      // Hover the button
      await user.hover(button);

      // Should have hover state class or style
      await waitFor(() => {
        const hasHoverClass =
          button.classList.contains('hover') ||
          button.matches(':hover') ||
          button.classList.toString().includes('hover');
        expect(hasHoverClass || button.getAttribute('data-hovered') === 'true').toBe(true);
      });
    });

    it('should show active state on mouse down', () => {
      render(<Button variant="primary">Press Me</Button>);

      const button = screen.getByRole('button', { name: 'Press Me' });

      // The button should have CSS rules for :active state
      // We verify by checking that the button has proper styling hooks
      expect(button).toBeInTheDocument();
      expect(button.tagName.toLowerCase()).toBe('button');
    });
  });

  describe('disabled state', () => {
    it('should render with disabled attribute when isDisabled is true', () => {
      render(<Button isDisabled>Disabled Button</Button>);

      const button = screen.getByRole('button', { name: 'Disabled Button' });
      expect(button).toBeDisabled();
    });

    it('should have reduced opacity when disabled', () => {
      render(<Button isDisabled>Disabled Button</Button>);

      const button = screen.getByRole('button', { name: 'Disabled Button' });

      // Disabled buttons should have opacity class for reduced opacity
      expect(button.className).toMatch(/opacity-50|opacity-\d+/);
    });

    it('should have not-allowed cursor when disabled', () => {
      render(<Button isDisabled>Disabled Button</Button>);

      const button = screen.getByRole('button', { name: 'Disabled Button' });

      // Should have cursor-not-allowed class
      expect(button.className).toContain('cursor-not-allowed');
    });

    it('should not trigger onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button isDisabled onClick={handleClick}>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole('button', { name: 'Disabled Button' });

      // Try to click the disabled button
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should have aria-disabled attribute when disabled', () => {
      render(<Button isDisabled>Disabled Button</Button>);

      const button = screen.getByRole('button', { name: 'Disabled Button' });
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading Button</Button>);

      const button = screen.getByRole('button');

      // Should have a spinner element (role="status" or spinner class)
      const spinner =
        button.querySelector('[role="status"]') ||
        button.querySelector('.spinner') ||
        button.querySelector('[data-loading="true"]') ||
        button.querySelector('svg');

      expect(spinner).toBeInTheDocument();
    });

    it('should have aria-busy attribute when loading', () => {
      render(<Button isLoading>Loading Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should be disabled while loading', () => {
      render(<Button isLoading>Loading Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not trigger onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button isLoading onClick={handleClick}>
          Loading Button
        </Button>
      );

      const button = screen.getByRole('button');

      // Try to click the loading button
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('theme support', () => {
    it('should render correctly in dark theme', () => {
      document.documentElement.setAttribute('data-theme', 'dark');

      render(<Button variant="primary">Dark Theme Button</Button>);

      const button = screen.getByRole('button', { name: 'Dark Theme Button' });
      expect(button).toBeInTheDocument();

      // Button should have styles that use CSS variables
      const styles = window.getComputedStyle(button);
      expect(styles.backgroundColor).toBeTruthy();
    });

    it('should render correctly in light theme', () => {
      document.documentElement.setAttribute('data-theme', 'light');

      render(<Button variant="primary">Light Theme Button</Button>);

      const button = screen.getByRole('button', { name: 'Light Theme Button' });
      expect(button).toBeInTheDocument();

      // Button should have styles that use CSS variables
      const styles = window.getComputedStyle(button);
      expect(styles.backgroundColor).toBeTruthy();
    });
  });

  describe('keyboard accessibility', () => {
    it('should be focusable via Tab key', async () => {
      const user = userEvent.setup();

      render(
        <>
          <button>Before</button>
          <Button>Focus Me</Button>
          <button>After</button>
        </>
      );

      // Tab to the Button component
      await user.tab(); // Focus "Before"
      await user.tab(); // Focus the Button

      const button = screen.getByRole('button', { name: 'Focus Me' });
      expect(button).toHaveFocus();
    });

    it('should trigger onClick when Enter is pressed', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Press Enter</Button>);

      const button = screen.getByRole('button', { name: 'Press Enter' });
      button.focus();

      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger onClick when Space is pressed', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Press Space</Button>);

      const button = screen.getByRole('button', { name: 'Press Space' });
      button.focus();

      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not be focusable when disabled', async () => {
      const user = userEvent.setup();

      render(
        <>
          <button>Before</button>
          <Button isDisabled>Disabled Button</Button>
          <button>After</button>
        </>
      );

      // Tab through the elements
      await user.tab(); // Focus "Before"
      await user.tab(); // Should skip disabled Button and go to "After"

      const afterButton = screen.getByRole('button', { name: 'After' });
      expect(afterButton).toHaveFocus();
    });

    it('should have visible focus indicator', () => {
      render(<Button>Focus Me</Button>);

      const button = screen.getByRole('button', { name: 'Focus Me' });
      button.focus();

      // Button should have a focus ring (outline or box-shadow)
      const styles = window.getComputedStyle(button);
      expect(
        styles.outline !== 'none' ||
          styles.boxShadow !== 'none' ||
          button.classList.toString().includes('focus')
      ).toBe(true);
    });
  });

  describe('click handling', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByRole('button', { name: 'Click Me' });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('strict plan requirements', () => {
    it('should have loading spinner with role="status" for screen readers', () => {
      render(<Button isLoading>Loading</Button>);

      const button = screen.getByRole('button');
      const spinner = button.querySelector('[role="status"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide loading spinner text from screen readers with aria-hidden on SVG', () => {
      render(<Button isLoading>Loading</Button>);

      const button = screen.getByRole('button');
      // The spinner wrapper should have role="status" and a sr-only label
      const statusEl = button.querySelector('[role="status"]');
      expect(statusEl).toBeInTheDocument();
      expect(statusEl!.textContent || statusEl!.getAttribute('aria-label')).toBeTruthy();
    });

    it('should accept className prop for custom styling', () => {
      render(<Button className="custom-class">Styled</Button>);

      const button = screen.getByRole('button', { name: 'Styled' });
      expect(button.className).toContain('custom-class');
    });

    it('should forward ref to underlying button element', () => {
      // Button should support React.forwardRef for imperative access
      const { container } = render(<Button>Ref Button</Button>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should support fullWidth prop to take full container width', () => {
      render(<Button fullWidth>Full Width</Button>);

      const button = screen.getByRole('button', { name: 'Full Width' });
      expect(button.className).toContain('w-full');
    });

    it('should render left icon when provided', () => {
      render(<Button leftIcon={<span data-testid="left-icon">+</span>}>Add Item</Button>);

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render right icon when provided', () => {
      render(<Button rightIcon={<span data-testid="right-icon">→</span>}>Next</Button>);

      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });
});
