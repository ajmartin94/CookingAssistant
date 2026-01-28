/**
 * Library Detail Page
 *
 * Shows library details with recipes and management options
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FileText } from '../components/common/icons';
import RecipeCard from '../components/recipes/RecipeCard';
import ShareModal from '../components/sharing/ShareModal';
import * as libraryApi from '../services/libraryApi';
import type { RecipeLibrary, Recipe } from '../types';

interface LibraryWithRecipes extends RecipeLibrary {
  recipes: Recipe[];
}

export default function LibraryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [library, setLibrary] = useState<LibraryWithRecipes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch library
  useEffect(() => {
    if (!id) return;

    const fetchLibrary = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await libraryApi.getLibrary(id);
        setLibrary(data as LibraryWithRecipes);
        setEditName(data.name);
        setEditDescription(data.description || '');
        setEditIsPublic(data.isPublic);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch library');
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, [id]);

  // Handle update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editName.trim()) return;

    try {
      setSaving(true);
      const updated = await libraryApi.updateLibrary(id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        is_public: editIsPublic,
      });
      setLibrary((prev) => (prev ? { ...prev, ...updated } : null));
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update library');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm(`Delete library "${library?.name}"? Recipes will not be deleted.`)) {
      return;
    }

    try {
      await libraryApi.deleteLibrary(id);
      navigate('/libraries');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete library');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-subtle border border-error rounded-lg p-6 max-w-md">
        <h2 className="text-xl font-bold text-error mb-2">Error</h2>
        <p className="text-error">{error}</p>
        <Link
          to="/libraries"
          className="mt-4 inline-block text-accent hover:text-accent-hover font-medium"
        >
          Back to Libraries
        </Link>
      </div>
    );
  }

  if (!library) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Library not found</h2>
        <Link to="/libraries" className="text-accent hover:text-accent-hover font-medium">
          Back to Libraries
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4">
        <Link to="/libraries" className="text-accent hover:text-accent-hover font-medium">
          Libraries
        </Link>
        <span className="mx-2 text-text-muted">/</span>
        <span className="text-text-secondary">{library.name}</span>
      </nav>

      {/* Header */}
      <div className="bg-card rounded-lg shadow-soft p-6 mb-6">
        {isEditing ? (
          <form onSubmit={handleUpdate}>
            <div className="mb-4">
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Name *
              </label>
              <input
                id="edit-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="edit-description"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Description
              </label>
              <textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="w-4 h-4 text-accent focus:ring-accent border-default rounded"
                />
                <span className="text-sm text-text-secondary">Public library</span>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(library.name);
                  setEditDescription(library.description || '');
                  setEditIsPublic(library.isPublic);
                }}
                className="px-4 py-2 text-text-secondary hover:text-text-primary font-medium"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !editName.trim()}
                className="px-4 py-2 bg-accent text-text-on-accent rounded-lg font-semibold hover:bg-accent-hover transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-text-primary">{library.name}</h1>
                  {library.isPublic && (
                    <span className="text-xs bg-success text-text-primary px-2 py-1 rounded">
                      Public
                    </span>
                  )}
                </div>
                {library.description && (
                  <p className="text-text-secondary mt-2">{library.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 border border-accent text-accent rounded-lg font-medium hover:bg-accent-subtle transition"
                >
                  Share
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-default rounded-lg font-medium text-text-secondary hover:bg-hover transition"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 border border-error rounded-lg font-medium text-error hover:bg-error-subtle transition"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-sm text-text-muted">
              Created {new Date(library.createdAt).toLocaleDateString()} &bull;{' '}
              {library.recipes?.length || 0} recipes
            </div>
          </>
        )}
      </div>

      {/* Recipes Section */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Recipes</h2>
      </div>

      {/* Recipes Grid */}
      {library.recipes && library.recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {library.recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow-soft">
          <FileText className="mx-auto h-12 w-12 text-text-muted" />
          <h3 className="mt-2 text-sm font-medium text-text-primary">No recipes in this library</h3>
          <p className="mt-1 text-sm text-text-muted">
            Add recipes to this library by editing them and selecting this library
          </p>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        libraryId={library.id}
        itemName={library.name}
      />
    </div>
  );
}
