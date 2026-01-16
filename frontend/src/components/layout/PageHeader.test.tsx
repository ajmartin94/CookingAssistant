import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  describe('Rendering', () => {
    it('should render the title', () => {
      render(<PageHeader title="My Recipes" />);

      expect(screen.getByRole('heading', { name: /my recipes/i })).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(
        <PageHeader
          title="My Recipes"
          description="All your saved recipes in one place"
        />
      );

      expect(screen.getByText(/all your saved recipes/i)).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      render(<PageHeader title="My Recipes" />);

      // Only the title should be present, no extra paragraphs
      expect(screen.queryByText(/all your saved/i)).not.toBeInTheDocument();
    });

    it('should render breadcrumbs when provided', () => {
      render(
        <PageHeader
          title="Pasta Recipe"
          breadcrumbs={[
            { label: 'Recipes', href: '/recipes' },
            { label: 'Pasta Recipe' },
          ]}
        />
      );

      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Recipes' })).toBeInTheDocument();
    });

    it('should not render breadcrumbs when not provided', () => {
      render(<PageHeader title="My Recipes" />);

      expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).not.toBeInTheDocument();
    });

    it('should not render breadcrumbs when empty array', () => {
      render(<PageHeader title="My Recipes" breadcrumbs={[]} />);

      expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).not.toBeInTheDocument();
    });

    it('should render actions when provided', () => {
      render(
        <PageHeader
          title="My Recipes"
          actions={<button>Add Recipe</button>}
        />
      );

      expect(screen.getByRole('button', { name: /add recipe/i })).toBeInTheDocument();
    });

    it('should render multiple actions', () => {
      render(
        <PageHeader
          title="My Recipes"
          actions={
            <>
              <button>Import</button>
              <button>Export</button>
            </>
          }
        />
      );

      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });
  });

  describe('Heading Level', () => {
    it('should use h1 for the title', () => {
      render(<PageHeader title="My Recipes" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('My Recipes');
    });
  });
});
