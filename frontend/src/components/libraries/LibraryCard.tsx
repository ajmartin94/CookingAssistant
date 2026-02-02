import React from 'react';
import { Link } from 'react-router-dom';
import { Archive } from '../common/icons';
import type { RecipeLibrary } from '../../types';

interface LibraryCardProps {
  library: RecipeLibrary;
  onDelete?: (id: string) => void;
}

const LibraryCard: React.FC<LibraryCardProps> = ({ library, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      onDelete &&
      window.confirm(`Delete library "${library.name}"? Recipes will not be deleted.`)
    ) {
      onDelete(library.id);
    }
  };

  return (
    <Link
      to={`/libraries/${library.id}`}
      className="block bg-card rounded-lg hover:shadow-soft-md transition-shadow duration-200 overflow-hidden"
      style={{ boxShadow: 'var(--card-shadow)' }}
      data-testid="library-card"
    >
      {/* Library Header */}
      <div className="h-32 bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center">
        <Archive className="w-16 h-16 text-text-on-accent opacity-80" />
      </div>

      {/* Library Info */}
      <div className="p-4">
        {/* Title */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-text-primary line-clamp-1">{library.name}</h3>
          {library.isPublic && (
            <span className="text-xs bg-success-subtle text-text-primary px-2 py-1 rounded ml-2 flex-shrink-0">
              Public
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-text-secondary text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
          {library.description || 'No description'}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Created {new Date(library.createdAt).toLocaleDateString()}
          </span>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="text-error hover:text-error text-sm font-medium"
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
