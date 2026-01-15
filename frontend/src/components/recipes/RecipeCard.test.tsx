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
    sourceUrl: null,
    sourceName: null,
    notes: null,
    ownerId: 'user1',
    libraryId: null,
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

    it('should display placeholder icon when imageUrl is null', () => {
      const recipeWithoutImage = { ...mockRecipe, imageUrl: null };
      const { container } = render(<RecipeCard recipe={recipeWithoutImage} />);

      expect(screen.queryByAltText('Chocolate Chip Cookies')).not.toBeInTheDocument();
      // Check for SVG placeholder
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Time and Servings', () => {
    it('should display total time', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      expect(screen.getByText('27 min')).toBeInTheDocument();
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

    it('should not display cuisine type when null', () => {
      const recipeWithoutCuisine = { ...mockRecipe, cuisineType: null };
      render(<RecipeCard recipe={recipeWithoutCuisine} />);

      expect(screen.queryByText('American')).not.toBeInTheDocument();
    });
  });

  describe('Difficulty Level', () => {
    it('should display difficulty level with easy styling', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const difficultyBadge = screen.getByText('easy');
      expect(difficultyBadge).toBeInTheDocument();
      expect(difficultyBadge).toHaveClass('bg-success-100', 'text-success-700');
    });

    it('should display difficulty level with medium styling', () => {
      const mediumRecipe = { ...mockRecipe, difficultyLevel: 'medium' as const };
      render(<RecipeCard recipe={mediumRecipe} />);

      const difficultyBadge = screen.getByText('medium');
      expect(difficultyBadge).toHaveClass('bg-warning-100', 'text-warning-700');
    });

    it('should display difficulty level with hard styling', () => {
      const hardRecipe = { ...mockRecipe, difficultyLevel: 'hard' as const };
      render(<RecipeCard recipe={hardRecipe} />);

      const difficultyBadge = screen.getByText('hard');
      expect(difficultyBadge).toHaveClass('bg-error-100', 'text-error-700');
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

    it('should not display dietary tags section when null', () => {
      const recipeWithoutTags = { ...mockRecipe, dietaryTags: null };
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
});
