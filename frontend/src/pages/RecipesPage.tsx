/**
 * Recipes Page
 *
 * Main recipes listing page with AI chat panel
 */

import { useState, useEffect } from 'react';
import { FileText } from '../components/common/icons';
import RecipeCard from '../components/recipes/RecipeCard';
import { recipeApi } from '../services/recipeApi';
import type { Recipe } from '../types';
import { ChatProvider, useChat } from '../contexts/ChatContext';
import ChatPanel from '../components/chat/ChatPanel';

function RecipesPageContent() {
  const { messages, isStreaming, error: chatError, sendMessage, confirmTool } = useChat();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await recipeApi.getRecipes({
          page: currentPage,
          page_size: 12,
          search: searchQuery || undefined,
          cuisine_type: cuisineFilter || undefined,
          difficulty_level: difficultyFilter
            ? (difficultyFilter as 'easy' | 'medium' | 'hard')
            : undefined,
          dietary_tag: dietaryFilter || undefined,
        });

        setRecipes(response.data);
        setTotalPages(response.totalPages);
        setTotal(response.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recipes');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [currentPage, searchQuery, cuisineFilter, difficultyFilter, dietaryFilter]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setCuisineFilter('');
    setDifficultyFilter('');
    setDietaryFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-display font-bold text-neutral-900">My Recipes</h1>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
              >
                Search
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Cuisine Type
              </label>
              <select
                value={cuisineFilter}
                onChange={(e) => {
                  setCuisineFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Cuisines</option>
                <option value="Italian">Italian</option>
                <option value="Mexican">Mexican</option>
                <option value="Chinese">Chinese</option>
                <option value="Indian">Indian</option>
                <option value="French">French</option>
                <option value="Japanese">Japanese</option>
                <option value="American">American</option>
                <option value="Mediterranean">Mediterranean</option>
                <option value="Thai">Thai</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Difficulty</label>
              <select
                value={difficultyFilter}
                onChange={(e) => {
                  setDifficultyFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Dietary Tags
              </label>
              <select
                value={dietaryFilter}
                onChange={(e) => {
                  setDietaryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Diets</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="gluten-free">Gluten Free</option>
                <option value="dairy-free">Dairy Free</option>
                <option value="keto">Keto</option>
                <option value="paleo">Paleo</option>
                <option value="low-carb">Low Carb</option>
              </select>
            </div>
          </div>

          {(searchQuery || cuisineFilter || difficultyFilter || dietaryFilter) && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

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

        {/* Results Info */}
        {!loading && !error && (
          <div className="mb-4 text-neutral-600">
            Showing {recipes.length} of {total} recipes
          </div>
        )}

        {/* Recipes Grid */}
        {!loading && !error && recipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && recipes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-neutral-900">No recipes found</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {searchQuery || cuisineFilter || difficultyFilter || dietaryFilter
                ? 'Try adjusting your filters'
                : 'Get started by clicking New Recipe in the sidebar'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <span className="px-4 py-2 text-neutral-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Chat Panel */}
      <ChatPanel
        messages={messages}
        isStreaming={isStreaming}
        error={chatError ?? undefined}
        context={{
          page: 'recipe_list',
        }}
        onSendMessage={sendMessage}
        onConfirmTool={confirmTool}
      />
    </div>
  );
}

export default function RecipesPage() {
  return (
    <ChatProvider initialContext={{ page: 'recipe_list' }}>
      <RecipesPageContent />
    </ChatProvider>
  );
}
