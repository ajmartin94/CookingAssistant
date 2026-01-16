import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import Footer from './Footer';

describe('Footer', () => {
  describe('Rendering', () => {
    it('should render the brand name', () => {
      render(<Footer />);

      expect(screen.getByRole('link', { name: /cooking assistant/i })).toBeInTheDocument();
    });

    it('should render copyright notice with current year', () => {
      render(<Footer />);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`${currentYear}.*Cooking Assistant`))).toBeInTheDocument();
    });

    it('should render quick links section', () => {
      render(<Footer />);

      expect(screen.getByText(/quick links/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /my recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /libraries/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /meal planning/i })).toBeInTheDocument();
    });

    it('should render features section', () => {
      render(<Footer />);

      expect(screen.getByText(/features/i)).toBeInTheDocument();
      expect(screen.getByText(/recipe management/i)).toBeInTheDocument();
      expect(screen.getByText(/smart grocery lists/i)).toBeInTheDocument();
      expect(screen.getByText(/cooking mode/i)).toBeInTheDocument();
      expect(screen.getByText(/ai suggestions/i)).toBeInTheDocument();
    });

    it('should render support section', () => {
      render(<Footer />);

      expect(screen.getByText(/support/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /help center/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /terms of service/i })).toBeInTheDocument();
    });

    it('should render social media links', () => {
      render(<Footer />);

      expect(screen.getByRole('link', { name: /twitter/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for recipes link', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: /my recipes/i });
      expect(link).toHaveAttribute('href', '/recipes');
    });

    it('should have correct href for libraries link', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: /libraries/i });
      expect(link).toHaveAttribute('href', '/libraries');
    });

    it('should have correct href for settings link', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: /settings/i });
      expect(link).toHaveAttribute('href', '/settings');
    });
  });
});
