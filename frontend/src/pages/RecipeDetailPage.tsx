/**
 * Recipe Detail Page
 *
 * Displays full details of a single recipe
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipeApi } from '../services/recipeApi';
import type { Recipe } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/sharing/ShareModal';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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

  // Handle delete
  const handleDelete = async () => {
    if (!id || !recipe) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${recipe.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await recipeApi.deleteRecipe(id);
      navigate('/recipes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe');
      setDeleting(false);
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-success-100 text-success-700';
      case 'medium':
        return 'bg-warning-100 text-warning-700';
      case 'hard':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-error-50 border border-error-200 rounded-lg p-6">
            <p className="text-error-700">
              <strong>Error:</strong> {error || 'Recipe not found'}
            </p>
            <button
              onClick={() => navigate('/recipes')}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
            >
              Back to Recipes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === recipe.ownerId;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/recipes')}
            className="text-primary-500 hover:text-primary-600 font-medium mb-4 flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Recipes
          </button>
        </div>

        {/* Recipe Header */}
        <div className="bg-white rounded-lg shadow-soft overflow-hidden mb-6">
          {/* Recipe Image */}
          {recipe.imageUrl && (
            <div className="h-96 overflow-hidden">
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            {/* Title and Actions */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-bold text-neutral-900 mb-2" data-testid="recipe-title">
                  {recipe.title}
                </h1>
                <p className="text-lg text-neutral-600" data-testid="recipe-description">
                  {recipe.description}
                </p>
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-4 py-2 border border-primary-500 text-primary-500 rounded-lg font-semibold hover:bg-primary-50 transition"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-error-500 text-white rounded-lg font-semibold hover:bg-error-600 transition disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-neutral-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Prep: <span data-testid="prep-time">{recipe.prepTimeMinutes}</span> min | Cook:{' '}
                  <span data-testid="cook-time">{recipe.cookTimeMinutes}</span> min | Total:{' '}
                  <span data-testid="total-time">{recipe.totalTimeMinutes}</span> min
                </span>
              </div>

              <div className="flex items-center gap-2 text-neutral-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span data-testid="servings">{recipe.servings} servings</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {recipe.cuisineType && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {recipe.cuisineType}
                </span>
              )}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                  recipe.difficultyLevel
                )}`}
              >
                {recipe.difficultyLevel}
              </span>
              {recipe.dietaryTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Ingredients */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-soft p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Ingredients</h2>
              <ul className="space-y-2" data-testid="ingredients-list">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary-500 font-bold">•</span>
                    <span className="text-neutral-700">
                      <strong>
                        {ingredient.amount} {ingredient.unit}
                      </strong>{' '}
                      {ingredient.name}
                      {ingredient.notes && (
                        <span className="text-neutral-500 text-sm"> ({ingredient.notes})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Instructions */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-soft p-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Instructions</h2>
              <ol className="space-y-4" data-testid="instructions-list">
                {recipe.instructions.map((instruction) => (
                  <li
                    key={instruction.stepNumber}
                    className="flex gap-4 items-start"
                    data-testid="instruction"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                      {instruction.stepNumber}
                    </div>
                    <div className="flex-1">
                      <p className="text-neutral-700">{instruction.instruction}</p>
                      {instruction.durationMinutes && (
                        <p className="text-sm text-neutral-500 mt-1">
                          ⏱️ {instruction.durationMinutes} minutes
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Notes */}
            {recipe.notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Notes</h3>
                <p className="text-blue-800">{recipe.notes}</p>
              </div>
            )}

            {/* Source */}
            {(recipe.sourceName || recipe.sourceUrl) && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Source</h3>
                {recipe.sourceName && <p className="text-neutral-700">{recipe.sourceName}</p>}
                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:text-primary-600 underline"
                  >
                    View Original Recipe
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          recipeId={recipe.id}
          itemName={recipe.title}
        />
      </div>
    </div>
  );
}
