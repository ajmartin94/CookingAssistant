/**
 * Dashboard Page
 *
 * Main landing page for authenticated users showing stats, recent recipes, and quick actions.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecipes, type RecipeListResponse } from '../services/recipeApi';
import { getLibraries } from '../services/libraryApi';
import { Card, CardBody, Skeleton, EmptyState } from '../components/ui';
import type { Recipe, RecipeLibrary } from '../types';

interface DashboardStats {
  recipeCount: number;
  libraryCount: number;
  mealsPlanned: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch recipes and libraries in parallel
        const [recipesResponse, libraries] = await Promise.all([
          getRecipes({ page: 1, page_size: 6 }),
          getLibraries(),
        ]);

        setStats({
          recipeCount: recipesResponse.total,
          libraryCount: libraries.length,
          mealsPlanned: 0, // Placeholder for future meal planning feature
        });

        setRecentRecipes(recipesResponse.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
        // Set empty stats so the page still renders
        setStats({ recipeCount: 0, libraryCount: 0, mealsPlanned: 0 });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Your Recipes"
          value={stats?.recipeCount}
          subtitle="Total recipes saved"
          loading={loading}
          colorClass="text-primary-500"
        />
        <StatsCard
          title="Libraries"
          value={stats?.libraryCount}
          subtitle="Recipe collections"
          loading={loading}
          colorClass="text-secondary-500"
        />
        <StatsCard
          title="This Week"
          value={stats?.mealsPlanned}
          subtitle="Meals planned"
          loading={loading}
          colorClass="text-success-500"
        />
      </div>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/recipes/create"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
          >
            + New Recipe
          </Link>
          <Link
            to="/recipes"
            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-200 transition"
          >
            Browse Recipes
          </Link>
          <Link
            to="/libraries"
            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-200 transition"
          >
            View Libraries
          </Link>
        </div>
      </section>

      {/* Recent Recipes */}
      <section>
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Recent Recipes</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6)
              .fill(null)
              .map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
          </div>
        ) : recentRecipes.length === 0 ? (
          <EmptyState
            title="No recipes yet"
            description="Start building your recipe collection by adding your first recipe."
            action={
              <Link
                to="/recipes/create"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
              >
                + New Recipe
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentRecipes.map((recipe) => (
              <RecipeQuickCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>

      {/* AI Suggestions Placeholder */}
      <section className="mt-8">
        <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-0">
          <CardBody className="text-center py-8">
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
              AI Recipe Suggestions
            </h3>
            <p className="text-neutral-600">
              Coming soon: Personalized recipe recommendations based on your cooking history.
            </p>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value?: number;
  subtitle: string;
  loading: boolean;
  colorClass: string;
}

function StatsCard({ title, value, subtitle, loading, colorClass }: StatsCardProps) {
  return (
    <Card>
      <CardBody>
        <h2 className="text-lg font-semibold text-neutral-700 mb-2">{title}</h2>
        {loading ? (
          <Skeleton className="h-9 w-16 mb-1 animate-pulse" />
        ) : (
          <p className={`text-3xl font-bold ${colorClass}`}>{value ?? 0}</p>
        )}
        <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
      </CardBody>
    </Card>
  );
}

interface RecipeQuickCardProps {
  recipe: Recipe;
}

function RecipeQuickCard({ recipe }: RecipeQuickCardProps) {
  return (
    <Link to={`/recipes/${recipe.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardBody>
          <h3 className="font-semibold text-neutral-800 mb-2 line-clamp-1">{recipe.title}</h3>
          <p className="text-sm text-neutral-600 line-clamp-2 mb-3">{recipe.description}</p>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <ClockIcon />
              {recipe.totalTimeMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <UsersIcon />
              {recipe.servings} servings
            </span>
            <span className="capitalize">{recipe.difficultyLevel}</span>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

function ClockIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}
