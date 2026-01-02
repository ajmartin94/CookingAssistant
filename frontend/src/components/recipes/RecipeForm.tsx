import React, { useState, useEffect } from 'react';
import { RecipeFormData, Ingredient, Instruction } from '../../types';

interface RecipeFormProps {
  initialData?: RecipeFormData;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    initialData?.prepTimeMinutes || 0
  );
  const [cookTimeMinutes, setCookTimeMinutes] = useState(
    initialData?.cookTimeMinutes || 0
  );
  const [servings, setServings] = useState(initialData?.servings || 4);
  const [cuisineType, setCuisineType] = useState(initialData?.cuisineType || '');
  const [difficultyLevel, setDifficultyLevel] = useState<'easy' | 'medium' | 'hard'>(
    initialData?.difficultyLevel || 'medium'
  );
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || '');
  const [sourceName, setSourceName] = useState(initialData?.sourceName || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Ingredients state
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients || [{ name: '', amount: '', unit: '' }]
  );

  // Instructions state
  const [instructions, setInstructions] = useState<Instruction[]>(
    initialData?.instructions || [{ stepNumber: 1, instruction: '' }]
  );

  // Dietary tags state
  const [dietaryTags, setDietaryTags] = useState<string[]>(
    initialData?.dietaryTags || []
  );

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add ingredient
  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  // Remove ingredient
  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  // Update ingredient
  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  // Add instruction
  const addInstruction = () => {
    setInstructions([
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
      setInstructions(updated);
    }
  };

  // Update instruction
  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], instruction: value };
    setInstructions(updated);
  };

  // Toggle dietary tag
  const toggleDietaryTag = (tag: string) => {
    if (dietaryTags.includes(tag)) {
      setDietaryTags(dietaryTags.filter((t) => t !== tag));
    } else {
      setDietaryTags([...dietaryTags, tag]);
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

    const hasValidIngredient = ingredients.some(
      (ing) => ing.name.trim() && ing.amount.trim()
    );
    if (!hasValidIngredient) {
      newErrors.ingredients = 'At least one ingredient is required';
    }

    const hasValidInstruction = instructions.some((inst) =>
      inst.instruction.trim()
    );
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
    const validIngredients = ingredients.filter(
      (ing) => ing.name.trim() && ing.amount.trim()
    );
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
      sourceUrl: sourceUrl.trim() || undefined,
      sourceName: sourceName.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Basic Information
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipe Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Homemade Margherita Pizza"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="A brief description of your recipe..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Time and Servings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prep Time (minutes) *
              </label>
              <input
                type="number"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(parseInt(e.target.value) || 0)}
                min="0"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.prepTimeMinutes ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.prepTimeMinutes && (
                <p className="mt-1 text-sm text-red-600">{errors.prepTimeMinutes}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cook Time (minutes) *
              </label>
              <input
                type="number"
                value={cookTimeMinutes}
                onChange={(e) => setCookTimeMinutes(parseInt(e.target.value) || 0)}
                min="0"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.cookTimeMinutes ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cookTimeMinutes && (
                <p className="mt-1 text-sm text-red-600">{errors.cookTimeMinutes}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servings *
              </label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                min="1"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.servings ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.servings && (
                <p className="mt-1 text-sm text-red-600">{errors.servings}</p>
              )}
            </div>
          </div>

          {/* Cuisine and Difficulty Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuisine Type
              </label>
              <input
                type="text"
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Italian, Mexican, Chinese"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level *
              </label>
              <select
                value={difficultyLevel}
                onChange={(e) =>
                  setDifficultyLevel(e.target.value as 'easy' | 'medium' | 'hard')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients *</h2>
        {errors.ingredients && (
          <p className="mb-3 text-sm text-red-600">{errors.ingredients}</p>
        )}
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={ingredient.name}
                onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                placeholder="Ingredient name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                value={ingredient.amount}
                onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                placeholder="Amount"
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                value={ingredient.unit}
                onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                placeholder="Unit"
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
          className="mt-3 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition font-medium"
        >
          + Add Ingredient
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions *</h2>
        {errors.instructions && (
          <p className="mb-3 text-sm text-red-600">{errors.instructions}</p>
        )}
        <div className="space-y-3">
          {instructions.map((instruction, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-orange-100 text-orange-800 font-semibold rounded">
                {index + 1}
              </div>
              <textarea
                value={instruction.instruction}
                onChange={(e) => updateInstruction(index, e.target.value)}
                placeholder={`Step ${index + 1} instructions...`}
                rows={2}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => removeInstruction(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
          className="mt-3 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition font-medium"
        >
          + Add Step
        </button>
      </div>

      {/* Dietary Tags */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dietary Tags</h2>
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
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Source Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Source Information (Optional)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Name
            </label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Grandma's cookbook, Chef John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source URL
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Additional Notes (Optional)
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Any additional notes, tips, or variations..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Recipe'}
        </button>
      </div>
    </form>
  );
};

export default RecipeForm;
