/**
 * Cookbook Page (formerly Recipes Page)
 *
 * Main recipes listing page with collections, search, filters, and view toggle.
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Upload,
  Search,
  Filter,
  Heart,
  Zap,
  Salad,
  PartyPopper,
  LayoutGrid,
  List,
} from '../components/common/icons';
import RecipeCard from '../components/recipes/RecipeCard';
import { recipeApi } from '../services/recipeApi';
import type { Recipe } from '../types';
import type { LucideIcon } from 'lucide-react';

// Collection data with Lucide icons
interface Collection {
  name: string;
  icon: LucideIcon;
  count: number;
  countLabel: string;
}

const COLLECTIONS: Collection[] = [
  { name: 'Favorites', icon: Heart, count: 12, countLabel: '12 recipes' },
  { name: 'Quick Meals', icon: Zap, count: 8, countLabel: '8 recipes' },
  { name: 'Healthy', icon: Salad, count: 15, countLabel: '15 recipes' },
  { name: 'Party Food', icon: PartyPopper, count: 6, countLabel: '6 recipes' },
  { name: 'New Collection', icon: Plus, count: 0, countLabel: 'Create' },
];

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

  // View toggle state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Build active filter tags
  const activeFilterTags: { key: string; label: string; onRemove: () => void }[] = [];
  if (cuisineFilter) {
    activeFilterTags.push({
      key: 'cuisine',
      label: cuisineFilter,
      onRemove: () => {
        setCuisineFilter('');
        setCurrentPage(1);
      },
    });
  }
  if (difficultyFilter) {
    activeFilterTags.push({
      key: 'difficulty',
      label: difficultyFilter,
      onRemove: () => {
        setDifficultyFilter('');
        setCurrentPage(1);
      },
    });
  }
  if (dietaryFilter) {
    activeFilterTags.push({
      key: 'dietary',
      label: dietaryFilter,
      onRemove: () => {
        setDietaryFilter('');
        setCurrentPage(1);
      },
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display font-bold text-text-primary">Cookbook</h1>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-default text-text-primary rounded-lg font-medium hover:bg-hover transition">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <Link
            to="/recipes/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-text-primary rounded-lg font-semibold hover:bg-accent-hover transition"
          >
            <Plus className="w-4 h-4" />
            New Recipe
          </Link>
        </div>
      </div>

      {/* Collections Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Collections</h3>
          <span className="text-accent text-sm cursor-pointer">Manage &rarr;</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {COLLECTIONS.map((collection) => {
            const IconComponent = collection.icon;
            return (
              <div
                key={collection.name}
                className="min-w-[180px] bg-card border border-default rounded-lg p-4 cursor-pointer hover:border-text-muted transition"
                data-testid="collection-card"
              >
                <div className="w-10 h-10 bg-hover rounded-lg flex items-center justify-center mb-3">
                  <IconComponent className="w-5 h-5 text-text-secondary" />
                </div>
                <div className="text-sm font-medium text-text-primary">{collection.name}</div>
                <div className="text-xs text-text-muted">{collection.countLabel}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search, Filters & View Toggle */}
      <div className="bg-card rounded-lg shadow-soft p-6 mb-6">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative" data-testid="search-wrapper">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card text-text-primary"
                data-testid="search-input"
                aria-label="Search recipes"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-accent text-text-primary rounded-lg font-semibold hover:bg-accent-hover transition"
            >
              Search
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-card border border-default text-text-secondary rounded-lg hover:bg-hover transition flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            {/* View Toggle */}
            <div className="flex bg-card border border-default rounded-lg p-1">
              <button
                type="button"
                className={`px-3 py-1 rounded-md transition ${viewMode === 'grid' ? 'bg-hover text-text-primary' : 'text-text-muted'}`}
                aria-label="Grid view"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-md transition ${viewMode === 'list' ? 'bg-hover text-text-primary' : 'text-text-muted'}`}
                aria-label="List view"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Cuisine Type</label>
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
            <label className="block text-sm font-medium text-text-primary mb-1">Difficulty</label>
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
            <label className="block text-sm font-medium text-text-primary mb-1">Dietary Tags</label>
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
            <label className="block text-sm font-medium text-text-primary mb-1">Sort By</label>
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
              <option value="newest">Recently Added</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
              <option value="cook_time">Cook Time</option>
              <option value="most_cooked">Most Cooked</option>
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

      {/* Active Filter Tags */}
      {activeFilterTags.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {activeFilterTags.map((tag) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1 bg-accent-subtle text-accent px-3 py-1 rounded-md text-sm"
              data-testid={`filter-tag-${tag.key}`}
            >
              {tag.label}
              <button
                onClick={tag.onRemove}
                className="ml-1 hover:text-accent-hover"
                aria-label={`Remove ${tag.label} filter`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

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
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8 animate-fade-in"
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
              : 'Get started by creating your first recipe'}
          </p>
          <Link
            to="/recipes/create"
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
