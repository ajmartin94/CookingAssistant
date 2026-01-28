/**
 * Create Recipe Page
 *
 * Page for creating new recipes
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from '../components/common/icons';
import RecipeForm from '../components/recipes/RecipeForm';
import { ChatPanel } from '../components/chat/ChatPanel';
import { recipeApi } from '../services/recipeApi';
import type { RecipeFormData } from '../types';
import { DEFAULT_RECIPE_FORM_DATA } from '../types';

export default function CreateRecipePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RecipeFormData>(DEFAULT_RECIPE_FORM_DATA);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleSubmit = async (data: RecipeFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const createdRecipe = await recipeApi.createRecipe(data);

      // Navigate to the newly created recipe
      navigate(`/recipes/${createdRecipe.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipe');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/recipes');
  };

  const handleApplyRecipe = (recipe: RecipeFormData) => {
    setFormData(recipe);
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="text-accent hover:text-accent-hover font-medium mb-4 flex items-center gap-1"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Recipes
        </button>
        <h1 className="text-4xl font-bold text-text-primary">Create New Recipe</h1>
        <p className="text-text-secondary mt-2">Add a new recipe to your collection</p>
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
        mode="create"
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
      />
    </div>
  );
}
