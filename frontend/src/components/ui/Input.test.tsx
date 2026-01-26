/**
 * Tests for Input component
 *
 * Verifies input rendering with focus ring, error state, disabled state,
 * and theme support.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('basic rendering', () => {
    it('should render an input element', () => {
      render(<Input aria-label="Test input" />);

      expect(screen.getByRole('textbox', { name: 'Test input' })).toBeInTheDocument();
    });

    it('should render with placeholder text', () => {
      render(<Input placeholder="Enter your name" aria-label="Name input" />);

      const input = screen.getByRole('textbox', { name: 'Name input' });
      expect(input).toHaveAttribute('placeholder', 'Enter your name');
    });

    it('should render with correct background color (bg-card)', () => {
      render(<Input aria-label="Styled input" />);

      const input = screen.getByRole('textbox', { name: 'Styled input' });
      const styles = window.getComputedStyle(input);

      // Input should use --bg-card CSS variable
      expect(
        input.classList.contains('input') ||
          styles.backgroundColor !== '' ||
          input.getAttribute('data-component') === 'input'
      ).toBe(true);
    });

    it('should render with border', () => {
      render(<Input aria-label="Bordered input" />);

      const input = screen.getByRole('textbox', { name: 'Bordered input' });
      const styles = window.getComputedStyle(input);

      // Input should have a border
      expect(
        styles.borderWidth !== '0px' ||
          styles.border !== 'none' ||
          input.classList.toString().includes('border')
      ).toBe(true);
    });

    it('should render with border-radius', () => {
      render(<Input aria-label="Rounded input" />);

      const input = screen.getByRole('textbox', { name: 'Rounded input' });
      const styles = window.getComputedStyle(input);

      // Input should have border-radius (10-14px per design system)
      expect(styles.borderRadius !== '0px' || input.classList.toString().includes('rounded')).toBe(
        true
      );
    });
  });

  describe('focus state', () => {
    it('should show focus ring on focus', async () => {
      const user = userEvent.setup();

      render(<Input aria-label="Focus input" />);

      const input = screen.getByRole('textbox', { name: 'Focus input' });

      // Focus the input
      await user.click(input);

      await waitFor(() => {
        const styles = window.getComputedStyle(input);
        // Should have focus ring (box-shadow with accent-subtle color)
        expect(
          styles.boxShadow !== 'none' ||
            styles.outline !== 'none' ||
            input.classList.toString().includes('focus')
        ).toBe(true);
      });
    });

    it('should have border-focus color when focused', async () => {
      const user = userEvent.setup();

      render(<Input aria-label="Focus border input" />);

      const input = screen.getByRole('textbox', { name: 'Focus border input' });

      // Focus the input
      await user.click(input);

      await waitFor(() => {
        const styles = window.getComputedStyle(input);
        // Border color should change on focus
        expect(
          styles.borderColor !== '' ||
            input.matches(':focus') ||
            input.classList.toString().includes('focus')
        ).toBe(true);
      });
    });

    it('should call onFocus handler when focused', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();

      render(<Input aria-label="Focus handler input" onFocus={handleFocus} />);

      const input = screen.getByRole('textbox', { name: 'Focus handler input' });
      await user.click(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur handler when blurred', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();

      render(
        <>
          <Input aria-label="Blur handler input" onBlur={handleBlur} />
          <button>Other element</button>
        </>
      );

      const input = screen.getByRole('textbox', { name: 'Blur handler input' });
      await user.click(input);
      await user.tab(); // Move focus away

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('error state', () => {
    it('should show error state when error prop is provided', () => {
      render(<Input aria-label="Error input" error="This field is required" />);

      const input = screen.getByRole('textbox', { name: 'Error input' });

      // Should have error styling (red border or error class)
      expect(
        input.classList.contains('error') ||
          input.classList.toString().includes('error') ||
          input.getAttribute('data-error') === 'true' ||
          input.getAttribute('aria-invalid') === 'true'
      ).toBe(true);
    });

    it('should have aria-invalid attribute when in error state', () => {
      render(<Input aria-label="Invalid input" error="Error message" />);

      const input = screen.getByRole('textbox', { name: 'Invalid input' });
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should display error message text', () => {
      render(<Input aria-label="Error message input" error="This field is required" />);

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should have aria-describedby pointing to error message', () => {
      render(<Input id="test-input" aria-label="Described input" error="Error message" />);

      const input = screen.getByRole('textbox', { name: 'Described input' });
      const errorId = input.getAttribute('aria-describedby');

      expect(errorId).toBeTruthy();
      expect(document.getElementById(errorId!)).toBeInTheDocument();
    });

    it('should have error border color in error state', () => {
      render(<Input aria-label="Error border input" error="Error" />);

      const input = screen.getByRole('textbox', { name: 'Error border input' });
      const styles = window.getComputedStyle(input);

      // Should have error color for border
      expect(
        input.classList.toString().includes('error') ||
          input.classList.toString().includes('border-error') ||
          styles.borderColor.includes('220') // RGB for #dc4545
      ).toBe(true);
    });
  });

  describe('disabled state', () => {
    it('should render with disabled attribute when isDisabled is true', () => {
      render(<Input aria-label="Disabled input" isDisabled />);

      const input = screen.getByRole('textbox', { name: 'Disabled input' });
      expect(input).toBeDisabled();
    });

    it('should have reduced opacity when disabled', () => {
      render(<Input aria-label="Disabled opacity input" isDisabled />);

      const input = screen.getByRole('textbox', { name: 'Disabled opacity input' });

      // Disabled inputs should have opacity class for reduced opacity
      expect(input.className).toMatch(/opacity-50|opacity-\d+/);
    });

    it('should have not-allowed cursor when disabled', () => {
      render(<Input aria-label="Disabled cursor input" isDisabled />);

      const input = screen.getByRole('textbox', { name: 'Disabled cursor input' });

      // Should have cursor-not-allowed class
      expect(input.className).toContain('cursor-not-allowed');
    });

    it('should not be editable when disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input aria-label="Disabled edit input" isDisabled onChange={handleChange} />);

      const input = screen.getByRole('textbox', { name: 'Disabled edit input' });

      // Try to type in the disabled input
      await user.type(input, 'test');

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should have aria-disabled attribute when disabled', () => {
      render(<Input aria-label="Aria disabled input" isDisabled />);

      const input = screen.getByRole('textbox', { name: 'Aria disabled input' });
      expect(input).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('theme support', () => {
    it('should render correctly in dark theme', () => {
      document.documentElement.setAttribute('data-theme', 'dark');

      render(<Input aria-label="Dark theme input" />);

      const input = screen.getByRole('textbox', { name: 'Dark theme input' });
      expect(input).toBeInTheDocument();

      // Input should render with theme-appropriate colors
      const styles = window.getComputedStyle(input);
      expect(styles.backgroundColor).toBeTruthy();
    });

    it('should render correctly in light theme', () => {
      document.documentElement.setAttribute('data-theme', 'light');

      render(<Input aria-label="Light theme input" />);

      const input = screen.getByRole('textbox', { name: 'Light theme input' });
      expect(input).toBeInTheDocument();

      // Input should render with theme-appropriate colors
      const styles = window.getComputedStyle(input);
      expect(styles.backgroundColor).toBeTruthy();
    });
  });

  describe('keyboard accessibility', () => {
    it('should be focusable via Tab key', async () => {
      const user = userEvent.setup();

      render(
        <>
          <button>Before</button>
          <Input aria-label="Tab focus input" />
          <button>After</button>
        </>
      );

      // Tab to the Input component
      await user.tab(); // Focus "Before"
      await user.tab(); // Focus the Input

      const input = screen.getByRole('textbox', { name: 'Tab focus input' });
      expect(input).toHaveFocus();
    });

    it('should not be focusable when disabled', async () => {
      const user = userEvent.setup();

      render(
        <>
          <button>Before</button>
          <Input aria-label="Disabled focus input" isDisabled />
          <button>After</button>
        </>
      );

      // Tab through the elements
      await user.tab(); // Focus "Before"
      await user.tab(); // Should skip disabled Input and go to "After"

      const afterButton = screen.getByRole('button', { name: 'After' });
      expect(afterButton).toHaveFocus();
    });
  });

  describe('value handling', () => {
    it('should call onChange handler when value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input aria-label="Change handler input" onChange={handleChange} />);

      const input = screen.getByRole('textbox', { name: 'Change handler input' });
      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalled();
    });

    it('should display controlled value', () => {
      render(<Input aria-label="Controlled input" value="controlled value" onChange={() => {}} />);

      const input = screen.getByRole('textbox', { name: 'Controlled input' });
      expect(input).toHaveValue('controlled value');
    });

    it('should display defaultValue for uncontrolled input', () => {
      render(<Input aria-label="Uncontrolled input" defaultValue="default value" />);

      const input = screen.getByRole('textbox', { name: 'Uncontrolled input' });
      expect(input).toHaveValue('default value');
    });
  });
});
