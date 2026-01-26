/**
 * Tests for HomePage (Public Landing Page)
 *
 * These tests verify the unauthenticated landing page experience.
 * For authenticated home page tests, see HomePageRedesign.test.tsx
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import HomePage from './HomePage';

describe('HomePage', () => {
  describe('Public Landing Page', () => {
    it('should render the main heading', () => {
      render(<HomePage />);

      expect(screen.getByRole('heading', { name: /cooking assistant/i })).toBeInTheDocument();
    });

    it('should render the tagline', () => {
      render(<HomePage />);

      expect(screen.getByText(/your ai-powered cooking companion/i)).toBeInTheDocument();
    });

    it('should render Browse Recipes link', () => {
      render(<HomePage />);

      const browseLink = screen.getByRole('link', { name: /browse recipes/i });
      expect(browseLink).toBeInTheDocument();
      expect(browseLink).toHaveAttribute('href', '/recipes');
    });

    it('should render Get Started link', () => {
      render(<HomePage />);

      const getStartedLink = screen.getByRole('link', { name: /get started/i });
      expect(getStartedLink).toBeInTheDocument();
      expect(getStartedLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Layout', () => {
    it('should have semantic background color', () => {
      const { container } = render(<HomePage />);

      // Uses semantic design token bg-primary for theme-aware background
      const mainDiv = container.querySelector('.bg-primary');
      expect(mainDiv).toBeInTheDocument();
    });
  });
});
