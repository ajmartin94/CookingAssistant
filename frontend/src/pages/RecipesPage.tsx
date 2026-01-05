/**
 * Recipes Page
 *
 * Main recipes listing page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RecipeCard from '../components/recipes/RecipeCard';
import { recipeApi } from '../services/recipeApi';
import type { Recipe } from '../types';

export default function RecipesPage() {
  const navigate = useNavigate();
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
          difficulty_level: difficultyFilter ? (difficultyFilter as 'easy' | 'medium' | 'hard') : undefined,
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Recipes</h1>
          <button
            onClick={() => navigate('/recipes/create')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
          >
            + New Recipe
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
              >
                Search
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuisine Type
              </label>
              <select
                value={cuisineFilter}
                onChange={(e) => {
                  setCuisineFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={difficultyFilter}
                onChange={(e) => {
                  setDifficultyFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dietary Tags
              </label>
              <select
                value={dietaryFilter}
                onChange={(e) => {
                  setDietaryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              className="mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Results Info */}
        {!loading && !error && (
          <div className="mb-4 text-gray-600">
            Showing {recipes.length} of {total} recipes
          </div>
        )}

        {/* Recipes Grid */}
        {!loading && !error && recipes.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && recipes.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recipes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || cuisineFilter || difficultyFilter || dietaryFilter
                ? 'Try adjusting your filters'
                : 'Get started by creating a new recipe'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/recipes/create')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
              >
                + New Recipe
              </button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
