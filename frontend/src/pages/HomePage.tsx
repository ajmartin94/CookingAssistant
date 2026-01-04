/**
 * Home Page
 *
 * Landing page for the Cooking Assistant application
 */

import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            🍳 Cooking Assistant
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your AI-powered cooking companion for planning, shopping, and cooking with ease
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/recipes"
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              Browse Recipes
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-white text-orange-600 border-2 border-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📖</div>
            <h3 className="text-xl font-bold mb-2">Recipe Library</h3>
            <p className="text-gray-600">
              Store and organize your favorite recipes with AI-powered suggestions
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-bold mb-2">Meal Planning</h3>
            <p className="text-gray-600">
              Plan your meals and generate smart grocery lists automatically
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">👨‍🍳</div>
            <h3 className="text-xl font-bold mb-2">Interactive Cooking</h3>
            <p className="text-gray-600">
              Step-by-step guidance with voice assistance and timers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
