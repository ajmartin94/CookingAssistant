/**
 * Shared Recipe Page
 *
 * Displays a recipe shared via public link (no authentication required)
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as shareApi from '../services/shareApi';
import type { Recipe } from '../types';

export default function SharedRecipePage() {
  const { token } = useParams<{ token: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Share token not provided');
      setLoading(false);
      return;
    }

    const fetchSharedRecipe = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await shareApi.getSharedRecipe(token);
        setRecipe(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shared recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedRecipe();
  }, [token]);

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-success text-text-primary';
      case 'medium':
        return 'bg-warning text-text-primary';
      case 'hard':
        return 'bg-error text-text-primary';
      default:
        return 'bg-secondary text-text-primary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="bg-card rounded-lg shadow-soft p-8 max-w-md w-full text-center">
          <svg
            className="mx-auto h-16 w-16 text-text-muted mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Unable to Load Recipe</h2>
          <p className="text-text-secondary mb-4">
            {error || 'This shared link may have expired or been revoked.'}
          </p>
          <Link to="/" className="text-accent hover:text-accent-hover font-medium">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Shared Banner */}
        <div className="bg-info-subtle border border-info rounded-lg p-4 mb-6">
          <p className="text-info text-center">This recipe was shared with you via a public link</p>
        </div>

        {/* Recipe Header */}
        <div className="bg-card rounded-lg shadow-soft overflow-hidden mb-6">
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
            <h1 className="text-4xl font-bold text-text-primary mb-2">{recipe.title}</h1>
            <p className="text-lg text-text-secondary mb-4">{recipe.description}</p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-text-secondary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Prep: {recipe.prepTimeMinutes} min | Cook: {recipe.cookTimeMinutes} min | Total:{' '}
                  {recipe.totalTimeMinutes} min
                </span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>{recipe.servings} servings</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {recipe.cuisineType && (
                <span className="px-3 py-1 bg-info-subtle text-info rounded-full text-sm font-medium">
                  {recipe.cuisineType}
                </span>
              )}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(recipe.difficultyLevel)}`}
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
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Ingredients */}
          <div className="md:col-span-1">
            <div className="bg-card rounded-lg shadow-soft p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-text-primary mb-4">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-2">
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
          <div className="md:col-span-2">
            <div className="bg-card rounded-lg shadow-soft p-6">
              <h2 className="text-2xl font-bold text-text-primary mb-4">Instructions</h2>
              <ol className="space-y-4">
                {recipe.instructions.map((instruction) => (
                  <li key={instruction.stepNumber} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-accent text-text-on-accent rounded-full flex items-center justify-center font-bold">
                      {instruction.stepNumber}
                    </div>
                    <div className="flex-1">
                      <p className="text-text-secondary">{instruction.instruction}</p>
                      {instruction.durationMinutes && (
                        <p className="text-sm text-text-muted mt-1">
                          {instruction.durationMinutes} minutes
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {recipe.notes && (
              <div className="bg-info-subtle border border-info rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-info mb-2">Notes</h3>
                <p className="text-info">{recipe.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-text-secondary mb-4">
            Want to save this recipe and create your own collections?
          </p>
          <Link
            to="/login"
            className="px-6 py-3 bg-accent text-text-on-accent rounded-lg font-semibold hover:bg-accent-hover transition inline-block"
          >
            Sign up for Cooking Assistant
          </Link>
        </div>
      </div>
    </div>
  );
}
