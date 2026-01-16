import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import Breadcrumb from './Breadcrumb';

describe('Breadcrumb', () => {
  describe('Rendering', () => {
    it('should render nothing when items array is empty', () => {
      const { container } = render(<Breadcrumb items={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render a single item', () => {
      render(<Breadcrumb items={[{ label: 'Home' }]} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should render multiple items', () => {
      render(
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Recipes', href: '/recipes' },
            { label: 'Pasta Recipe' },
          ]}
        />
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Recipes')).toBeInTheDocument();
      expect(screen.getByText('Pasta Recipe')).toBeInTheDocument();
    });

    it('should render links for items with href', () => {
      render(
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Recipes', href: '/recipes' },
            { label: 'Pasta Recipe' },
          ]}
        />
      );

      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'Recipes' })).toHaveAttribute('href', '/recipes');
    });

    it('should not render last item as a link', () => {
      render(
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Current Page', href: '/current' },
          ]}
        />
      );

      // Last item should not be a link even if it has href
      expect(screen.queryByRole('link', { name: 'Current Page' })).not.toBeInTheDocument();
      expect(screen.getByText('Current Page')).toBeInTheDocument();
    });

    it('should render separators between items', () => {
      const { container } = render(
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Recipes', href: '/recipes' },
            { label: 'Pasta Recipe' },
          ]}
        />
      );

      // There should be 2 separators (between 3 items)
      const separators = container.querySelectorAll('svg');
      expect(separators.length).toBe(2);
    });

    it('should have breadcrumb navigation role', () => {
      render(<Breadcrumb items={[{ label: 'Home' }]} />);

      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    });

    it('should mark last item as current page', () => {
      render(
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Current Page' },
          ]}
        />
      );

      const currentPage = screen.getByText('Current Page');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });
  });
});
