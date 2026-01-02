/**
 * Create Recipe Page
 *
 * Page for creating new recipes
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RecipeForm from '../components/recipes/RecipeForm';
import { recipeApi } from '../services/recipeApi';
import { RecipeFormData } from '../types';

export default function CreateRecipePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: RecipeFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const createdRecipe = await recipeApi.createRecipe(data);

      // Navigate to the newly created recipe
      navigate(`/recipes/${createdRecipe.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create recipe');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/recipes');
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
            Back to Recipes
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Create New Recipe</h1>
          <p className="text-gray-600 mt-2">
            Add a new recipe to your collection
          </p>
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
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
