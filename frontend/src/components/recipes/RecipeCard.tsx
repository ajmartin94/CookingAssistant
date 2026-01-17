import React from 'react';
import { Link } from 'react-router-dom';
import { Image, Clock, Users } from '../common/icons';
import type { Recipe } from '../../types';

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
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

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="block bg-white rounded-lg shadow-soft hover:shadow-soft-md transition-shadow duration-200 overflow-hidden"
      data-testid="recipe-card"
    >
      {/* Recipe Image */}
      <div className="h-48 bg-neutral-200 overflow-hidden">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <Image className="w-16 h-16" />
          </div>
        )}
      </div>

      {/* Recipe Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-xl font-semibold text-neutral-800 mb-2 line-clamp-2">{recipe.title}</h3>

        {/* Description */}
        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>

        {/* Time and Servings */}
        <div className="flex items-center gap-4 text-sm text-neutral-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{recipe.totalTimeMinutes} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
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
            className={`text-xs px-2 py-1 rounded ${getDifficultyColor(recipe.difficultyLevel)}`}
          >
            {recipe.difficultyLevel}
          </span>
        </div>

        {/* Dietary Tags */}
        {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.dietaryTags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
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

export default RecipeCard;
