/**
 * Home Page
 *
 * AI-first landing page with chat input, suggestion chips,
 * context cards, and quick actions.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Users, ChefHat, ArrowRight, Gauge } from 'lucide-react';
import { AIChatInput, SuggestionChips, ContextCard, QuickActions } from '../components/home';
import { useAuth } from '../contexts/AuthContext';
import { fetchCurrentMealPlan } from '../services/mealPlanApi';
import type { MealPlan, MealPlanEntry } from '../types/mealPlan';

// Get greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Format today's date
function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// Get today's day_of_week (Monday=0 ... Sunday=6)
function getTodayDayOfWeek(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState(getGreeting());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [mealPlanLoading, setMealPlanLoading] = useState(true);
  const [mealPlanError, setMealPlanError] = useState(false);

  // Update greeting when time changes significantly
  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch current meal plan
  const isAuthenticated = !!user;
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetchCurrentMealPlan()
      .then((plan) => {
        if (!cancelled) {
          setMealPlan(plan);
          setMealPlanError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMealPlanError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setMealPlanLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Get today's dinner entry
  function getTonightsDinner(): MealPlanEntry | null {
    if (!mealPlan) return null;
    const todayDow = getTodayDayOfWeek();
    const entry = mealPlan.entries.find((e) => e.dayOfWeek === todayDow && e.mealType === 'dinner');
    return entry ?? null;
  }

  // Build 5-day rolling window (today + 4 days)
  function getWeekDays(): Array<{ label: string; recipe: string | null; isToday: boolean }> {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayDow = getTodayDayOfWeek();
    const days: Array<{ label: string; recipe: string | null; isToday: boolean }> = [];
    for (let i = 0; i < 5; i++) {
      const dow = (todayDow + i) % 7;
      const label = i === 0 ? 'Today' : dayNames[dow];
      const entry = mealPlan?.entries.find((e) => e.dayOfWeek === dow && e.mealType === 'dinner');
      days.push({
        label,
        recipe: entry?.recipe?.title ?? null,
        isToday: i === 0,
      });
    }
    return days;
  }

  const handleChatSubmit = (message: string) => {
    // Visual feedback only - AI functionality deferred
    setToastMessage(`AI feature coming soon! You asked: "${message}"`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleChipClick = (chip: { label: string }) => {
    setToastMessage(`You selected: "${chip.label}"`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // If not authenticated, show public landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-primary">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-text-primary mb-4">Cooking Assistant</h1>
            <p className="text-xl text-text-secondary mb-8">
              Your AI-powered cooking companion for planning, shopping, and cooking with ease
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/recipes"
                className="px-6 py-3 bg-accent text-text-primary rounded-lg font-semibold hover:bg-accent-hover transition"
              >
                Browse Recipes
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-card text-accent border-2 border-accent rounded-lg font-semibold hover:bg-hover transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tonightsDinner = getTonightsDinner();
  const hasDinner = !mealPlanLoading && !mealPlanError && tonightsDinner?.recipe;

  // Authenticated home page
  return (
    <div className="min-h-screen bg-primary">
      <main
        id="main"
        data-testid="home-content"
        className="max-w-7xl mx-auto px-4 py-8 lg:px-8 flex flex-col"
      >
        {/* Greeting */}
        <div className="mb-8 animate-fade-in">
          <h1 data-testid="greeting" className="text-2xl font-semibold text-text-primary mb-1">
            {greeting}
          </h1>
          <p className="text-text-secondary">{formatDate()}</p>
        </div>

        {/* AI Chat Input */}
        <div
          className="mb-8 animate-slide-in"
          style={{ animationDelay: '100ms', animationFillMode: 'both' }}
        >
          <AIChatInput onSubmit={handleChatSubmit} />
          <SuggestionChips onChipClick={handleChipClick} />
        </div>

        {/* Context Cards + Quick Actions Grid */}
        <div
          className="grid lg:grid-cols-2 gap-6 animate-slide-in"
          style={{ animationDelay: '200ms', animationFillMode: 'both' }}
          data-testid="context-cards"
        >
          {/* Primary Card - Tonight's Meal */}
          <ContextCard
            title="Tonight's Dinner"
            badge={hasDinner ? 'Ready' : undefined}
            subtitle={hasDinner ? 'Planned for 6:30 PM' : undefined}
            to={hasDinner ? '/recipes' : '/planning'}
          >
            {mealPlanLoading ? (
              <div className="flex gap-4">
                <div
                  data-testid="skeleton-image"
                  className="w-32 h-24 rounded-lg bg-hover animate-pulse"
                />
                <div className="flex-1 space-y-3">
                  <div
                    data-testid="skeleton-title"
                    className="h-5 w-40 bg-hover rounded animate-pulse"
                  />
                  <div
                    data-testid="skeleton-meta"
                    className="h-4 w-56 bg-hover rounded animate-pulse"
                  />
                  <div
                    data-testid="skeleton-buttons"
                    className="h-8 w-48 bg-hover rounded animate-pulse"
                  />
                </div>
              </div>
            ) : mealPlanError ? (
              <p className="text-text-secondary">{"Couldn't load meal plan data."}</p>
            ) : tonightsDinner?.recipe ? (
              <div className="flex gap-4">
                <div className="w-32 h-24 rounded-lg bg-gradient-to-br from-hover to-card flex items-center justify-center">
                  <ChefHat className="w-8 h-8 text-text-muted" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-text-primary mb-2">
                    {tonightsDinner.recipe.title}
                  </h2>
                  <div className="flex gap-4 text-sm text-text-secondary mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {tonightsDinner.recipe.cookTimeMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {tonightsDinner.recipe.servings} servings
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="w-4 h-4" />
                      {tonightsDinner.recipe.difficultyLevel.charAt(0).toUpperCase() +
                        tonightsDinner.recipe.difficultyLevel.slice(1)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (tonightsDinner?.recipe?.id) {
                          navigate(`/recipes/${tonightsDinner.recipe.id}?cook=true`);
                        }
                      }}
                      className="btn-animated px-4 py-2 bg-accent text-text-primary rounded-lg text-sm font-medium hover:bg-accent-hover transition"
                    >
                      Start Cooking
                    </button>
                    <button className="btn-animated px-4 py-2 bg-card text-text-secondary border border-default rounded-lg text-sm font-medium hover:bg-hover transition">
                      View Recipe
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-text-secondary mb-3">No dinner planned for tonight</p>
                <span className="text-accent">Plan dinner</span>
              </div>
            )}
          </ContextCard>

          {/* Week Preview Card */}
          <ContextCard title="This Week" to="/planning">
            {mealPlanLoading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    data-testid={`skeleton-day-${i}`}
                    className="h-8 bg-hover rounded animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {getWeekDays().map((day, index) => (
                  <div
                    key={`${day.label}-${index}`}
                    className="flex items-center gap-3 py-2 border-b border-default last:border-b-0"
                  >
                    <span
                      className={`w-10 text-xs ${day.label === 'Today' ? 'text-accent font-medium' : 'text-text-muted'}`}
                    >
                      {day.label}
                    </span>
                    <span
                      className={`text-sm ${day.recipe ? 'text-text-secondary' : 'text-text-muted italic'}`}
                    >
                      {day.isToday && day.recipe
                        ? "See tonight's dinner"
                        : (day.recipe ?? 'Not planned')}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <span className="mt-3 text-sm text-accent flex items-center gap-1">
              View full plan <ArrowRight className="w-3 h-3" />
            </span>
          </ContextCard>
        </div>

        {/* Quick Actions */}
        <div
          className="mt-6 animate-slide-in"
          style={{ animationDelay: '300ms', animationFillMode: 'both' }}
        >
          <h2 className="text-sm font-medium text-text-muted mb-3">Quick Actions</h2>
          <QuickActions />
        </div>
      </main>

      {/* Toast notification */}
      {showToast && (
        <div
          role="alert"
          data-testid="toast"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card border border-default rounded-lg px-4 py-3 shadow-lg z-50 animate-scale-in"
        >
          <p className="text-sm text-text-primary">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
