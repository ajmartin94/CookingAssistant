/**
 * Edit Recipe Page
 *
 * Page for editing existing recipes
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from '../components/common/icons';
import RecipeForm from '../components/recipes/RecipeForm';
import { ChatPanel } from '../components/chat/ChatPanel';
import { recipeApi } from '../services/recipeApi';
import type { Recipe, RecipeFormData } from '../types';

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RecipeFormData | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

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

        // Convert Recipe to RecipeFormData
        setFormData({
          title: data.title,
          description: data.description,
          ingredients: data.ingredients,
          instructions: data.instructions,
          prepTimeMinutes: data.prepTimeMinutes,
          cookTimeMinutes: data.cookTimeMinutes,
          servings: data.servings,
          cuisineType: data.cuisineType,
          dietaryTags: data.dietaryTags,
          difficultyLevel: data.difficultyLevel,
          sourceUrl: data.sourceUrl ?? '',
          sourceName: data.sourceName ?? '',
          notes: data.notes ?? '',
        });
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

  const handleApplyRecipe = (recipe: RecipeFormData) => {
    setFormData(recipe);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Error state
  if (error && !recipe) {
    return (
      <div>
        <div className="hidden">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
        <div className="bg-error-subtle border border-error rounded-lg p-6">
          <p className="text-error">
            <strong>Error:</strong> {error}
          </p>
          <button
            onClick={() => navigate('/recipes')}
            className="mt-4 px-4 py-2 bg-accent text-text-on-accent rounded-lg font-semibold hover:bg-accent-hover transition"
          >
            Back to Recipes
          </button>
        </div>
      </div>
    );
  }

  if (!recipe || !formData) {
    return null;
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="text-accent hover:text-accent-hover font-medium mb-4 flex items-center gap-1"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Recipe
        </button>
        <h1 className="text-3xl font-display font-bold text-text-primary">Edit Recipe</h1>
        <p className="text-text-secondary mt-2">Update your recipe details</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-subtle border border-error rounded-lg p-4 mb-6">
          <p className="text-error">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* AI Chat Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="px-4 py-2 bg-accent-subtle text-accent rounded-lg font-medium hover:bg-accent-subtle/80 transition"
        >
          AI Chat
        </button>
      </div>

      {/* Recipe Form */}
      <RecipeForm
        value={formData}
        onChange={setFormData}
        mode="edit"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />

      {/* Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentRecipe={formData}
        onApply={handleApplyRecipe}
        recipeId={id}
      />
    </div>
  );
}
