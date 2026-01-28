import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Heart } from '../common/icons';
import type { Recipe } from '../../types';

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  // Helper function to get difficulty color - uses semantic tokens
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

  // Get first letter for image fallback
  const getFirstLetter = (title: string) => {
    return title.charAt(0).toUpperCase();
  };

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="block bg-card rounded-lg shadow-soft card-animated overflow-hidden"
      aria-label={recipe.title}
      data-testid="recipe-card"
    >
      <div>
        {/* Recipe Image */}
        <div className="h-48 bg-secondary overflow-hidden relative">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
              data-testid="card-image"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent to-accent-hover"
              data-testid="image-fallback"
            >
              <span className="text-5xl font-bold text-text-on-accent">
                {getFirstLetter(recipe.title)}
              </span>
            </div>
          )}
          {/* Favorite Heart Overlay */}
          <button
            className="absolute top-2 left-2 text-accent"
            data-testid="favorite-heart"
            aria-label="Toggle favorite"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="w-5 h-5" />
          </button>
          {/* Time Badge Overlay */}
          <span
            className="absolute top-2 right-2 bg-secondary/80 text-text-primary text-xs px-2 py-1 rounded"
            data-testid="time-badge"
          >
            {recipe.cookTimeMinutes} min
          </span>
        </div>

        {/* Recipe Info */}
        <div className="p-4">
          {/* Title */}
          <h3
            className="text-xl font-semibold text-primary mb-2 line-clamp-2"
            data-testid="card-title"
          >
            {recipe.title}
          </h3>

          {/* Description */}
          <p className="text-text-secondary text-sm mb-3 line-clamp-2">{recipe.description}</p>

          {/* Time and Servings */}
          <div
            className="flex items-center gap-4 text-sm text-text-muted mb-3"
            data-testid="card-metadata"
          >
            <div className="flex items-center gap-1" data-testid="card-time">
              <Clock className="w-4 h-4" />
              <span>{recipe.cookTimeMinutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{recipe.servings} servings</span>
            </div>
          </div>

          {/* Cuisine and Difficulty */}
          <div className="flex items-center gap-2 mb-3">
            {recipe.cuisineType && (
              <span className="text-xs bg-accent-subtle text-accent px-2 py-1 rounded">
                {recipe.cuisineType}
              </span>
            )}
            <span
              className={`text-xs px-2 py-1 rounded ${getDifficultyColor(recipe.difficultyLevel)}`}
            >
              {recipe.difficultyLevel}
            </span>
          </div>

          {/* Dietary Tags */}
          {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.dietaryTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-accent-subtle text-accent px-2 py-1 rounded"
                  data-testid="card-tag"
                >
                  {tag}
                </span>
              ))}
              {recipe.dietaryTags.length > 3 && (
                <span className="text-xs bg-secondary text-text-secondary px-2 py-1 rounded">
                  +{recipe.dietaryTags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
