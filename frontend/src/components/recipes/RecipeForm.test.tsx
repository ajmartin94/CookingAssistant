import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import RecipeForm from './RecipeForm';
import type { RecipeFormData } from '../../types';

describe('RecipeForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  const mockInitialData: RecipeFormData = {
    title: 'Test Recipe',
    description: 'A test recipe',
    ingredients: [
      { name: 'flour', amount: '2', unit: 'cups' },
      { name: 'sugar', amount: '1', unit: 'cup' },
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Mix ingredients' },
      { stepNumber: 2, instruction: 'Bake' },
    ],
    prepTimeMinutes: 10,
    cookTimeMinutes: 30,
    servings: 4,
    cuisineType: 'Italian',
    dietaryTags: ['vegetarian'],
    difficultyLevel: 'medium',
  };

  describe('Rendering', () => {
    it('should render empty form with default values', () => {
      render(<RecipeForm {...defaultProps} />);

      expect(screen.getByPlaceholderText(/homemade margherita pizza/i)).toHaveValue('');
      expect(screen.getByPlaceholderText(/brief description/i)).toHaveValue('');

      const numberInputs = screen.getAllByRole('spinbutton');
      expect(numberInputs[0]).toHaveValue(0); // Prep time
      expect(numberInputs[1]).toHaveValue(0); // Cook time
      expect(numberInputs[2]).toHaveValue(4); // Servings

      // Two comboboxes: cuisine type and difficulty level
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes[0]).toHaveValue(''); // Cuisine type (empty default)
      expect(comboboxes[1]).toHaveValue('medium'); // Difficulty level
    });

    it('should render form with initial data', () => {
      render(<RecipeForm {...defaultProps} initialData={mockInitialData} />);

      expect(screen.getByPlaceholderText(/homemade margherita pizza/i)).toHaveValue('Test Recipe');
      expect(screen.getByPlaceholderText(/brief description/i)).toHaveValue('A test recipe');

      const numberInputs = screen.getAllByRole('spinbutton');
      expect(numberInputs[0]).toHaveValue(10); // Prep time
      expect(numberInputs[1]).toHaveValue(30); // Cook time
      expect(numberInputs[2]).toHaveValue(4); // Servings

      // Two comboboxes: cuisine type and difficulty level
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes[0]).toHaveValue('Italian'); // Cuisine type
      expect(comboboxes[1]).toHaveValue('medium'); // Difficulty level
    });

    it('should render all form sections', () => {
      render(<RecipeForm {...defaultProps} />);

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Ingredients *')).toBeInTheDocument();
      expect(screen.getByText('Instructions *')).toBeInTheDocument();
      expect(screen.getByText('Dietary Tags')).toBeInTheDocument();
      expect(screen.getByText('Source Information (Optional)')).toBeInTheDocument();
      expect(screen.getByText('Additional Notes (Optional)')).toBeInTheDocument();
    });
  });

  describe('Basic Fields', () => {
    it('should update title field', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText(/homemade margherita pizza/i);

      await user.clear(titleInput);
      await user.type(titleInput, 'Chocolate Cake');

      expect(titleInput).toHaveValue('Chocolate Cake');
    });

    it('should update description field', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);
      const descInput = screen.getByPlaceholderText(/brief description/i);

      await user.clear(descInput);
      await user.type(descInput, 'Delicious cake');

      expect(descInput).toHaveValue('Delicious cake');
    });

    it('should update prep time', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);
      const numberInputs = screen.getAllByRole('spinbutton');
      const prepInput = numberInputs[0]; // First spinbutton is prep time

      await user.clear(prepInput);
      await user.type(prepInput, '15');

      expect(prepInput).toHaveValue(15);
    });

    it('should update cook time', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);
      const numberInputs = screen.getAllByRole('spinbutton');
      const cookInput = numberInputs[1]; // Second spinbutton is cook time

      await user.clear(cookInput);
      await user.type(cookInput, '45');

      expect(cookInput).toHaveValue(45);
    });

    it('should update servings', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);
      const numberInputs = screen.getAllByRole('spinbutton');
      const servingsInput = numberInputs[2]; // Third spinbutton is servings

      // Triple-click to select all, then type to replace
      await user.tripleClick(servingsInput);
      await user.keyboard('6');

      expect(servingsInput).toHaveValue(6);
    });

    it('should update cuisine type', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);
      const comboboxes = screen.getAllByRole('combobox');
      const cuisineSelect = comboboxes[0]; // First combobox is cuisine type

      await user.selectOptions(cuisineSelect, 'Mexican');

      expect(cuisineSelect).toHaveValue('Mexican');
    });

    it('should update difficulty level', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);
      const comboboxes = screen.getAllByRole('combobox');
      const difficultySelect = comboboxes[1]; // Second combobox is difficulty level

      await user.selectOptions(difficultySelect, 'hard');

      expect(difficultySelect).toHaveValue('hard');
    });
  });

  describe('Ingredients Management', () => {
    it('should render initial ingredient row', () => {
      render(<RecipeForm {...defaultProps} />);

      const ingredientInputs = screen.getAllByPlaceholderText(/ingredient name/i);
      expect(ingredientInputs).toHaveLength(1);
    });

    it('should add new ingredient', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add ingredient/i }));

      const ingredientInputs = screen.getAllByPlaceholderText(/ingredient name/i);
      expect(ingredientInputs).toHaveLength(2);
    });

    it('should remove ingredient', async () => {
      const { user } = render(<RecipeForm {...defaultProps} initialData={mockInitialData} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      // First remove button is for ingredients
      await user.click(removeButtons[0]);

      const ingredientInputs = screen.getAllByPlaceholderText(/ingredient name/i);
      expect(ingredientInputs).toHaveLength(1);
    });

    it('should not remove last ingredient', () => {
      render(<RecipeForm {...defaultProps} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      const firstRemoveButton = removeButtons[0];

      expect(firstRemoveButton).toBeDisabled();
    });

    it('should update ingredient fields', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText(/ingredient name/i);
      const amountInput = screen.getByPlaceholderText(/amount/i);
      const unitInput = screen.getByPlaceholderText(/unit/i);

      await user.type(nameInput, 'flour');
      await user.type(amountInput, '2');
      await user.type(unitInput, 'cups');

      expect(nameInput).toHaveValue('flour');
      expect(amountInput).toHaveValue('2');
      expect(unitInput).toHaveValue('cups');
    });
  });

  describe('Instructions Management', () => {
    it('should render initial instruction row', () => {
      render(<RecipeForm {...defaultProps} />);

      const instructionInputs = screen.getAllByPlaceholderText(/step 1 instructions/i);
      expect(instructionInputs).toHaveLength(1);
    });

    it('should add new instruction', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add step/i }));

      const step1 = screen.getByPlaceholderText(/step 1 instructions/i);
      const step2 = screen.getByPlaceholderText(/step 2 instructions/i);

      expect(step1).toBeInTheDocument();
      expect(step2).toBeInTheDocument();
    });

    it('should remove instruction', async () => {
      const { user } = render(<RecipeForm {...defaultProps} initialData={mockInitialData} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      // Find the remove button for instructions (after ingredients)
      const instructionRemoveButton = removeButtons[removeButtons.length - 1];
      await user.click(instructionRemoveButton);

      const instructionInputs = screen.queryByPlaceholderText(/step 2 instructions/i);
      expect(instructionInputs).not.toBeInTheDocument();
    });

    it('should not remove last instruction', () => {
      render(<RecipeForm {...defaultProps} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      const lastRemoveButton = removeButtons[removeButtons.length - 1];

      expect(lastRemoveButton).toBeDisabled();
    });

    it('should update instruction text', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      const instructionInput = screen.getByPlaceholderText(/step 1 instructions/i);

      await user.type(instructionInput, 'Mix all ingredients');

      expect(instructionInput).toHaveValue('Mix all ingredients');
    });

    it('should renumber steps when instruction removed', async () => {
      const { user } = render(<RecipeForm {...defaultProps} initialData={mockInitialData} />);

      // Add a third instruction
      await user.click(screen.getByRole('button', { name: /add step/i }));

      // Verify we have 3 steps
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      // Remove middle instruction (step 2)
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      // Second to last remove button (middle instruction)
      await user.click(removeButtons[removeButtons.length - 2]);

      // Should now only have steps 1 and 2
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.queryByText('3')).not.toBeInTheDocument();
    });
  });

  describe('Dietary Tags', () => {
    it('should toggle dietary tag on', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      const veganButton = screen.getByRole('button', { name: /^vegan$/i });
      await user.click(veganButton);

      expect(veganButton).toHaveClass('bg-purple-600');
    });

    it('should toggle dietary tag off', async () => {
      const { user } = render(<RecipeForm {...defaultProps} initialData={mockInitialData} />);

      const vegetarianButton = screen.getByRole('button', { name: /^vegetarian$/i });
      expect(vegetarianButton).toHaveClass('bg-purple-600');

      await user.click(vegetarianButton);

      expect(vegetarianButton).not.toHaveClass('bg-purple-600');
      expect(vegetarianButton).toHaveClass('bg-gray-100');
    });

    it('should handle multiple dietary tags', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /^vegan$/i }));
      await user.click(screen.getByRole('button', { name: /^gluten-free$/i }));

      expect(screen.getByRole('button', { name: /^vegan$/i })).toHaveClass('bg-purple-600');
      expect(screen.getByRole('button', { name: /^gluten-free$/i })).toHaveClass('bg-purple-600');
    });
  });

  describe('Source Information', () => {
    it('should update source name', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      const sourceNameInput = screen.getByPlaceholderText(/grandma's cookbook/i);
      await user.type(sourceNameInput, 'Chef John');

      expect(sourceNameInput).toHaveValue('Chef John');
    });

    it('should update source URL', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      const sourceUrlInput = screen.getByPlaceholderText(/https:/);
      await user.type(sourceUrlInput, 'https://example.com');

      expect(sourceUrlInput).toHaveValue('https://example.com');
    });
  });

  describe('Notes', () => {
    it('should update notes field', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      const notesInput = screen.getByPlaceholderText(/additional notes/i);
      await user.type(notesInput, 'This is a test note');

      expect(notesInput).toHaveValue('This is a test note');
    });
  });

  describe('Validation', () => {
    it('should show error for empty title', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      // Fill in required fields except title
      await user.type(screen.getByPlaceholderText(/brief description/i), 'Test description');
      const ingredientName = screen.getByPlaceholderText(/ingredient name/i);
      const ingredientAmount = screen.getByPlaceholderText(/amount/i);
      await user.type(ingredientName, 'flour');
      await user.type(ingredientAmount, '2');
      const instructionInput = screen.getByPlaceholderText(/step 1 instructions/i);
      await user.type(instructionInput, 'Mix');

      await user.click(screen.getByRole('button', { name: /^create$/i }));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    it('should show error for empty description', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      // Fill in required fields except description
      await user.type(screen.getByPlaceholderText(/homemade margherita pizza/i), 'Test Recipe');
      const ingredientName = screen.getByPlaceholderText(/ingredient name/i);
      const ingredientAmount = screen.getByPlaceholderText(/amount/i);
      await user.type(ingredientName, 'flour');
      await user.type(ingredientAmount, '2');
      const instructionInput = screen.getByPlaceholderText(/step 1 instructions/i);
      await user.type(instructionInput, 'Mix');

      await user.click(screen.getByRole('button', { name: /^create$/i }));

      await waitFor(() => {
        expect(screen.getByText('Description is required')).toBeInTheDocument();
      });
    });

    it('should show error for no valid ingredients', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      await user.type(screen.getByPlaceholderText(/homemade margherita pizza/i), 'Test Recipe');
      await user.type(screen.getByPlaceholderText(/brief description/i), 'Test description');
      const instructionInput = screen.getByPlaceholderText(/step 1 instructions/i);
      await user.type(instructionInput, 'Mix');

      await user.click(screen.getByRole('button', { name: /^create$/i }));

      await waitFor(() => {
        expect(screen.getByText('At least one ingredient is required')).toBeInTheDocument();
      });
    });

    it('should show error for no valid instructions', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      await user.type(screen.getByPlaceholderText(/homemade margherita pizza/i), 'Test Recipe');
      await user.type(screen.getByPlaceholderText(/brief description/i), 'Test description');
      const ingredientName = screen.getByPlaceholderText(/ingredient name/i);
      const ingredientAmount = screen.getByPlaceholderText(/amount/i);
      await user.type(ingredientName, 'flour');
      await user.type(ingredientAmount, '2');

      await user.click(screen.getByRole('button', { name: /^create$/i }));

      await waitFor(() => {
        expect(screen.getByText('At least one instruction is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with valid data', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      // Fill in all required fields
      await user.type(screen.getByPlaceholderText(/homemade margherita pizza/i), 'Test Recipe');
      await user.type(screen.getByPlaceholderText(/brief description/i), 'A delicious test recipe');

      const ingredientName = screen.getByPlaceholderText(/ingredient name/i);
      const ingredientAmount = screen.getByPlaceholderText(/amount/i);
      const ingredientUnit = screen.getByPlaceholderText(/unit/i);
      await user.type(ingredientName, 'flour');
      await user.type(ingredientAmount, '2');
      await user.type(ingredientUnit, 'cups');

      const instructionInput = screen.getByPlaceholderText(/step 1 instructions/i);
      await user.type(instructionInput, 'Mix all ingredients together');

      await user.click(screen.getByRole('button', { name: /^create$/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Recipe',
            description: 'A delicious test recipe',
            ingredients: expect.arrayContaining([
              expect.objectContaining({
                name: 'flour',
                amount: '2',
                unit: 'cups',
              }),
            ]),
            instructions: expect.arrayContaining([
              expect.objectContaining({
                stepNumber: 1,
                instruction: 'Mix all ingredients together',
              }),
            ]),
          })
        );
      });
    });

    it('should filter out empty ingredients on submit', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      await user.type(screen.getByPlaceholderText(/homemade margherita pizza/i), 'Test Recipe');
      await user.type(screen.getByPlaceholderText(/brief description/i), 'Test description');

      // Add ingredient with data
      const ingredientName = screen.getByPlaceholderText(/ingredient name/i);
      const ingredientAmount = screen.getByPlaceholderText(/amount/i);
      await user.type(ingredientName, 'flour');
      await user.type(ingredientAmount, '2');

      // Add empty ingredient
      await user.click(screen.getByRole('button', { name: /add ingredient/i }));

      const instructionInput = screen.getByPlaceholderText(/step 1 instructions/i);
      await user.type(instructionInput, 'Mix');

      await user.click(screen.getByRole('button', { name: /^create$/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            ingredients: expect.arrayContaining([
              expect.objectContaining({ name: 'flour', amount: '2' }),
            ]),
          })
        );
        const call = mockOnSubmit.mock.calls[0][0];
        expect(call.ingredients).toHaveLength(1);
      });
    });

    it('should filter out empty instructions on submit', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      await user.type(screen.getByPlaceholderText(/homemade margherita pizza/i), 'Test Recipe');
      await user.type(screen.getByPlaceholderText(/brief description/i), 'Test description');

      const ingredientName = screen.getByPlaceholderText(/ingredient name/i);
      const ingredientAmount = screen.getByPlaceholderText(/amount/i);
      await user.type(ingredientName, 'flour');
      await user.type(ingredientAmount, '2');

      // Add instruction with content
      const instructionInput = screen.getByPlaceholderText(/step 1 instructions/i);
      await user.type(instructionInput, 'Mix ingredients');

      // Add empty instruction
      await user.click(screen.getByRole('button', { name: /add step/i }));

      await user.click(screen.getByRole('button', { name: /^create$/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            instructions: expect.arrayContaining([
              expect.objectContaining({ stepNumber: 1, instruction: 'Mix ingredients' }),
            ]),
          })
        );
        const call = mockOnSubmit.mock.calls[0][0];
        expect(call.instructions).toHaveLength(1);
      });
    });

    it('should not submit if validation fails', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      // Try to submit without filling required fields
      await user.click(screen.getByRole('button', { name: /^create$/i }));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should disable submit button while submitting', () => {
      render(<RecipeForm {...defaultProps} isSubmitting={true} />);

      const submitButton = screen.getByRole('button', { name: /saving/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show "Saving..." text while submitting', () => {
      render(<RecipeForm {...defaultProps} isSubmitting={true} />);

      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    });
  });

  describe('Cancel', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const { user } = render(<RecipeForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable cancel button while submitting', () => {
      render(<RecipeForm {...defaultProps} isSubmitting={true} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });
});
