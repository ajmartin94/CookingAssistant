import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import HomePage from './HomePage';

describe('HomePage', () => {
  describe('Rendering', () => {
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

  describe('Feature Cards', () => {
    it('should display Recipe Library feature card', () => {
      render(<HomePage />);

      expect(screen.getByRole('heading', { name: /recipe library/i })).toBeInTheDocument();
      expect(screen.getByText(/store and organize your favorite recipes/i)).toBeInTheDocument();
    });

    it('should display Meal Planning feature card', () => {
      render(<HomePage />);

      expect(screen.getByRole('heading', { name: /meal planning/i })).toBeInTheDocument();
      expect(
        screen.getByText(/plan your meals and generate smart grocery lists/i)
      ).toBeInTheDocument();
    });

    it('should display Interactive Cooking feature card', () => {
      render(<HomePage />);

      expect(screen.getByRole('heading', { name: /interactive cooking/i })).toBeInTheDocument();
      expect(screen.getByText(/step-by-step guidance with voice assistance/i)).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should have gradient background', () => {
      const { container } = render(<HomePage />);

      const mainDiv = container.querySelector('.bg-gradient-to-br');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should display feature cards in a grid layout', () => {
      const { container } = render(<HomePage />);

      const featureGrid = container.querySelector('.grid');
      expect(featureGrid).toBeInTheDocument();
    });
  });
});
