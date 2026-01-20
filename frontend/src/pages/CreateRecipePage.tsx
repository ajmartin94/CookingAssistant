/**
 * Create Recipe Page
 *
 * Page for creating new recipes with AI chat panel
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from '../components/common/icons';
import RecipeForm from '../components/recipes/RecipeForm';
import { recipeApi } from '../services/recipeApi';
import type { RecipeFormData } from '../types';
import { ChatProvider, useChat } from '../contexts/ChatContext';
import ChatPanel from '../components/chat/ChatPanel';

function CreateRecipePageContent() {
  const navigate = useNavigate();
  const { messages, isStreaming, error: chatError, sendMessage, confirmTool } = useChat();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-primary-500 hover:text-primary-600 font-medium mb-4 flex items-center gap-1"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Recipes
          </button>
          <h1 className="text-4xl font-bold text-neutral-900">Create New Recipe</h1>
          <p className="text-neutral-600 mt-2">Add a new recipe to your collection</p>
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
        <RecipeForm onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isSubmitting} />
      </div>

      {/* Chat Panel */}
      <ChatPanel
        messages={messages}
        isStreaming={isStreaming}
        error={chatError ?? undefined}
        context={{
          page: 'recipe_create',
        }}
        onSendMessage={sendMessage}
        onConfirmTool={confirmTool}
      />
    </div>
  );
}

export default function CreateRecipePage() {
  return (
    <ChatProvider initialContext={{ page: 'recipe_create' }}>
      <CreateRecipePageContent />
    </ChatProvider>
  );
}
