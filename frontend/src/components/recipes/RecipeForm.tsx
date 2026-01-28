import React, { useState } from 'react';
import type { RecipeFormData, Ingredient } from '../../types';

interface RecipeFormProps {
  value: RecipeFormData;
  onChange: (data: RecipeFormData) => void;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  isSubmitting?: boolean;
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  mode,
  isSubmitting = false,
}) => {
  // Error state (validation is local)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derive all form fields from value prop
  const {
    title,
    description,
    prepTimeMinutes,
    cookTimeMinutes,
    servings,
    cuisineType,
    difficultyLevel,
    sourceUrl,
    sourceName,
    notes,
    ingredients,
    instructions,
    dietaryTags,
  } = value;

  // Helper to update a single field
  const updateField = <K extends keyof RecipeFormData>(field: K, fieldValue: RecipeFormData[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  // Add ingredient
  const addIngredient = () => {
    updateField('ingredients', [...ingredients, { name: '', amount: '', unit: '' }]);
  };

  // Remove ingredient
  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      updateField(
        'ingredients',
        ingredients.filter((_, i) => i !== index)
      );
    }
  };

  // Update ingredient
  const updateIngredient = (index: number, field: keyof Ingredient, fieldValue: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: fieldValue };
    updateField('ingredients', updated);
  };

  // Add instruction
  const addInstruction = () => {
    updateField('instructions', [
      ...instructions,
      { stepNumber: instructions.length + 1, instruction: '' },
    ]);
  };

  // Remove instruction
  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      const updated = instructions
        .filter((_, i) => i !== index)
        .map((inst, i) => ({ ...inst, stepNumber: i + 1 }));
      updateField('instructions', updated);
    }
  };

  // Update instruction
  const updateInstruction = (index: number, instructionValue: string) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], instruction: instructionValue };
    updateField('instructions', updated);
  };

  // Toggle dietary tag
  const toggleDietaryTag = (tag: string) => {
    if (dietaryTags.includes(tag)) {
      updateField(
        'dietaryTags',
        dietaryTags.filter((t) => t !== tag)
      );
    } else {
      updateField('dietaryTags', [...dietaryTags, tag]);
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (prepTimeMinutes < 0) {
      newErrors.prepTimeMinutes = 'Prep time must be positive';
    }

    if (cookTimeMinutes < 0) {
      newErrors.cookTimeMinutes = 'Cook time must be positive';
    }

    if (servings < 1) {
      newErrors.servings = 'Servings must be at least 1';
    }

    const hasValidIngredient = ingredients.some((ing) => ing.name.trim() && ing.amount.trim());
    if (!hasValidIngredient) {
      newErrors.ingredients = 'At least one ingredient is required';
    }

    const hasValidInstruction = instructions.some((inst) => inst.instruction.trim());
    if (!hasValidInstruction) {
      newErrors.instructions = 'At least one instruction is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Filter out empty ingredients and instructions
    const validIngredients = ingredients.filter((ing) => ing.name.trim() && ing.amount.trim());
    const validInstructions = instructions
      .filter((inst) => inst.instruction.trim())
      .map((inst, i) => ({ ...inst, stepNumber: i + 1 }));

    const formData: RecipeFormData = {
      title: title.trim(),
      description: description.trim(),
      ingredients: validIngredients,
      instructions: validInstructions,
      prepTimeMinutes,
      cookTimeMinutes,
      servings,
      cuisineType: cuisineType.trim(),
      dietaryTags,
      difficultyLevel,
      sourceUrl: (sourceUrl ?? '').trim() || undefined,
      sourceName: (sourceName ?? '').trim() || undefined,
      notes: (notes ?? '').trim() || undefined,
    };

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-card rounded-lg shadow-soft p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Basic Information</h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Recipe Title *
            </label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => updateField('title', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${
                errors.title ? 'border-error' : 'border-default'
              }`}
              placeholder="e.g., Homemade Margherita Pizza"
            />
            {errors.title && <p className="mt-1 text-sm text-error">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${
                errors.description ? 'border-error' : 'border-default'
              }`}
              placeholder="A brief description of your recipe..."
            />
            {errors.description && <p className="mt-1 text-sm text-error">{errors.description}</p>}
          </div>

          {/* Time and Servings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Prep Time (minutes) *
              </label>
              <input
                type="number"
                name="prep_time_minutes"
                value={prepTimeMinutes}
                onChange={(e) => updateField('prepTimeMinutes', parseInt(e.target.value) || 0)}
                min="0"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${
                  errors.prepTimeMinutes ? 'border-error' : 'border-default'
                }`}
              />
              {errors.prepTimeMinutes && (
                <p className="mt-1 text-sm text-error">{errors.prepTimeMinutes}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Cook Time (minutes) *
              </label>
              <input
                type="number"
                name="cook_time_minutes"
                value={cookTimeMinutes}
                onChange={(e) => updateField('cookTimeMinutes', parseInt(e.target.value) || 0)}
                min="0"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${
                  errors.cookTimeMinutes ? 'border-error' : 'border-default'
                }`}
              />
              {errors.cookTimeMinutes && (
                <p className="mt-1 text-sm text-error">{errors.cookTimeMinutes}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Servings *
              </label>
              <input
                type="number"
                name="servings"
                value={servings}
                onChange={(e) => updateField('servings', parseInt(e.target.value) || 1)}
                min="1"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${
                  errors.servings ? 'border-error' : 'border-default'
                }`}
              />
              {errors.servings && <p className="mt-1 text-sm text-error">{errors.servings}</p>}
            </div>
          </div>

          {/* Cuisine and Difficulty Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Cuisine Type
              </label>
              <select
                name="cuisine_type"
                value={cuisineType}
                onChange={(e) => updateField('cuisineType', e.target.value)}
                className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select cuisine...</option>
                <option value="Italian">Italian</option>
                <option value="Mexican">Mexican</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="American">American</option>
                <option value="French">French</option>
                <option value="Indian">Indian</option>
                <option value="Thai">Thai</option>
                <option value="Mediterranean">Mediterranean</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Difficulty Level *
              </label>
              <select
                name="difficulty_level"
                value={difficultyLevel}
                onChange={(e) =>
                  updateField('difficultyLevel', e.target.value as 'easy' | 'medium' | 'hard')
                }
                className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-card rounded-lg shadow-soft p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Ingredients *</h2>
        {errors.ingredients && <p className="mb-3 text-sm text-error">{errors.ingredients}</p>}
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2" data-testid="ingredient-row">
              <input
                type="text"
                name="ingredient-name"
                value={ingredient.name}
                onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                placeholder="Ingredient name"
                className="flex-1 px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                name="ingredient-amount"
                value={ingredient.amount}
                onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                placeholder="Amount"
                className="w-24 px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                name="ingredient-unit"
                value={ingredient.unit}
                onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                placeholder="Unit"
                className="w-24 px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="px-3 py-2 text-error hover:bg-error-subtle rounded-lg transition"
                disabled={ingredients.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-3 px-4 py-2 text-accent hover:bg-accent-subtle rounded-lg transition font-medium"
        >
          + Add Ingredient
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-card rounded-lg shadow-soft p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Instructions *</h2>
        {errors.instructions && <p className="mb-3 text-sm text-error">{errors.instructions}</p>}
        <div className="space-y-3">
          {instructions.map((instruction, index) => (
            <div key={index} className="flex gap-2" data-testid="instruction-row">
              <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-accent-subtle text-accent font-semibold rounded">
                {index + 1}
              </div>
              <textarea
                name="instruction-text"
                value={instruction.instruction}
                onChange={(e) => updateInstruction(index, e.target.value)}
                placeholder={`Step ${index + 1} instructions...`}
                rows={2}
                className="flex-1 px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => removeInstruction(index)}
                className="px-3 py-2 text-error hover:bg-error-subtle rounded-lg transition"
                disabled={instructions.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addInstruction}
          className="mt-3 px-4 py-2 text-accent hover:bg-accent-subtle rounded-lg transition font-medium"
        >
          + Add Step
        </button>
      </div>

      {/* Dietary Tags */}
      <div className="bg-card rounded-lg shadow-soft p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Dietary Tags</h2>
        <div className="flex flex-wrap gap-2">
          {[
            'vegetarian',
            'vegan',
            'gluten-free',
            'dairy-free',
            'keto',
            'paleo',
            'low-carb',
            'nut-free',
            'soy-free',
          ].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleDietaryTag(tag)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dietaryTags.includes(tag)
                  ? 'bg-accent text-text-on-accent'
                  : 'bg-secondary text-text-secondary hover:bg-hover'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Source Information */}
      <div className="bg-card rounded-lg shadow-soft p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Source Information (Optional)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Source Name
            </label>
            <input
              type="text"
              value={sourceName ?? ''}
              onChange={(e) => updateField('sourceName', e.target.value)}
              className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g., Grandma's cookbook, Chef John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Source URL</label>
            <input
              type="url"
              value={sourceUrl ?? ''}
              onChange={(e) => updateField('sourceUrl', e.target.value)}
              className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-card rounded-lg shadow-soft p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Additional Notes (Optional)
        </h2>
        <textarea
          value={notes ?? ''}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Any additional notes, tips, or variations..."
        />
      </div>

      {/* Validation Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div role="alert" className="bg-error-subtle border border-error rounded-lg p-4">
          <p className="text-error font-medium">
            Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''}{' '}
            above before submitting.
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-default rounded-lg font-semibold text-text-secondary hover:bg-hover transition"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-accent text-text-on-accent rounded-lg font-semibold hover:bg-accent-hover transition disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Recipe' : 'Update Recipe'}
        </button>
      </div>
    </form>
  );
};

export default RecipeForm;
