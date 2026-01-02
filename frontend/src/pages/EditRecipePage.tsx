/**
 * Edit Recipe Page
 *
 * Page for editing existing recipes
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Error state
  if (error && !recipe) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">
              <strong>Error:</strong> {error}
            </p>
            <button
              onClick={() => navigate('/recipes')}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              Back to Recipes
            </button>
          </div>
        </div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-orange-600 hover:text-orange-700 font-medium mb-4 flex items-center gap-1"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Recipe
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Edit Recipe</h1>
          <p className="text-gray-600 mt-2">Update your recipe details</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
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
    </div>
  );
}
