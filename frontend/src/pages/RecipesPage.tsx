/**
 * Recipes Page
 *
 * Main recipes listing page
 */

export default function RecipesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Recipes</h1>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition">
            + New Recipe
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <p className="text-blue-800">
            <strong>Coming Soon!</strong> The recipe library will be implemented in Phase 1.
            You'll be able to:
          </p>
          <ul className="mt-2 ml-6 list-disc text-blue-800">
            <li>Create and manage recipes</li>
            <li>Organize recipes into libraries</li>
            <li>Share recipes with friends</li>
            <li>Search and filter recipes</li>
          </ul>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder recipe cards */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-4xl">🍽️</span>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Sample Recipe {i}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  This is a placeholder for recipe cards. Full functionality coming soon!
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>⏱️ 30 min</span>
                  <span>👥 4 servings</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
