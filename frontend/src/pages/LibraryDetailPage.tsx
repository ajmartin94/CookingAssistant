/**
 * Library Detail Page
 *
 * Shows library details with recipes and management options
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="bg-error-50 border border-error-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-error-700 mb-2">Error</h2>
          <p className="text-error-600">{error}</p>
          <Link
            to="/libraries"
            className="mt-4 inline-block text-primary-500 hover:text-primary-600 font-medium"
          >
            Back to Libraries
          </Link>
        </div>
      </div>
    );
  }

  if (!library) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Library not found</h2>
          <Link
            to="/libraries"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Back to Libraries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <Link
            to="/libraries"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Libraries
          </Link>
          <span className="mx-2 text-neutral-400">/</span>
          <span className="text-neutral-600">{library.name}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
          {isEditing ? (
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  Name *
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="edit-description"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsPublic}
                    onChange={(e) => setEditIsPublic(e.target.checked)}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                  <span className="text-sm text-neutral-700">Public library</span>
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
                  className="px-4 py-2 text-neutral-700 hover:text-neutral-900 font-medium"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !editName.trim()}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50"
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
                    <h1 className="text-3xl font-bold text-neutral-900">
                      {library.name}
                    </h1>
                    {library.isPublic && (
                      <span className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded">
                        Public
                      </span>
                    )}
                  </div>
                  {library.description && (
                    <p className="text-neutral-600 mt-2">{library.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-4 py-2 border border-primary-500 text-primary-500 rounded-lg font-medium hover:bg-primary-50 transition"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 border border-error-300 rounded-lg font-medium text-error-500 hover:bg-error-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="text-sm text-neutral-500">
                Created {new Date(library.createdAt).toLocaleDateString()} &bull;{' '}
                {library.recipes?.length || 0} recipes
              </div>
            </>
          )}
        </div>

        {/* Recipes Section */}
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-neutral-900">Recipes</h2>
        </div>

        {/* Recipes Grid */}
        {library.recipes && library.recipes.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {library.recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-soft">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-neutral-900">
              No recipes in this library
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
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
    </div>
  );
}
