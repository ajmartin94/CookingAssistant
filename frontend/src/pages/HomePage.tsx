/**
 * Home Page
 *
 * AI-first landing page with chat input, suggestion chips,
 * context cards, and quick actions.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, ChefHat, ArrowRight } from 'lucide-react';
import { AIChatInput, SuggestionChips, ContextCard, QuickActions } from '../components/home';
import { useAuth } from '../contexts/AuthContext';

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

export default function HomePage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState(getGreeting());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Update greeting when time changes significantly
  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

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
            <h1 className="text-6xl font-bold text-primary mb-4">Cooking Assistant</h1>
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

  // Authenticated home page
  return (
    <div className="min-h-screen bg-primary">
      <main
        id="main"
        data-testid="home-content"
        className="max-w-4xl mx-auto px-4 py-8 lg:px-8 flex flex-col"
      >
        {/* Greeting */}
        <div className="mb-8">
          <h1 data-testid="greeting" className="text-2xl font-semibold text-text-primary mb-1">
            {greeting}
          </h1>
          <p className="text-text-secondary">{formatDate()}</p>
        </div>

        {/* AI Chat Input */}
        <div className="mb-8">
          <AIChatInput onSubmit={handleChatSubmit} />
          <SuggestionChips onChipClick={handleChipClick} />
        </div>

        {/* Context Cards + Quick Actions Grid */}
        <div className="grid lg:grid-cols-2 gap-6" data-testid="context-cards">
          {/* Primary Card - Tonight's Meal */}
          <ContextCard
            title="Tonight's Dinner"
            badge="Ready"
            subtitle="Planned for 6:30 PM"
            to="/recipes"
          >
            <div className="flex gap-4">
              <div className="w-32 h-24 rounded-lg bg-gradient-to-br from-hover to-card flex items-center justify-center">
                <ChefHat className="w-8 h-8 text-text-muted" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-text-primary mb-2">
                  Honey Garlic Salmon
                </h2>
                <div className="flex gap-4 text-sm text-text-secondary mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    35 min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />4 servings
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-accent text-text-primary rounded-lg text-sm font-medium hover:bg-accent-hover transition">
                    Start Cooking
                  </button>
                </div>
              </div>
            </div>
          </ContextCard>

          {/* Week Preview Card */}
          <ContextCard title="This Week" to="/planning">
            <div className="space-y-2">
              {['Fri', 'Today', 'Sun', 'Mon', 'Tue'].map((day, index) => (
                <div
                  key={day}
                  className="flex items-center gap-3 py-2 border-b border-default last:border-b-0"
                >
                  <span
                    className={`w-10 text-xs ${day === 'Today' ? 'text-accent font-medium' : 'text-text-muted'}`}
                  >
                    {day}
                  </span>
                  <span
                    className={`text-sm ${index > 2 ? 'text-text-muted italic' : 'text-text-secondary'}`}
                  >
                    {index === 0
                      ? 'Pasta Carbonara'
                      : index === 1
                        ? 'Honey Garlic Salmon'
                        : index === 2
                          ? 'Beef Tacos'
                          : 'Not planned'}
                  </span>
                </div>
              ))}
            </div>
            <span className="mt-3 text-sm text-accent flex items-center gap-1">
              View full plan <ArrowRight className="w-3 h-3" />
            </span>
          </ContextCard>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h2 className="text-sm font-medium text-text-muted mb-3">Quick Actions</h2>
          <QuickActions />
        </div>
      </main>

      {/* Toast notification */}
      {showToast && (
        <div
          role="alert"
          data-testid="toast"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card border border-default rounded-lg px-4 py-3 shadow-lg z-50"
        >
          <p className="text-sm text-text-primary">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
