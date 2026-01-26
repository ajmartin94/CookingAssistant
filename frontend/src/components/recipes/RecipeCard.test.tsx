import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import RecipeCard from './RecipeCard';
import type { Recipe } from '../../types';

describe('RecipeCard', () => {
  const mockRecipe: Recipe = {
    id: '1',
    title: 'Chocolate Chip Cookies',
    description: 'Delicious homemade chocolate chip cookies',
    ingredients: [],
    instructions: [],
    prepTimeMinutes: 15,
    cookTimeMinutes: 12,
    totalTimeMinutes: 27,
    servings: 24,
    cuisineType: 'American',
    difficultyLevel: 'easy',
    dietaryTags: ['vegetarian'],
    imageUrl: 'https://example.com/cookie.jpg',
    sourceUrl: undefined,
    sourceName: undefined,
    notes: undefined,
    ownerId: 'user1',
    libraryId: undefined,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('Rendering', () => {
    it('should render recipe title', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      expect(screen.getByRole('heading', { name: 'Chocolate Chip Cookies' })).toBeInTheDocument();
    });

    it('should render recipe description', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      expect(screen.getByText('Delicious homemade chocolate chip cookies')).toBeInTheDocument();
    });

    it('should render as a link to recipe detail page', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/recipes/1');
    });
  });

  describe('Image', () => {
    it('should display recipe image when imageUrl is provided', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const image = screen.getByAltText('Chocolate Chip Cookies');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/cookie.jpg');
    });

    it('should display placeholder icon when imageUrl is undefined', () => {
      const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined };
      const { container } = render(<RecipeCard recipe={recipeWithoutImage} />);

      expect(screen.queryByAltText('Chocolate Chip Cookies')).not.toBeInTheDocument();
      // Check for SVG placeholder
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Time and Servings', () => {
    it('should display cook time', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      expect(screen.getByText('12 min')).toBeInTheDocument();
    });

    it('should display servings', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      expect(screen.getByText('24 servings')).toBeInTheDocument();
    });
  });

  describe('Cuisine Type', () => {
    it('should display cuisine type when provided', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      expect(screen.getByText('American')).toBeInTheDocument();
    });

    it('should not display cuisine type when empty', () => {
      const recipeWithoutCuisine = { ...mockRecipe, cuisineType: '' };
      render(<RecipeCard recipe={recipeWithoutCuisine} />);

      expect(screen.queryByText('American')).not.toBeInTheDocument();
    });
  });

  describe('Difficulty Level', () => {
    it('should display difficulty level with easy styling', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const difficultyBadge = screen.getByText('easy');
      expect(difficultyBadge).toBeInTheDocument();
      // Uses semantic design tokens: bg-success for background, text-text-primary for text
      expect(difficultyBadge).toHaveClass('bg-success', 'text-text-primary');
    });

    it('should display difficulty level with medium styling', () => {
      const mediumRecipe = { ...mockRecipe, difficultyLevel: 'medium' as const };
      render(<RecipeCard recipe={mediumRecipe} />);

      const difficultyBadge = screen.getByText('medium');
      // Uses semantic design tokens: bg-warning for background, text-text-primary for text
      expect(difficultyBadge).toHaveClass('bg-warning', 'text-text-primary');
    });

    it('should display difficulty level with hard styling', () => {
      const hardRecipe = { ...mockRecipe, difficultyLevel: 'hard' as const };
      render(<RecipeCard recipe={hardRecipe} />);

      const difficultyBadge = screen.getByText('hard');
      // Uses semantic design tokens: bg-error for background, text-text-primary for text
      expect(difficultyBadge).toHaveClass('bg-error', 'text-text-primary');
    });
  });

  describe('Dietary Tags', () => {
    it('should display dietary tags when provided', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      expect(screen.getByText('vegetarian')).toBeInTheDocument();
    });

    it('should display up to 3 dietary tags', () => {
      const recipeWithManyTags = {
        ...mockRecipe,
        dietaryTags: ['vegetarian', 'gluten-free', 'dairy-free'],
      };
      render(<RecipeCard recipe={recipeWithManyTags} />);

      expect(screen.getByText('vegetarian')).toBeInTheDocument();
      expect(screen.getByText('gluten-free')).toBeInTheDocument();
      expect(screen.getByText('dairy-free')).toBeInTheDocument();
    });

    it('should show "+X more" indicator when more than 3 tags', () => {
      const recipeWithManyTags = {
        ...mockRecipe,
        dietaryTags: ['vegetarian', 'gluten-free', 'dairy-free', 'nut-free', 'soy-free'],
      };
      render(<RecipeCard recipe={recipeWithManyTags} />);

      expect(screen.getByText('vegetarian')).toBeInTheDocument();
      expect(screen.getByText('gluten-free')).toBeInTheDocument();
      expect(screen.getByText('dairy-free')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
      expect(screen.queryByText('nut-free')).not.toBeInTheDocument();
    });

    it('should not display dietary tags section when empty array', () => {
      const recipeWithoutTags = { ...mockRecipe, dietaryTags: [] };
      render(<RecipeCard recipe={recipeWithoutTags} />);

      expect(screen.queryByText('vegetarian')).not.toBeInTheDocument();
    });

    it('should handle missing dietary tags gracefully', () => {
      // Test defensive behavior with undefined dietaryTags (edge case)
      const recipeWithoutTags = { ...mockRecipe, dietaryTags: undefined } as unknown as Recipe;
      render(<RecipeCard recipe={recipeWithoutTags} />);

      expect(screen.queryByText('vegetarian')).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have hover effect classes', () => {
      const { container } = render(<RecipeCard recipe={mockRecipe} />);

      const link = container.querySelector('a');
      expect(link).toHaveClass('hover:shadow-soft-md');
    });

    it('should have rounded corners and shadow', () => {
      const { container } = render(<RecipeCard recipe={mockRecipe} />);

      const link = container.querySelector('a');
      expect(link).toHaveClass('rounded-lg', 'shadow-soft');
    });
  });

  /**
   * ============================================================================
   * COOKBOOK PAGE REDESIGN - RECIPE CARD TESTS (Feature 7 - UI/UX Overhaul)
   * ============================================================================
   * These tests verify the new RecipeCard design with:
   * - data-testid attributes for E2E testing
   * - Image fallback with gradient and first letter
   * - Card metadata with dedicated data-testid
   * - Tag display with data-testid
   */

  describe('Cookbook Page Redesign - data-testid Attributes', () => {
    it('should have data-testid="recipe-card" on the card container', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const recipeCard = screen.getByTestId('recipe-card');
      expect(recipeCard).toBeInTheDocument();
    });

    it('should have data-testid="card-title" on the title element', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const cardTitle = screen.getByTestId('card-title');
      expect(cardTitle).toBeInTheDocument();
      expect(cardTitle).toHaveTextContent('Chocolate Chip Cookies');
    });

    it('should have data-testid="card-image" when image URL is provided', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const cardImage = screen.getByTestId('card-image');
      expect(cardImage).toBeInTheDocument();
    });

    it('should have data-testid="image-fallback" when no image URL', () => {
      const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined };
      render(<RecipeCard recipe={recipeWithoutImage} />);

      const imageFallback = screen.getByTestId('image-fallback');
      expect(imageFallback).toBeInTheDocument();
    });

    it('should have data-testid="card-metadata" for time and servings section', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const cardMetadata = screen.getByTestId('card-metadata');
      expect(cardMetadata).toBeInTheDocument();
    });

    it('should have data-testid="card-time" for cook time display', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const cardTime = screen.getByTestId('card-time');
      expect(cardTime).toBeInTheDocument();
      expect(cardTime).toHaveTextContent(/12/); // cookTimeMinutes
    });

    it('should have data-testid="card-tag" on dietary tags', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const cardTags = screen.getAllByTestId('card-tag');
      expect(cardTags.length).toBeGreaterThanOrEqual(1);
      expect(cardTags[0]).toHaveTextContent('vegetarian');
    });
  });

  describe('Cookbook Page Redesign - Image Fallback with First Letter', () => {
    it('should display gradient fallback with first letter when no image', () => {
      const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined, title: 'Pasta Carbonara' };
      render(<RecipeCard recipe={recipeWithoutImage} />);

      const imageFallback = screen.getByTestId('image-fallback');
      expect(imageFallback).toBeInTheDocument();
      // Should display the first letter of the recipe title
      expect(imageFallback).toHaveTextContent('P');
    });

    it('should display first letter from multi-word recipe title', () => {
      const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined, title: 'Apple Pie Delight' };
      render(<RecipeCard recipe={recipeWithoutImage} />);

      const imageFallback = screen.getByTestId('image-fallback');
      expect(imageFallback).toHaveTextContent('A');
    });

    it('should have gradient background styling on image fallback', () => {
      const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined };
      render(<RecipeCard recipe={recipeWithoutImage} />);

      const imageFallback = screen.getByTestId('image-fallback');
      // Check for gradient class or inline style
      expect(
        imageFallback.className.includes('gradient') ||
          imageFallback.className.includes('bg-') ||
          imageFallback.getAttribute('style')?.includes('gradient')
      ).toBe(true);
    });
  });

  describe('Cookbook Page Redesign - Card Layout', () => {
    it('should render card as a clickable link', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/recipes/1');
    });

    it('should have accessible name matching recipe title', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      // Card should be findable by accessible name
      const link = screen.getByRole('link', { name: /chocolate chip cookies/i });
      expect(link).toBeInTheDocument();
    });
  });
});
