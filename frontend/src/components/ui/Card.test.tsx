import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import Card, { CardHeader, CardBody, CardFooter } from './Card';

describe('Card', () => {
  describe('Rendering', () => {
    it('should render children', () => {
      render(<Card>Card content</Card>);

      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Card className="custom-class">Content</Card>);

      // The Card div contains the content directly
      expect(screen.getByText('Content').closest('.custom-class')).toBeInTheDocument();
    });

    it('should have base styling', () => {
      render(<Card>Content</Card>);

      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-soft');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Card variant="default">Default</Card>);

      const card = screen.getByText('Default').closest('div');
      expect(card).not.toHaveClass('cursor-pointer');
    });

    it('should render interactive variant with hover styles', () => {
      render(<Card variant="interactive">Interactive</Card>);

      const card = screen.getByText('Interactive').closest('div');
      expect(card).toHaveClass('hover:shadow-soft-md', 'cursor-pointer');
    });

    it('should render selected variant with ring', () => {
      render(<Card variant="selected">Selected</Card>);

      const card = screen.getByText('Selected').closest('div');
      expect(card).toHaveClass('ring-2', 'ring-primary-500');
    });
  });

  describe('Click Behavior', () => {
    it('should call onClick when clicked', async () => {
      const onClick = vi.fn();
      const { user } = render(<Card onClick={onClick}>Clickable</Card>);

      await user.click(screen.getByText('Clickable'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should have button role when onClick is provided', () => {
      render(<Card onClick={() => {}}>Clickable</Card>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should be focusable when onClick is provided', () => {
      render(<Card onClick={() => {}}>Focusable</Card>);

      expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
    });

    it('should call onClick on Enter key', async () => {
      const onClick = vi.fn();
      const { user } = render(<Card onClick={onClick}>Keyboard</Card>);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on Space key', async () => {
      const onClick = vi.fn();
      const { user } = render(<Card onClick={onClick}>Keyboard</Card>);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});

describe('CardHeader', () => {
  it('should render children', () => {
    render(<CardHeader>Header</CardHeader>);

    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('should have border-bottom', () => {
    render(<CardHeader>Header</CardHeader>);

    expect(screen.getByText('Header').closest('div')).toHaveClass('border-b');
  });

  it('should have padding', () => {
    render(<CardHeader>Header</CardHeader>);

    expect(screen.getByText('Header').closest('div')).toHaveClass('px-6', 'py-4');
  });
});

describe('CardBody', () => {
  it('should render children', () => {
    render(<CardBody>Body content</CardBody>);

    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('should have padding', () => {
    render(<CardBody>Body</CardBody>);

    expect(screen.getByText('Body').closest('div')).toHaveClass('px-6', 'py-4');
  });
});

describe('CardFooter', () => {
  it('should render children', () => {
    render(<CardFooter>Footer</CardFooter>);

    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('should have border-top', () => {
    render(<CardFooter>Footer</CardFooter>);

    expect(screen.getByText('Footer').closest('div')).toHaveClass('border-t');
  });

  it('should have padding', () => {
    render(<CardFooter>Footer</CardFooter>);

    expect(screen.getByText('Footer').closest('div')).toHaveClass('px-6', 'py-4');
  });
});

describe('Full Card Composition', () => {
  it('should render complete card with all parts', () => {
    render(
      <Card>
        <CardHeader>Title</CardHeader>
        <CardBody>Content goes here</CardBody>
        <CardFooter>Actions</CardFooter>
      </Card>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content goes here')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
