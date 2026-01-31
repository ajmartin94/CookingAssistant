/**
 * Main Application Component
 *
 * Sets up routing for the Cooking Assistant application.
 * Uses a sidebar-based layout for authenticated pages.
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { setNavigate } from './services/navigationService';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedLayout } from './components/common/layout';
import { FeedbackButton } from './components/feedback';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import CreateRecipePage from './pages/CreateRecipePage';
import EditRecipePage from './pages/EditRecipePage';
import LibrariesPage from './pages/LibrariesPage';
import LibraryDetailPage from './pages/LibraryDetailPage';
import SharedRecipePage from './pages/SharedRecipePage';
import SettingsPage from './pages/SettingsPage';
import MealPlanPage from './pages/MealPlanPage';
import ShoppingListPage from './pages/ShoppingListPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <NavigationSetter />
            <Routes>
              {/* Public routes - no sidebar */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/shared/:token" element={<SharedRecipePage />} />

              {/* Protected routes - with sidebar layout */}
              <Route element={<ProtectedLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/recipes" element={<RecipesPage />} />
                <Route path="/recipes/create" element={<CreateRecipePage />} />
                <Route path="/recipes/:id" element={<RecipeDetailPage />} />
                <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
                <Route path="/libraries" element={<LibrariesPage />} />
                <Route path="/libraries/:id" element={<LibraryDetailPage />} />
                <Route path="/discover" element={<ComingSoonPage title="Discover" />} />
                <Route path="/planning" element={<MealPlanPage />} />
                <Route path="/shopping" element={<ShoppingListPage />} />
                <Route path="/cooking" element={<ComingSoonPage title="Cooking Mode" />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
            {/* Global feedback button - visible on all pages */}
            <FeedbackButton />
          </Router>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Placeholder component for routes not yet implemented
function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-text-primary mb-4">{title}</h1>
        <p className="text-xl text-text-secondary">Coming soon in future phases!</p>
      </div>
    </div>
  );
}

// Sets up the navigation service for use outside React components
function NavigationSetter() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return null;
}

export default App;
