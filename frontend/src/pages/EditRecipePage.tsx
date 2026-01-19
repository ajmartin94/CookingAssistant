/**
 * Edit Recipe Page
 *
 * Page for editing existing recipes
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from '../components/common/icons';
import RecipeForm from '../components/recipes/RecipeForm';
import { recipeApi } from '../services/recipeApi';
import type { Recipe, RecipeFormData } from '../types';

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recipe
  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) {
        setError('Recipe ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await recipeApi.getRecipe(id);
        setRecipe(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  // Handle submit
  const handleSubmit = async (data: RecipeFormData) => {
    if (!id) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const updatedRecipe = await recipeApi.updateRecipe(id, data);

      // Navigate to the updated recipe
      navigate(`/recipes/${updatedRecipe.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (id) {
      navigate(`/recipes/${id}`);
    } else {
      navigate('/recipes');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Error state
  if (error && !recipe) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-6">
        <p className="text-error-700">
          <strong>Error:</strong> {error}
        </p>
        <button
          onClick={() => navigate('/recipes')}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
        >
          Back to Recipes
        </button>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  // Convert Recipe to RecipeFormData
  const initialData: RecipeFormData = {
    title: recipe.title,
    description: recipe.description,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    servings: recipe.servings,
    cuisineType: recipe.cuisineType,
    dietaryTags: recipe.dietaryTags,
    difficultyLevel: recipe.difficultyLevel,
    sourceUrl: recipe.sourceUrl,
    sourceName: recipe.sourceName,
    notes: recipe.notes,
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="text-primary-500 hover:text-primary-600 font-medium mb-4 flex items-center gap-1"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Recipe
        </button>
        <h1 className="text-3xl font-display font-bold text-neutral-900">Edit Recipe</h1>
        <p className="text-neutral-600 mt-2">Update your recipe details</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
          <p className="text-error-700">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Recipe Form */}
      <RecipeForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
