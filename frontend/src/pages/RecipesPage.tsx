/**
 * Recipes Page
 *
 * Main recipes listing page
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus } from '../components/common/icons';
import RecipeCard from '../components/recipes/RecipeCard';
import { recipeApi } from '../services/recipeApi';
import type { Recipe } from '../types';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Debounce timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search effect (300ms delay)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await recipeApi.getRecipes({
          page: currentPage,
          page_size: 12,
          search: debouncedSearchQuery || undefined,
          cuisine_type: cuisineFilter || undefined,
          difficulty_level: difficultyFilter
            ? (difficultyFilter as 'easy' | 'medium' | 'hard')
            : undefined,
          dietary_tag: dietaryFilter || undefined,
          sort: sortBy || undefined,
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
  }, [currentPage, debouncedSearchQuery, cuisineFilter, difficultyFilter, dietaryFilter, sortBy]);

  // Handle search form submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear debounce and trigger immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setDebouncedSearchQuery(searchQuery);
    setCurrentPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCuisineFilter('');
    setDifficultyFilter('');
    setDietaryFilter('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || cuisineFilter || difficultyFilter || dietaryFilter;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display font-bold text-primary">My Recipes</h1>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-lg shadow-soft p-6 mb-6">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card text-text-primary"
              data-testid="search-input"
              aria-label="Search recipes"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-accent text-text-primary rounded-lg font-semibold hover:bg-accent-hover transition"
            >
              Search
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Cuisine Type</label>
            <select
              value={cuisineFilter}
              onChange={(e) => {
                setCuisineFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card text-text-primary"
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
            <label className="block text-sm font-medium text-primary mb-1">Difficulty</label>
            <select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card text-text-primary"
            >
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Dietary Tags</label>
            <select
              value={dietaryFilter}
              onChange={(e) => {
                setDietaryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card text-text-primary"
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

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card text-text-primary"
              data-testid="sort-dropdown"
              aria-label="Sort recipes"
            >
              <option value="newest">Newest First</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
              <option value="cook_time">Cook Time</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mt-4 text-sm text-accent hover:text-accent-hover font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-error-subtle border border-error rounded-lg p-4 mb-6">
          <p className="text-error">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Results Info */}
      {!loading && !error && (
        <div className="mb-4 text-text-secondary">
          Showing {recipes.length} of {total} recipes
        </div>
      )}

      {/* Recipes Grid */}
      {!loading && !error && recipes.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8"
          data-testid="recipe-grid"
        >
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && recipes.length === 0 && (
        <div
          className="text-center py-12"
          data-testid="empty-state"
          role="status"
          aria-live="polite"
        >
          <FileText className="mx-auto h-12 w-12 text-text-muted" />
          <h3 className="mt-2 text-sm font-medium text-text-primary">No recipes found</h3>
          <p className="mt-1 text-sm text-text-muted">
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Get started by clicking New Recipe in the sidebar'}
          </p>
          <Link
            to="/recipes/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent text-text-primary rounded-lg font-semibold hover:bg-accent-hover transition"
            data-testid="empty-state-cta"
          >
            <Plus className="w-5 h-5" />
            Create Recipe
          </Link>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-default rounded-lg font-medium text-text-primary hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="px-4 py-2 text-text-primary">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-default rounded-lg font-medium text-text-primary hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
