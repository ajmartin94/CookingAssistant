/**
 * Recipes Page
 *
 * Main recipes listing page with view modes, sorting, filters, and favorites
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RecipeCard from '../components/recipes/RecipeCard';
import { recipeApi, favoriteRecipe, unfavoriteRecipe, getFavorites } from '../services/recipeApi';
import { Button, Badge, Select, Skeleton } from '../components/ui';
import type { Recipe } from '../types';

type ViewMode = 'grid' | 'list' | 'compact';
type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'cook-time' | 'difficulty';

// Persist view mode preference
const getStoredViewMode = (): ViewMode => {
  const stored = localStorage.getItem('recipes_view_mode');
  return (stored as ViewMode) || 'grid';
};

const setStoredViewMode = (mode: ViewMode) => {
  localStorage.setItem('recipes_view_mode', mode);
};

export default function RecipesPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View and sort states
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch favorites on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const favs = await getFavorites();
        setFavoriteIds(new Set(favs.data.map(r => r.id)));
      } catch {
        // Silently fail - favorites are optional
      }
    };
    fetchFavorites();
  }, []);

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

        // Sort recipes client-side
        let sortedRecipes = [...response.data];
        switch (sortBy) {
          case 'oldest':
            sortedRecipes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            break;
          case 'newest':
            sortedRecipes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'a-z':
            sortedRecipes.sort((a, b) => a.title.localeCompare(b.title));
            break;
          case 'z-a':
            sortedRecipes.sort((a, b) => b.title.localeCompare(a.title));
            break;
          case 'cook-time':
            sortedRecipes.sort((a, b) => a.totalTimeMinutes - b.totalTimeMinutes);
            break;
          case 'difficulty':
            const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
            sortedRecipes.sort((a, b) => difficultyOrder[a.difficultyLevel] - difficultyOrder[b.difficultyLevel]);
            break;
        }

        setRecipes(sortedRecipes);
        setTotalPages(response.totalPages);
        setTotal(response.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recipes');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [currentPage, searchQuery, cuisineFilter, difficultyFilter, dietaryFilter, sortBy]);

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setStoredViewMode(mode);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setCuisineFilter('');
    setDifficultyFilter('');
    setDietaryFilter('');
    setCurrentPage(1);
  };

  // Remove single filter
  const removeFilter = (filter: 'search' | 'cuisine' | 'difficulty' | 'dietary') => {
    switch (filter) {
      case 'search':
        setSearchQuery('');
        break;
      case 'cuisine':
        setCuisineFilter('');
        break;
      case 'difficulty':
        setDifficultyFilter('');
        break;
      case 'dietary':
        setDietaryFilter('');
        break;
    }
    setCurrentPage(1);
  };

  // Toggle favorite
  const handleToggleFavorite = async (recipeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isFavorited = favoriteIds.has(recipeId);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFavorited) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }
      return next;
    });

    try {
      if (isFavorited) {
        await unfavoriteRecipe(recipeId);
      } else {
        await favoriteRecipe(recipeId);
      }
    } catch {
      // Revert on error
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (isFavorited) {
          next.add(recipeId);
        } else {
          next.delete(recipeId);
        }
        return next;
      });
    }
  };

  // Handle recipe actions
  const handleEdit = (recipeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/recipes/${recipeId}/edit`);
  };

  const handleDelete = async (recipeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await recipeApi.deleteRecipe(recipeId);
        setRecipes(prev => prev.filter(r => r.id !== recipeId));
        setTotal(prev => prev - 1);
      } catch {
        // Show error
      }
    }
  };

  // Active filters
  const activeFilters = [
    searchQuery && { key: 'search', label: `"${searchQuery}"` },
    cuisineFilter && { key: 'cuisine', label: cuisineFilter },
    difficultyFilter && { key: 'difficulty', label: difficultyFilter },
    dietaryFilter && { key: 'dietary', label: dietaryFilter },
  ].filter(Boolean) as { key: string; label: string }[];

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;

    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  // Grid class based on view mode
  const gridClass = viewMode === 'grid'
    ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
    : viewMode === 'list'
      ? 'flex flex-col gap-4'
      : 'grid md:grid-cols-2 lg:grid-cols-4 gap-4';

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-neutral-900">My Recipes</h1>
          <Link
            to="/recipes/create"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
          >
            + New Recipe
          </Link>
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
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Difficulty
              </label>
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

          {/* Active Filter Badges */}
          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-neutral-600">Active filters:</span>
              {activeFilters.map(({ key, label }) => (
                <Badge
                  key={key}
                  variant="info"
                  className="flex items-center gap-1"
                >
                  {label}
                  <button
                    onClick={() => removeFilter(key as 'search' | 'cuisine' | 'difficulty' | 'dietary')}
                    className="ml-1 hover:text-primary-900"
                    aria-label={`Remove ${label} filter`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Badge>
              ))}
              <button
                onClick={clearFilters}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* View Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="text-neutral-600">
            {!loading && !error && `Showing ${recipes.length} of ${total} recipes`}
          </div>

          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="a-z">A-Z</option>
                <option value="z-a">Z-A</option>
                <option value="cook-time">Cook Time</option>
                <option value="difficulty">Difficulty</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                aria-label="Grid view"
                title="Grid view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                aria-label="List view"
                title="List view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('compact')}
                className={`p-2 ${viewMode === 'compact' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                aria-label="Compact view"
                title="Compact view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={gridClass}>
            {Array(6).fill(null).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
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

        {/* Recipes Grid/List */}
        {!loading && !error && recipes.length > 0 && (
          <div className={`${gridClass} mb-8`}>
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                viewMode={viewMode}
                isFavorited={favoriteIds.has(recipe.id)}
                onToggleFavorite={(e) => handleToggleFavorite(recipe.id, e)}
                onEdit={(e) => handleEdit(recipe.id, e)}
                onDelete={(e) => handleDelete(recipe.id, e)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && recipes.length === 0 && (
          <div className="text-center py-12">
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
            <h3 className="mt-2 text-sm font-medium text-neutral-900">No recipes found</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {activeFilters.length > 0
                ? 'Try adjusting your filters'
                : 'Get started by creating a new recipe'}
            </p>
            <div className="mt-6">
              <Link
                to="/recipes/create"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
              >
                + New Recipe
              </Link>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <nav className="flex justify-center items-center gap-1" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {getPageNumbers().map((page, index) => (
              typeof page === 'number' ? (
                <button
                  key={index}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentPage === page
                      ? 'bg-primary-500 text-white'
                      : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                  }`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="px-2 text-neutral-400">
                  {page}
                </span>
              )
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
