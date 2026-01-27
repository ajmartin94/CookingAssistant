/**
 * Tests for Recipe Page Redesign (Feature 6)
 *
 * Verifies:
 * - Hero section renders image and title
 * - Fallback renders when no image URL (gradient with first letter)
 * - Metadata bar shows prep time, cook time, servings
 * - Ingredients render in list format
 * - Steps render with numbers
 * - Timer button renders for steps with duration
 * - Notes section shows existing notes
 * - Layout stacks on mobile width
 *
 * RED PHASE: These tests target the redesigned components that don't exist yet.
 * Tests are expected to fail until implementation is complete.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, within } from '../test/test-utils';
import RecipeDetailPage from './RecipeDetailPage';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockBackendRecipe } from '../test/mocks/data';

const BASE_URL = 'http://localhost:8000';

// Mock navigate and useParams
const mockNavigate = vi.fn();
const mockParams = { id: '1' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

// Mock matchMedia for responsive tests
const mockMatchMedia = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('768') ? matches : !matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('Recipe Page Redesign', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
    vi.stubGlobal('matchMedia', mockMatchMedia(true)); // Default to desktop
  });
  afterEach(() => {
    server.resetHandlers();
    mockNavigate.mockClear();
    localStorage.clear();
    vi.restoreAllMocks();
  });
  afterAll(() => server.close());

  describe('Hero Section', () => {
    it('should render hero section with recipe title', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(mockBackendRecipe({ title: 'Classic Spaghetti Carbonara' }));
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const heroSection = screen.getByTestId('recipe-hero');
        expect(heroSection).toBeInTheDocument();

        const title = within(heroSection).getByRole('heading', { level: 1 });
        expect(title).toHaveTextContent('Classic Spaghetti Carbonara');
      });
    });

    it('should render hero image when recipe has image URL', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              title: 'Recipe with Image',
              image_url: 'https://example.com/recipe-image.jpg',
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const heroImage = screen.getByTestId('recipe-hero-image');
        expect(heroImage).toBeInTheDocument();
        expect(heroImage).toHaveAttribute('src', 'https://example.com/recipe-image.jpg');
      });
    });

    it('should have alt text on hero image for accessibility', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              title: 'Delicious Pasta',
              image_url: 'https://example.com/pasta.jpg',
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const heroImage = screen.getByAltText('Delicious Pasta');
        expect(heroImage).toBeInTheDocument();
      });
    });

    it('should render gradient overlay on hero image', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({ image_url: 'https://example.com/recipe.jpg' })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const heroSection = screen.getByTestId('recipe-hero');
        // Check for gradient overlay element or class
        const overlay = heroSection.querySelector(
          '[data-testid="hero-overlay"], .gradient-overlay'
        );
        expect(overlay || heroSection.className.includes('gradient')).toBeTruthy();
      });
    });
  });

  describe('Fallback Hero (No Image)', () => {
    it('should render fallback gradient when recipe has no image', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(mockBackendRecipe({ title: 'Banana Bread', image_url: null }));
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const fallback = screen.getByTestId('recipe-hero-fallback');
        expect(fallback).toBeInTheDocument();
      });
    });

    it('should display first letter of recipe name in fallback', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({ title: 'Banana Bread Delight', image_url: null })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const letterElement = screen.getByTestId('recipe-hero-letter');
        expect(letterElement).toBeInTheDocument();
        expect(letterElement).toHaveTextContent('B');
      });
    });

    it('should display title in fallback hero', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(mockBackendRecipe({ title: 'Simple Salad', image_url: null }));
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const heroSection = screen.getByTestId('recipe-hero');
        expect(within(heroSection).getByText('Simple Salad')).toBeInTheDocument();
      });
    });
  });

  describe('Metadata Bar', () => {
    it('should render metadata bar with prep time', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(mockBackendRecipe({ prep_time_minutes: 25 }));
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const metadataBar = screen.getByTestId('metadata-bar');
        expect(metadataBar).toBeInTheDocument();

        const prepTime = screen.getByTestId('prep-time');
        expect(prepTime).toHaveTextContent('25');
      });
    });

    it('should render metadata bar with cook time', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(mockBackendRecipe({ cook_time_minutes: 45 }));
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const cookTime = screen.getByTestId('cook-time');
        expect(cookTime).toHaveTextContent('45');
      });
    });

    it('should render metadata bar with servings', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(mockBackendRecipe({ servings: 8 }));
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const servings = screen.getByTestId('servings');
        expect(servings).toHaveTextContent('8');
      });
    });

    it('should display all metadata fields together', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              prep_time_minutes: 15,
              cook_time_minutes: 30,
              servings: 6,
              difficulty_level: 'medium',
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const metadataBar = screen.getByTestId('metadata-bar');
        expect(metadataBar).toBeInTheDocument();

        expect(screen.getByTestId('prep-time')).toHaveTextContent('15');
        expect(screen.getByTestId('cook-time')).toHaveTextContent('30');
        expect(screen.getByTestId('servings')).toHaveTextContent('6');
      });
    });
  });

  describe('Ingredients List', () => {
    it('should render ingredients section with heading', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        const ingredientsSection = screen.getByTestId('ingredients-section');
        expect(ingredientsSection).toBeInTheDocument();
        expect(
          within(ingredientsSection).getByRole('heading', { name: /ingredients/i })
        ).toBeInTheDocument();
      });
    });

    it('should render all ingredients in list format', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              ingredients: [
                { name: 'olive oil', amount: '2', unit: 'tbsp', notes: 'extra virgin' },
                { name: 'garlic', amount: '4', unit: 'cloves', notes: 'minced' },
                { name: 'pasta', amount: '1', unit: 'lb', notes: 'spaghetti' },
                { name: 'parmesan', amount: '1', unit: 'cup', notes: 'grated' },
              ],
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const ingredientsList = screen.getByTestId('ingredients-list');
        expect(ingredientsList).toBeInTheDocument();

        // Verify each ingredient is displayed
        expect(screen.getByText(/olive oil/i)).toBeInTheDocument();
        expect(screen.getByText(/garlic/i)).toBeInTheDocument();
        expect(screen.getByText(/pasta/i)).toBeInTheDocument();
        expect(screen.getByText(/parmesan/i)).toBeInTheDocument();
      });
    });

    it('should display ingredient amounts and units', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              ingredients: [{ name: 'butter', amount: '8', unit: 'tbsp', notes: '' }],
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        // Should display "4 tbsp butter" or similar format
        expect(screen.getByText(/8/)).toBeInTheDocument();
        expect(screen.getByText(/tbsp/)).toBeInTheDocument();
        expect(screen.getByText(/butter/i)).toBeInTheDocument();
      });
    });

    it('should use semantic list element for ingredients', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        const ingredientsList = screen.getByTestId('ingredients-list');
        // Should be a ul element for accessibility
        expect(ingredientsList.tagName.toLowerCase()).toBe('ul');
      });
    });
  });

  describe('Instructions/Steps', () => {
    it('should render instructions section with heading', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        const instructionsSection = screen.getByTestId('instructions-section');
        expect(instructionsSection).toBeInTheDocument();
        expect(
          within(instructionsSection).getByRole('heading', { name: /instructions|steps/i })
        ).toBeInTheDocument();
      });
    });

    it('should render steps in correct order with numbers', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              instructions: [
                { step_number: 1, instruction: 'Boil water in a large pot', duration_minutes: 10 },
                {
                  step_number: 2,
                  instruction: 'Add pasta and cook until al dente',
                  duration_minutes: 12,
                },
                { step_number: 3, instruction: 'Drain and toss with sauce', duration_minutes: 2 },
                {
                  step_number: 4,
                  instruction: 'Serve immediately with cheese',
                  duration_minutes: undefined,
                },
              ],
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const instructionsList = screen.getByTestId('instructions-list');
        expect(instructionsList).toBeInTheDocument();

        // Verify steps are displayed
        expect(screen.getByText(/Boil water in a large pot/i)).toBeInTheDocument();
        expect(screen.getByText(/Add pasta and cook until al dente/i)).toBeInTheDocument();
        expect(screen.getByText(/Drain and toss with sauce/i)).toBeInTheDocument();
        expect(screen.getByText(/Serve immediately with cheese/i)).toBeInTheDocument();
      });
    });

    it('should use semantic ordered list for instructions', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        const instructionsList = screen.getByTestId('instructions-list');
        expect(instructionsList.tagName.toLowerCase()).toBe('ol');
      });
    });

    it('should display step numbers visually', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              instructions: [
                { step_number: 1, instruction: 'First step', duration_minutes: 5 },
                { step_number: 2, instruction: 'Second step', duration_minutes: 5 },
                { step_number: 3, instruction: 'Third step', duration_minutes: 5 },
              ],
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        // Should have step number elements or use CSS counter
        const stepNumbers = screen.getAllByTestId('step-number');
        expect(stepNumbers.length).toBeGreaterThanOrEqual(3);
        expect(stepNumbers[0]).toHaveTextContent('1');
        expect(stepNumbers[1]).toHaveTextContent('2');
        expect(stepNumbers[2]).toHaveTextContent('3');
      });
    });
  });

  describe('Timer Buttons', () => {
    it('should render timer button for steps with duration', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              instructions: [
                { step_number: 1, instruction: 'Simmer for 20 minutes', duration_minutes: 20 },
              ],
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const timerButton = screen.getByTestId('timer-button');
        expect(timerButton).toBeInTheDocument();
      });
    });

    it('should display duration on timer button', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              instructions: [{ step_number: 1, instruction: 'Bake at 350F', duration_minutes: 45 }],
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const timerButton = screen.getByTestId('timer-button');
        expect(timerButton).toHaveTextContent(/45/);
      });
    });

    it('should have accessible label on timer button', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              instructions: [{ step_number: 1, instruction: 'Simmer sauce', duration_minutes: 15 }],
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const timerButton = screen.getByTestId('timer-button');
        // Should have aria-label or visible text indicating duration
        const hasAccessibleLabel =
          timerButton.getAttribute('aria-label')?.includes('15') ||
          timerButton.textContent?.includes('15');
        expect(hasAccessibleLabel).toBe(true);
      });
    });

    it('should NOT render timer button for steps without duration', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              instructions: [
                {
                  step_number: 1,
                  instruction: 'Gather all ingredients',
                  duration_minutes: undefined,
                },
              ],
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Gather all ingredients/i)).toBeInTheDocument();
      });

      // Timer button should not exist for steps without duration
      expect(screen.queryByTestId('timer-button')).not.toBeInTheDocument();
    });

    it('should render timer buttons only for steps with duration', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              instructions: [
                { step_number: 1, instruction: 'Prep ingredients', duration_minutes: undefined },
                { step_number: 2, instruction: 'Simmer for 20 minutes', duration_minutes: 20 },
                { step_number: 3, instruction: 'Bake at 350F', duration_minutes: 45 },
                { step_number: 4, instruction: 'Let cool', duration_minutes: undefined },
              ],
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        // Should have exactly 2 timer buttons (for steps 2 and 3)
        const timerButtons = screen.getAllByTestId('timer-button');
        expect(timerButtons.length).toBe(2);
      });
    });
  });

  describe('Notes Section', () => {
    it('should render notes section when recipe has notes', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({
              notes: 'Chef tip: Let the dough rest for 30 minutes before rolling.',
            })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const notesSection = screen.getByTestId('recipe-notes');
        expect(notesSection).toBeInTheDocument();
      });
    });

    it('should display notes content', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(
            mockBackendRecipe({ notes: 'This recipe works best with room temperature eggs.' })
          );
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/room temperature eggs/i)).toBeInTheDocument();
      });
    });

    it('should have heading for notes section (screen reader navigation)', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(mockBackendRecipe({ notes: 'Some notes here' }));
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        const notesSection = screen.getByTestId('recipe-notes');
        expect(within(notesSection).getByRole('heading', { name: /notes/i })).toBeInTheDocument();
      });
    });

    it('should NOT render notes section when recipe has no notes', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/recipes/:id`, () => {
          return HttpResponse.json(mockBackendRecipe({ notes: null }));
        })
      );

      render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId('recipe-hero')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('recipe-notes')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    describe('Desktop Layout (>=768px)', () => {
      beforeEach(() => {
        vi.stubGlobal('matchMedia', mockMatchMedia(true)); // Desktop width
      });

      it('should render two-column layout on desktop', async () => {
        const { container } = render(<RecipeDetailPage />);

        await waitFor(() => {
          const contentArea = container.querySelector('[data-testid="recipe-content"]');
          expect(contentArea).toBeInTheDocument();

          // Content should have grid class for two-column layout
          expect(contentArea?.className).toMatch(/\bgrid\b/);
        });
      });

      it('should display ingredients on the left', async () => {
        render(<RecipeDetailPage />);

        await waitFor(() => {
          const ingredientsSection = screen.getByTestId('ingredients-section');
          const instructionsSection = screen.getByTestId('instructions-section');

          // Verify both sections are visible
          expect(ingredientsSection).toBeInTheDocument();
          expect(instructionsSection).toBeInTheDocument();

          // On desktop, ingredients should come first (left column)
          const ingredientsRect = ingredientsSection.getBoundingClientRect();
          const instructionsRect = instructionsSection.getBoundingClientRect();

          // Ingredients X position should be less than or equal to instructions
          expect(ingredientsRect.left).toBeLessThanOrEqual(instructionsRect.left);
        });
      });

      it('should display both ingredients and instructions sections', async () => {
        render(<RecipeDetailPage />);

        await waitFor(() => {
          expect(screen.getByTestId('ingredients-section')).toBeInTheDocument();
          expect(screen.getByTestId('instructions-section')).toBeInTheDocument();
        });
      });
    });

    describe('Mobile Layout (<768px)', () => {
      beforeEach(() => {
        vi.stubGlobal('matchMedia', mockMatchMedia(false)); // Mobile width
      });

      it('should stack layout on mobile', async () => {
        render(<RecipeDetailPage />);

        await waitFor(() => {
          const ingredientsSection = screen.getByTestId('ingredients-section');
          const instructionsSection = screen.getByTestId('instructions-section');

          // Both should be visible
          expect(ingredientsSection).toBeInTheDocument();
          expect(instructionsSection).toBeInTheDocument();

          // On mobile, sections should be stacked (one above the other)
          const ingredientsRect = ingredientsSection.getBoundingClientRect();
          const instructionsRect = instructionsSection.getBoundingClientRect();

          // X positions should be similar (stacked) or ingredients on top
          const areStacked = Math.abs(ingredientsRect.left - instructionsRect.left) < 50;
          expect(areStacked).toBe(true);
        });
      });

      it('should display hero at full width on mobile', async () => {
        render(<RecipeDetailPage />);

        await waitFor(() => {
          const heroSection = screen.getByTestId('recipe-hero');
          expect(heroSection).toBeInTheDocument();

          // Hero should have width style or class indicating full width
          const style = window.getComputedStyle(heroSection);
          expect(heroSection.className.includes('w-full') || style.width).toBeTruthy();
        });
      });
    });
  });

  describe('Edit/Delete Actions', () => {
    it('should display edit button in header area', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        const editButton = screen.getByTestId('edit-button');
        expect(editButton).toBeInTheDocument();
      });
    });

    it('should navigate to edit page when edit button is clicked', async () => {
      const { user } = render(<RecipeDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId('edit-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('edit-button'));

      expect(mockNavigate).toHaveBeenCalledWith('/recipes/1/edit');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic ol element for instructions', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        const orderedList = screen.getByTestId('instructions-list');
        expect(orderedList.tagName.toLowerCase()).toBe('ol');
      });
    });

    it('should have descriptive heading hierarchy', async () => {
      render(<RecipeDetailPage />);

      await waitFor(() => {
        // Should have h1 for recipe title
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toBeInTheDocument();

        // Should have h2 for sections (Ingredients, Instructions, Notes)
        const h2s = screen.getAllByRole('heading', { level: 2 });
        expect(h2s.length).toBeGreaterThanOrEqual(2); // At least Ingredients and Instructions
      });
    });
  });
});
