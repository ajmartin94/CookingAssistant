/**
 * Libraries Page
 *
 * Main libraries listing page with create functionality
 */

import { useState, useEffect } from 'react';
import { Archive } from '../components/common/icons';
import LibraryCard from '../components/libraries/LibraryCard';
import * as libraryApi from '../services/libraryApi';
import type { RecipeLibrary } from '../types';

export default function LibrariesPage() {
  const [libraries, setLibraries] = useState<RecipeLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [newLibraryDescription, setNewLibraryDescription] = useState('');
  const [newLibraryIsPublic, setNewLibraryIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch libraries
  useEffect(() => {
    fetchLibraries();
  }, []);

  const fetchLibraries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await libraryApi.getLibraries();
      setLibraries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch libraries');
    } finally {
      setLoading(false);
    }
  };

  // Handle create library
  const handleCreateLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibraryName.trim()) return;

    try {
      setCreating(true);
      const newLibrary = await libraryApi.createLibrary({
        name: newLibraryName.trim(),
        description: newLibraryDescription.trim() || undefined,
        is_public: newLibraryIsPublic,
      });
      setLibraries((prev) => [newLibrary, ...prev]);
      setNewLibraryName('');
      setNewLibraryDescription('');
      setNewLibraryIsPublic(false);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create library');
    } finally {
      setCreating(false);
    }
  };

  // Handle delete library
  const handleDeleteLibrary = async (libraryId: string) => {
    try {
      await libraryApi.deleteLibrary(libraryId);
      setLibraries((prev) => prev.filter((lib) => lib.id !== libraryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete library');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display font-bold text-neutral-900">My Libraries</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
        >
          + New Library
        </button>
      </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-soft-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Create New Library</h2>
              <form onSubmit={handleCreateLibrary}>
                <div className="mb-4">
                  <label
                    htmlFor="library-name"
                    className="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    Name *
                  </label>
                  <input
                    id="library-name"
                    type="text"
                    value={newLibraryName}
                    onChange={(e) => setNewLibraryName(e.target.value)}
                    placeholder="My Recipe Collection"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="library-description"
                    className="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="library-description"
                    value={newLibraryDescription}
                    onChange={(e) => setNewLibraryDescription(e.target.value)}
                    placeholder="A collection of my favorite recipes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newLibraryIsPublic}
                      onChange={(e) => setNewLibraryIsPublic(e.target.checked)}
                      className="w-4 h-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <span className="text-sm text-neutral-700">Make this library public</span>
                  </label>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewLibraryName('');
                      setNewLibraryDescription('');
                      setNewLibraryIsPublic(false);
                    }}
                    className="px-4 py-2 text-neutral-700 hover:text-neutral-900 font-medium"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newLibraryName.trim()}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Library'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
            <p className="text-error-700">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Libraries Grid */}
        {!loading && !error && libraries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {libraries.map((library) => (
              <LibraryCard key={library.id} library={library} onDelete={handleDeleteLibrary} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && libraries.length === 0 && (
          <div className="text-center py-12">
            <Archive className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-neutral-900">No libraries yet</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Create a library to organize your recipes
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
              >
                + New Library
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
