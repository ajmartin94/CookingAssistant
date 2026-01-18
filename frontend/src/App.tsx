/**
 * Main Application Component
 *
 * Sets up routing for the Cooking Assistant application.
 * Uses a sidebar-based layout for authenticated pages.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ProtectedLayout } from './components/common/layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import CreateRecipePage from './pages/CreateRecipePage';
import EditRecipePage from './pages/EditRecipePage';
import LibrariesPage from './pages/LibrariesPage';
import LibraryDetailPage from './pages/LibraryDetailPage';
import SharedRecipePage from './pages/SharedRecipePage';

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <Routes>
            {/* Public routes - no sidebar */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/shared/:token" element={<SharedRecipePage />} />

            {/* Protected routes - with sidebar layout */}
            <Route element={<ProtectedLayout />}>
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/recipes/create" element={<CreateRecipePage />} />
              <Route path="/recipes/:id" element={<RecipeDetailPage />} />
              <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
              <Route path="/libraries" element={<LibrariesPage />} />
              <Route path="/libraries/:id" element={<LibraryDetailPage />} />
              <Route path="/discover" element={<ComingSoonPage title="Discover" />} />
              <Route path="/planning" element={<ComingSoonPage title="Meal Planning" />} />
              <Route path="/shopping" element={<ComingSoonPage title="Shopping List" />} />
              <Route path="/cooking" element={<ComingSoonPage title="Cooking Mode" />} />
            </Route>
          </Routes>
        </Router>
      </SidebarProvider>
    </AuthProvider>
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
