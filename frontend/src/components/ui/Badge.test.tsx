import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import Badge from './Badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('should render badge with text', () => {
      render(<Badge>Label</Badge>);

      expect(screen.getByText('Label')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Badge className="custom-class">Label</Badge>);

      expect(screen.getByText('Label')).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('should render default variant by default', () => {
      render(<Badge>Default</Badge>);

      expect(screen.getByText('Default')).toHaveClass('bg-neutral-100', 'text-neutral-700');
    });

    it('should render primary variant', () => {
      render(<Badge variant="primary">Primary</Badge>);

      expect(screen.getByText('Primary')).toHaveClass('bg-primary-100', 'text-primary-700');
    });

    it('should render secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);

      expect(screen.getByText('Secondary')).toHaveClass('bg-secondary-100', 'text-secondary-700');
    });

    it('should render success variant', () => {
      render(<Badge variant="success">Success</Badge>);

      expect(screen.getByText('Success')).toHaveClass('bg-success-100', 'text-success-700');
    });

    it('should render warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);

      expect(screen.getByText('Warning')).toHaveClass('bg-warning-100', 'text-warning-700');
    });

    it('should render error variant', () => {
      render(<Badge variant="error">Error</Badge>);

      expect(screen.getByText('Error')).toHaveClass('bg-error-100', 'text-error-700');
    });

    it('should render cuisine variant', () => {
      render(<Badge variant="cuisine">Italian</Badge>);

      expect(screen.getByText('Italian')).toHaveClass('bg-secondary-100', 'text-secondary-700');
    });

    it('should render dietary variant', () => {
      render(<Badge variant="dietary">Vegetarian</Badge>);

      expect(screen.getByText('Vegetarian')).toHaveClass('bg-success-100', 'text-success-700');
    });

    it('should render difficulty variant', () => {
      render(<Badge variant="difficulty">Easy</Badge>);

      expect(screen.getByText('Easy')).toHaveClass('bg-neutral-100', 'text-neutral-700');
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      render(<Badge>Medium</Badge>);

      expect(screen.getByText('Medium')).toHaveClass('px-2.5', 'py-1', 'text-sm');
    });

    it('should render small size', () => {
      render(<Badge size="sm">Small</Badge>);

      expect(screen.getByText('Small')).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });
  });

  describe('Styling', () => {
    it('should have rounded corners', () => {
      render(<Badge>Rounded</Badge>);

      expect(screen.getByText('Rounded')).toHaveClass('rounded');
    });

    it('should have font-medium', () => {
      render(<Badge>Bold</Badge>);

      expect(screen.getByText('Bold')).toHaveClass('font-medium');
    });

    it('should use inline-flex for alignment', () => {
      render(<Badge>Flex</Badge>);

      expect(screen.getByText('Flex')).toHaveClass('inline-flex');
    });
  });
});
