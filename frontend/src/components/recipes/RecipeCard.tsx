import React from 'react';
import { Link } from 'react-router-dom';
import type { Recipe } from '../../types';

type ViewMode = 'grid' | 'list' | 'compact';

interface RecipeCardProps {
  recipe: Recipe;
  viewMode?: ViewMode;
  isFavorited?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  viewMode = 'grid',
  isFavorited = false,
  onToggleFavorite,
  onEdit,
  onDelete,
}) => {
  // Helper function to get difficulty color
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

  // List view layout
  if (viewMode === 'list') {
    return (
      <Link
        to={`/recipes/${recipe.id}`}
        className="group block bg-white rounded-lg shadow-soft hover:shadow-soft-md transition-all duration-200 overflow-hidden"
        data-testid="recipe-card"
      >
        <div className="flex">
          {/* Recipe Image */}
          <div className="w-48 h-36 flex-shrink-0 bg-neutral-200 overflow-hidden relative">
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {/* Favorite Button */}
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <HeartIcon filled={isFavorited} />
              </button>
            )}
          </div>

          {/* Recipe Info */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-neutral-800 line-clamp-1">
                  {recipe.title}
                </h3>
                {/* Hover Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                      aria-label="Edit recipe"
                    >
                      <EditIcon />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="p-1.5 rounded-lg text-neutral-500 hover:bg-error-50 hover:text-error-600"
                      aria-label="Delete recipe"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-neutral-600 text-sm mt-1 line-clamp-2">
                {recipe.description}
              </p>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <ClockIcon />
                  {recipe.totalTimeMinutes} min
                </span>
                <span className="flex items-center gap-1">
                  <ServingsIcon />
                  {recipe.servings}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {recipe.cuisineType && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {recipe.cuisineType}
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(recipe.difficultyLevel)}`}>
                  {recipe.difficultyLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Compact view layout
  if (viewMode === 'compact') {
    return (
      <Link
        to={`/recipes/${recipe.id}`}
        className="group block bg-white rounded-lg shadow-soft hover:shadow-soft-md hover:scale-[1.02] transition-all duration-200 overflow-hidden"
        data-testid="recipe-card"
      >
        {/* Recipe Image */}
        <div className="h-32 bg-neutral-200 overflow-hidden relative">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className="absolute top-2 right-2 p-1 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <HeartIcon filled={isFavorited} size="sm" />
            </button>
          )}
        </div>

        {/* Recipe Info */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-neutral-800 line-clamp-1">
            {recipe.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <ClockIcon size="sm" />
              {recipe.totalTimeMinutes}m
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${getDifficultyColor(recipe.difficultyLevel)}`}>
              {recipe.difficultyLevel}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Grid view layout (default)
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group block bg-white rounded-lg shadow-soft hover:shadow-soft-md hover:scale-[1.02] transition-all duration-200 overflow-hidden"
      data-testid="recipe-card"
    >
      {/* Recipe Image */}
      <div className="h-48 bg-neutral-200 overflow-hidden relative">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <HeartIcon filled={isFavorited} />
          </button>
        )}

        {/* Hover Overlay with Actions */}
        {(onEdit || onDelete) && (
          <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 rounded-full bg-white text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                aria-label="Edit recipe"
              >
                <EditIcon />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 rounded-full bg-white text-neutral-700 hover:bg-error-50 hover:text-error-600 transition-colors"
                aria-label="Delete recipe"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recipe Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-xl font-semibold text-neutral-800 mb-2 line-clamp-2">
          {recipe.title}
        </h3>

        {/* Description */}
        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
          {recipe.description}
        </p>

        {/* Time and Servings */}
        <div className="flex items-center gap-4 text-sm text-neutral-500 mb-3">
          <div className="flex items-center gap-1">
            <ClockIcon />
            <span>{recipe.totalTimeMinutes} min</span>
          </div>
          <div className="flex items-center gap-1">
            <ServingsIcon />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        {/* Cuisine and Difficulty */}
        <div className="flex items-center gap-2 mb-3">
          {recipe.cuisineType && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {recipe.cuisineType}
            </span>
          )}
          <span
            className={`text-xs px-2 py-1 rounded ${getDifficultyColor(
              recipe.difficultyLevel
            )}`}
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
                className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
            {recipe.dietaryTags.length > 3 && (
              <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                +{recipe.dietaryTags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

// Icon components
function HeartIcon({ filled = false, size = 'md' }: { filled?: boolean; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return filled ? (
    <svg className={`${sizeClass} text-error-500`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ) : (
    <svg className={`${sizeClass} text-neutral-400 hover:text-error-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function ClockIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ServingsIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export default RecipeCard;
