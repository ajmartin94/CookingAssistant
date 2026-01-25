import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import RecipeForm from './RecipeForm';
import type { RecipeFormData } from '../../types';

/**
 * Controlled RecipeForm Props interface (the new API we're testing toward).
 *
 * RecipeForm currently uses internal state with `initialData`. These tests
 * validate the controlled component API: value, onChange, mode.
 */
interface RecipeFormProps {
  value: RecipeFormData;
  onChange: (data: RecipeFormData) => void;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  isSubmitting?: boolean;
}

export const DEFAULT_RECIPE_FORM_DATA: RecipeFormData = {
  title: '',
  description: '',
  ingredients: [{ name: '', amount: '', unit: '' }],
  instructions: [{ stepNumber: 1, instruction: '' }],
  prepTimeMinutes: 0,
  cookTimeMinutes: 0,
  servings: 4,
  cuisineType: '',
  dietaryTags: [],
  difficultyLevel: 'easy',
  sourceUrl: '',
  sourceName: '',
  notes: '',
};

describe('RecipeForm (Controlled)', () => {
  const mockSubmit = vi.fn().mockResolvedValue(undefined);
  const mockCancel = vi.fn();
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
    mockCancel.mockClear();
    mockOnChange.mockClear();
  });

  /**
   * Controlled wrapper: manages state externally and passes value/onChange
   * to RecipeForm as props. This tests the controlled component pattern.
   */
  function renderRecipeForm(props?: Partial<RecipeFormProps>) {
    const Wrapper = () => {
      const [value, setValue] = useState<RecipeFormData>(props?.value ?? DEFAULT_RECIPE_FORM_DATA);
      const handleChange = (data: RecipeFormData) => {
        setValue(data);
        (props?.onChange ?? mockOnChange)(data);
      };
      return (
        <RecipeForm
          value={value}
          onChange={handleChange}
          mode={props?.mode ?? 'create'}
          onSubmit={props?.onSubmit ?? mockSubmit}
          onCancel={props?.onCancel ?? mockCancel}
          isSubmitting={props?.isSubmitting}
        />
      );
    };
    return render(<Wrapper />);
  }

  describe('Rendering with value prop', () => {
    it('renders with provided value prop', () => {
      const customValue: RecipeFormData = {
        ...DEFAULT_RECIPE_FORM_DATA,
        title: 'Spaghetti Carbonara',
        description: 'Classic Italian pasta dish',
        servings: 2,
        cuisineType: 'Italian',
        difficultyLevel: 'medium',
      };

      renderRecipeForm({ value: customValue });

      // The form should display the value prop data
      expect(screen.getByPlaceholderText(/homemade margherita pizza/i)).toHaveValue(
        'Spaghetti Carbonara'
      );
      expect(screen.getByPlaceholderText(/brief description/i)).toHaveValue(
        'Classic Italian pasta dish'
      );
      const numberInputs = screen.getAllByRole('spinbutton');
      expect(numberInputs[2]).toHaveValue(2); // Servings
    });
  });

  describe('Mode prop - button text', () => {
    it('shows "Create Recipe" button when mode is "create"', () => {
      renderRecipeForm({ mode: 'create' });

      expect(screen.getByRole('button', { name: /create recipe/i })).toBeInTheDocument();
    });

    it('shows "Update Recipe" button when mode is "edit"', () => {
      renderRecipeForm({ mode: 'edit' });

      expect(screen.getByRole('button', { name: /update recipe/i })).toBeInTheDocument();
    });
  });

  describe('onChange callbacks', () => {
    it('calls onChange when user types in title', async () => {
      const { user } = renderRecipeForm();

      const titleInput = screen.getByPlaceholderText(/homemade margherita pizza/i);
      await user.type(titleInput, 'A');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'A',
        })
      );
    });

    it('calls onChange when user adds ingredient', async () => {
      const { user } = renderRecipeForm();

      await user.click(screen.getByRole('button', { name: /add ingredient/i }));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: expect.arrayContaining([
            expect.objectContaining({ name: '', amount: '', unit: '' }),
            expect.objectContaining({ name: '', amount: '', unit: '' }),
          ]),
        })
      );
    });

    it('calls onChange when user removes ingredient', async () => {
      const valueWithTwoIngredients: RecipeFormData = {
        ...DEFAULT_RECIPE_FORM_DATA,
        ingredients: [
          { name: 'flour', amount: '2', unit: 'cups' },
          { name: 'sugar', amount: '1', unit: 'cup' },
        ],
      };
      const { user } = renderRecipeForm({ value: valueWithTwoIngredients });

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: expect.arrayContaining([
            expect.objectContaining({ name: 'sugar', amount: '1', unit: 'cup' }),
          ]),
        })
      );
      // Should only have 1 ingredient after removing
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.ingredients).toHaveLength(1);
    });

    it('calls onChange when user adds instruction', async () => {
      const { user } = renderRecipeForm();

      await user.click(screen.getByRole('button', { name: /add step/i }));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          instructions: expect.arrayContaining([
            expect.objectContaining({ stepNumber: 1, instruction: '' }),
            expect.objectContaining({ stepNumber: 2, instruction: '' }),
          ]),
        })
      );
    });

    it('calls onChange when user removes instruction', async () => {
      const valueWithTwoInstructions: RecipeFormData = {
        ...DEFAULT_RECIPE_FORM_DATA,
        instructions: [
          { stepNumber: 1, instruction: 'Mix ingredients' },
          { stepNumber: 2, instruction: 'Bake' },
        ],
      };
      const { user } = renderRecipeForm({ value: valueWithTwoInstructions });

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      // Last remove button is for the last instruction
      await user.click(removeButtons[removeButtons.length - 1]);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          instructions: expect.arrayContaining([
            expect.objectContaining({ stepNumber: 1, instruction: 'Mix ingredients' }),
          ]),
        })
      );
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.instructions).toHaveLength(1);
    });

    it('calls onChange when user toggles dietary tag', async () => {
      const { user } = renderRecipeForm();

      await user.click(screen.getByRole('button', { name: /^vegan$/i }));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dietaryTags: expect.arrayContaining(['vegan']),
        })
      );
    });
  });

  describe('Validation', () => {
    it('displays validation errors on submit with invalid data', async () => {
      // Default form data has empty title and description - should fail validation
      const { user } = renderRecipeForm();

      // Click the submit button (should be "Create Recipe" in create mode)
      await user.click(screen.getByRole('button', { name: /create recipe/i }));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      // onSubmit should NOT have been called with invalid data
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with current value when form is valid', async () => {
      const validData: RecipeFormData = {
        ...DEFAULT_RECIPE_FORM_DATA,
        title: 'Valid Recipe',
        description: 'A complete valid recipe',
        ingredients: [{ name: 'flour', amount: '2', unit: 'cups' }],
        instructions: [{ stepNumber: 1, instruction: 'Mix everything' }],
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 4,
      };

      const { user } = renderRecipeForm({ value: validData });

      await user.click(screen.getByRole('button', { name: /create recipe/i }));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Valid Recipe',
            description: 'A complete valid recipe',
            ingredients: expect.arrayContaining([
              expect.objectContaining({ name: 'flour', amount: '2', unit: 'cups' }),
            ]),
            instructions: expect.arrayContaining([
              expect.objectContaining({ stepNumber: 1, instruction: 'Mix everything' }),
            ]),
          })
        );
      });
    });
  });
});
