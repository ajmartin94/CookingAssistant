/**
 * Main Application Component
 *
 * Sets up routing for the Cooking Assistant application
 */

import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShell } from './components/layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import CreateRecipePage from './pages/CreateRecipePage';
import EditRecipePage from './pages/EditRecipePage';
import LibrariesPage from './pages/LibrariesPage';
import LibraryDetailPage from './pages/LibraryDetailPage';
import SharedRecipePage from './pages/SharedRecipePage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (query: string) => {
    navigate(`/recipes?search=${encodeURIComponent(query)}`);
  };

  // Authenticated layout with AppShell
  if (user) {
    return (
      <AppShell
        user={{ username: user.username, email: user.email }}
        onLogout={handleLogout}
        onSearch={handleSearch}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/create" element={<CreateRecipePage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
          <Route path="/libraries" element={<LibrariesPage />} />
          <Route path="/libraries/:id" element={<LibraryDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/planning" element={<ComingSoonPage title="Meal Planning" />} />
          <Route path="/cooking" element={<ComingSoonPage title="Cooking Mode" />} />
          <Route path="/shared/:token" element={<SharedRecipePage />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    );
  }

  // Public layout without AppShell
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/shared/:token" element={<SharedRecipePage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// Placeholder Dashboard page until Phase 4
function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">Your Recipes</h2>
          <p className="text-3xl font-bold text-primary-500">--</p>
          <p className="text-sm text-neutral-500 mt-1">Total recipes saved</p>
        </div>
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">Libraries</h2>
          <p className="text-3xl font-bold text-secondary-500">--</p>
          <p className="text-sm text-neutral-500 mt-1">Recipe collections</p>
        </div>
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">This Week</h2>
          <p className="text-3xl font-bold text-success-500">--</p>
          <p className="text-sm text-neutral-500 mt-1">Meals planned</p>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/recipes/create"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
          >
            + New Recipe
          </a>
          <a
            href="/recipes"
            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-200 transition"
          >
            Browse Recipes
          </a>
          <a
            href="/libraries"
            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-200 transition"
          >
            View Libraries
          </a>
        </div>
      </div>
    </div>
  );
}

// Placeholder Settings page until Phase 4
function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-6">Settings</h1>
      <div className="bg-white rounded-lg shadow-soft divide-y divide-neutral-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Profile</h2>
          <p className="text-neutral-600">Profile settings will be available in Phase 4.</p>
        </div>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Preferences</h2>
          <p className="text-neutral-600">Preference settings will be available in Phase 4.</p>
        </div>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Account</h2>
          <p className="text-neutral-600">Account settings will be available in Phase 4.</p>
        </div>
      </div>
    </div>
  );
}

// Placeholder component for routes not yet implemented
function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">{title}</h1>
        <p className="text-xl text-neutral-600">Coming soon in future phases!</p>
      </div>
    </div>
  );
}

export default App;
