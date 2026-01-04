/**
 * Main Application Component
 *
 * Sets up routing for the Cooking Assistant application
 */

import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import CreateRecipePage from './pages/CreateRecipePage';
import EditRecipePage from './pages/EditRecipePage';
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

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-orange-600">
              🍳 Cooking Assistant
            </Link>
            <div className="flex gap-6 items-center">
              {user && (
                <>
                  <Link to="/recipes" className="text-gray-700 hover:text-orange-600 font-medium">
                    Recipes
                  </Link>
                  <Link to="/libraries" className="text-gray-700 hover:text-orange-600 font-medium">
                    Libraries
                  </Link>
                </>
              )}
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Hello, {user.username}!</span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-orange-600 font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="text-gray-700 hover:text-orange-600 font-medium">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/create" element={<CreateRecipePage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
        <Route path="/libraries" element={<ComingSoonPage title="Libraries" />} />
        <Route path="/planning" element={<ComingSoonPage title="Meal Planning" />} />
        <Route path="/cooking" element={<ComingSoonPage title="Cooking Mode" />} />
      </Routes>
    </div>
  );
}

// Placeholder component for routes not yet implemented
function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-xl text-gray-600">Coming soon in future phases!</p>
      </div>
    </div>
  );
}

export default App;
