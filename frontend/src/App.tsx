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
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
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
