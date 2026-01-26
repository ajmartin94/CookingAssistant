/**
 * Recipe Detail Page
 *
 * Displays full details of a single recipe with redesigned UI featuring:
 * - Hero section with image or gradient fallback
 * - Metadata bar for prep/cook time and servings
 * - Two-column responsive layout
 * - Timer buttons for steps with duration
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, Users, Timer } from '../components/common/icons';
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
      } catch (err: unknown) {
        // Check for 404 errors and show a user-friendly message
        const isNotFound =
          (err as { response?: { status?: number } })?.response?.status === 404 ||
          (err instanceof Error && err.message.includes('404'));
        setError(
          isNotFound
            ? 'Recipe not found'
            : err instanceof Error
              ? err.message
              : 'Failed to fetch recipe'
        );
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

  // Get difficulty color - uses semantic tokens (matching RecipeCard pattern)
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-success text-text-primary';
      case 'medium':
        return 'bg-warning text-text-primary';
      case 'hard':
        return 'bg-error text-text-primary';
      default:
        return 'bg-secondary text-text-secondary';
    }
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
  if (error || !recipe) {
    return (
      <div className="bg-error-subtle border border-error rounded-lg p-6">
        <p className="text-error">
          <strong>Error:</strong> {error || 'Recipe not found'}
        </p>
        <button
          onClick={() => navigate('/recipes')}
          className="mt-4 px-4 py-2 bg-accent text-text-on-accent rounded-lg font-semibold hover:bg-accent-hover transition"
        >
          Back to Recipes
        </button>
      </div>
    );
  }

  const isOwner = user?.id === recipe.ownerId;
  const firstLetter = recipe.title.charAt(0).toUpperCase();

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/recipes')}
          className="text-accent hover:text-accent-hover font-medium mb-4 flex items-center gap-1"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Recipes
        </button>
      </div>

      {/* Hero Section */}
      <div
        data-testid="recipe-hero"
        className="relative w-full rounded-lg overflow-hidden mb-6 min-h-[300px]"
      >
        {recipe.imageUrl ? (
          <>
            <img
              data-testid="recipe-hero-image"
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-96 object-cover"
            />
            <div
              data-testid="hero-overlay"
              className="gradient-overlay absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"
            />
          </>
        ) : (
          <div
            data-testid="recipe-hero-fallback"
            className="w-full h-96 bg-gradient-to-br from-accent to-accent-hover flex flex-col items-center justify-center"
          >
            <span
              data-testid="recipe-hero-letter"
              className="text-8xl font-bold text-text-on-accent/80"
            >
              {firstLetter}
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-4xl font-bold drop-shadow-lg" data-testid="recipe-title">
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="text-lg text-white/90 mt-2 drop-shadow" data-testid="recipe-description">
              {recipe.description}
            </p>
          )}
        </div>
        {/* Edit button in hero */}
        <div className="absolute top-4 right-4">
          <button
            data-testid="edit-button"
            aria-label="Edit recipe"
            onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
            className="px-4 py-2 bg-card/90 hover:bg-card text-text-primary rounded-lg font-semibold transition shadow"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Metadata Bar */}
      <div
        data-testid="metadata-bar"
        className="bg-card rounded-lg shadow-soft p-4 mb-6 flex flex-wrap items-center justify-center gap-6"
      >
        <div className="flex items-center gap-2 text-text-secondary">
          <Clock className="w-5 h-5" />
          <span>
            Prep: <span data-testid="prep-time">{recipe.prepTimeMinutes}</span> min
          </span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <Clock className="w-5 h-5" />
          <span>
            Cook: <span data-testid="cook-time">{recipe.cookTimeMinutes}</span> min
          </span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <Clock className="w-5 h-5" />
          <span>
            Total: <span data-testid="total-time">{recipe.totalTimeMinutes}</span> min
          </span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <Users className="w-5 h-5" />
          <span>
            <span data-testid="servings">{recipe.servings}</span> servings
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {recipe.cuisineType && (
          <span className="px-3 py-1 bg-accent-subtle text-accent rounded-full text-sm font-medium">
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
            className="px-3 py-1 bg-accent-subtle text-accent rounded-full text-sm font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Two-column content layout */}
      <div data-testid="recipe-content" className="grid md:grid-cols-3 gap-6">
        {/* Ingredients */}
        <div data-testid="ingredients-section" className="md:col-span-1">
          <div className="bg-card rounded-lg shadow-soft p-6 sticky top-4">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Ingredients</h2>
            <ul className="space-y-2" data-testid="ingredients-list">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-2" data-testid="ingredient">
                  <span className="text-accent font-bold">•</span>
                  <span className="text-text-secondary">
                    <strong>
                      {ingredient.amount} {ingredient.unit}
                    </strong>{' '}
                    {ingredient.name}
                    {ingredient.notes && (
                      <span className="text-text-muted text-sm"> ({ingredient.notes})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div data-testid="instructions-section" className="md:col-span-2">
          <div className="bg-card rounded-lg shadow-soft p-6">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Instructions</h2>
            <ol className="space-y-4" data-testid="instructions-list">
              {recipe.instructions.map((instruction) => (
                <li
                  key={instruction.stepNumber}
                  className="flex gap-4 items-start"
                  data-testid="instruction"
                >
                  <div
                    data-testid="step-number"
                    className="flex-shrink-0 w-8 h-8 bg-accent text-text-on-accent rounded-full flex items-center justify-center font-bold"
                  >
                    {instruction.stepNumber}
                  </div>
                  <div className="flex-1">
                    <p className="text-text-secondary">{instruction.instruction}</p>
                    {instruction.durationMinutes && (
                      <button
                        data-testid="timer-button"
                        aria-label={`Start ${instruction.durationMinutes} minute timer`}
                        className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-accent-subtle hover:bg-accent text-accent hover:text-text-on-accent rounded-full text-sm font-medium transition"
                      >
                        <Timer className="w-4 h-4" />
                        {instruction.durationMinutes} min
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Notes */}
          {recipe.notes && (
            <div
              data-testid="recipe-notes"
              className="bg-accent-subtle border border-accent rounded-lg p-6 mt-6"
            >
              <h2 className="text-lg font-semibold text-accent mb-2">Notes</h2>
              <p className="text-text-secondary">{recipe.notes}</p>
            </div>
          )}

          {/* Source */}
          {(recipe.sourceName || recipe.sourceUrl) && (
            <div className="bg-secondary border border-default rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Source</h3>
              {recipe.sourceName && <p className="text-text-secondary">{recipe.sourceName}</p>}
              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-hover underline"
                >
                  View Original Recipe
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Owner actions */}
      {isOwner && (
        <div className="fixed bottom-6 right-6 flex gap-2">
          <button
            aria-label="Share recipe"
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 border border-accent bg-card text-accent rounded-lg font-semibold hover:bg-accent-subtle transition shadow-lg"
          >
            Share
          </button>
          <button
            aria-label="Delete recipe"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-error text-text-on-accent rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-lg"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        recipeId={recipe.id}
        itemName={recipe.title}
      />
    </div>
  );
}
