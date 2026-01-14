import React from 'react';
import { Link } from 'react-router-dom';
import type { RecipeLibrary } from '../../types';

interface LibraryCardProps {
  library: RecipeLibrary;
  onDelete?: (id: string) => void;
}

const LibraryCard: React.FC<LibraryCardProps> = ({ library, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && window.confirm(`Delete library "${library.name}"? Recipes will not be deleted.`)) {
      onDelete(library.id);
    }
  };

  return (
    <Link
      to={`/libraries/${library.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
      data-testid="library-card"
    >
      {/* Library Header */}
      <div className="h-32 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
        <svg
          className="w-16 h-16 text-white opacity-80"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>

      {/* Library Info */}
      <div className="p-4">
        {/* Title */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-800 line-clamp-1">
            {library.name}
          </h3>
          {library.isPublic && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2 flex-shrink-0">
              Public
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
          {library.description || 'No description'}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Created {new Date(library.createdAt).toLocaleDateString()}
          </span>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
              aria-label={`Delete ${library.name}`}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default LibraryCard;
