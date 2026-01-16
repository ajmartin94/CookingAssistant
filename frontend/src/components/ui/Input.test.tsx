import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import Input from './Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('should render an input element', () => {
      render(<Input placeholder="Enter text" />);

      expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Email" />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Input className="custom-class" />);

      expect(screen.getByRole('textbox')).toHaveClass('custom-class');
    });
  });

  describe('Error State', () => {
    it('should display error message', () => {
      render(<Input error="This field is required" />);

      expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    });

    it('should have error styling when error is present', () => {
      render(<Input error="Error" />);

      expect(screen.getByRole('textbox')).toHaveClass('border-error-500');
    });

    it('should set aria-invalid when error is present', () => {
      render(<Input error="Error" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should associate error message with input', () => {
      render(<Input id="test-input" error="Error message" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
    });
  });

  describe('Helper Text', () => {
    it('should display helper text', () => {
      render(<Input helperText="Enter your email address" />);

      expect(screen.getByText(/enter your email address/i)).toBeInTheDocument();
    });

    it('should not display helper text when error is present', () => {
      render(<Input helperText="Helper" error="Error" />);

      expect(screen.queryByText(/helper/i)).not.toBeInTheDocument();
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render left icon', () => {
      render(<Input leftIcon={<span data-testid="left-icon">Icon</span>} />);

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should add left padding when left icon is present', () => {
      render(<Input leftIcon={<span>Icon</span>} />);

      expect(screen.getByRole('textbox')).toHaveClass('pl-10');
    });

    it('should render right icon', () => {
      render(<Input rightIcon={<span data-testid="right-icon">Icon</span>} />);

      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should add right padding when right icon is present', () => {
      render(<Input rightIcon={<span>Icon</span>} />);

      expect(screen.getByRole('textbox')).toHaveClass('pr-10');
    });
  });

  describe('Events', () => {
    it('should call onChange when input value changes', async () => {
      const onChange = vi.fn();
      const { user } = render(<Input onChange={onChange} />);

      await user.type(screen.getByRole('textbox'), 'test');

      expect(onChange).toHaveBeenCalled();
    });

    it('should call onFocus when input is focused', async () => {
      const onFocus = vi.fn();
      const { user } = render(<Input onFocus={onFocus} />);

      await user.click(screen.getByRole('textbox'));

      expect(onFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should associate label with input', () => {
      render(<Input label="Username" id="username" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'username');
    });

    it('should have focus ring styles', () => {
      render(<Input />);

      expect(screen.getByRole('textbox')).toHaveClass('focus:ring-2');
    });
  });

  describe('Input Types', () => {
    it('should render as email input', () => {
      render(<Input type="email" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('should render as password input', () => {
      render(<Input type="password" placeholder="Password" />);

      const input = screen.getByPlaceholderText(/password/i);
      expect(input).toHaveAttribute('type', 'password');
    });
  });
});
