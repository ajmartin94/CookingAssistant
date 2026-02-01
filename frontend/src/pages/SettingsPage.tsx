/**
 * Settings Page
 *
 * Allows users to manage their cooking preferences:
 * dietary restrictions, skill level, and default servings.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updatePreferences } from '../services/authApi';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { SeasonPicker } from '../components/ui/SeasonPicker';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import { useScreenshot } from '../hooks/useScreenshot';

const DIETARY_OPTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'keto',
  'paleo',
  'low-carb',
  'nut-free',
  'soy-free',
] as const;

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState<string>('beginner');
  const [servingsValue, setServingsValue] = useState<string>('4');
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { screenshot, isCapturing, capture } = useScreenshot();

  // Load current preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const user = await getCurrentUser();
        setDietaryRestrictions(user.dietaryRestrictions || []);
        setSkillLevel(user.skillLevel || 'beginner');
        setServingsValue(String(user.defaultServings || 4));
      } catch {
        // If loading fails, keep defaults
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleDietaryChange = useCallback((option: string) => {
    setDietaryRestrictions((prev) =>
      prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]
    );
  }, []);

  const handleServingsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setServingsValue(rawValue);
    // Clear validation error when user enters a valid value
    const numValue = parseInt(rawValue, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
      setValidationError(null);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate servings
    const servingsNum = parseInt(servingsValue, 10);
    if (isNaN(servingsNum) || servingsNum < 1 || servingsNum > 100) {
      setValidationError('Servings must be between 1 and 100');
      return;
    }

    setValidationError(null);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updatePreferences({
        dietaryRestrictions,
        skillLevel,
        defaultServings: servingsNum,
      });
      setSuccessMessage('Preferences saved successfully');

      // Auto-dismiss success message
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch {
      setErrorMessage('Failed to save preferences');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-display font-bold text-text-primary mb-6">Settings</h1>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-card rounded-lg shadow-soft p-6 space-y-8"
      >
        {/* Favorite Cuisines */}
        <div>
          <label
            htmlFor="favoriteCuisines"
            className="block text-lg font-semibold text-text-primary mb-3"
          >
            Favorite Cuisines
          </label>
          <input
            id="favoriteCuisines"
            type="text"
            placeholder="e.g., Italian, Mexican, Thai"
            aria-label="Favorite Cuisines"
            className="w-full px-3 py-2 border border-default rounded-lg bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Dietary Restrictions */}
        <fieldset>
          <legend className="text-lg font-semibold text-text-primary mb-3">
            Dietary Restrictions
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DIETARY_OPTIONS.map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dietaryRestrictions.includes(option)}
                  onChange={() => handleDietaryChange(option)}
                  className="w-4 h-4 rounded border-default text-accent focus:ring-accent"
                />
                <span className="text-sm text-text-secondary capitalize">{option}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Skill Level */}
        <div>
          <label
            htmlFor="skillLevel"
            className="block text-lg font-semibold text-text-primary mb-3"
          >
            Skill Level
          </label>
          <select
            id="skillLevel"
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
            aria-label="Skill Level"
            className="w-48 px-3 py-2 border border-default rounded-lg bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Default Servings */}
        <div>
          <label
            htmlFor="defaultServings"
            className="block text-lg font-semibold text-text-primary mb-3"
          >
            Default Servings
          </label>
          <input
            id="defaultServings"
            type="number"
            min={1}
            max={100}
            value={servingsValue}
            onChange={handleServingsChange}
            aria-label="Default Servings"
            className="w-24 px-3 py-2 border border-default rounded-lg bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {validationError && <p className="mt-2 text-sm text-error">{validationError}</p>}
        </div>

        {/* Save Button + Feedback Messages */}
        <div>
          <button
            type="submit"
            className="px-6 py-2 bg-accent text-text-on-accent rounded-lg font-semibold hover:bg-accent-hover transition"
          >
            Save Preferences
          </button>
          <div className="h-6 mt-2">
            {successMessage && <p className="text-sm text-success font-medium">{successMessage}</p>}
            {errorMessage && <p className="text-sm text-error font-medium">{errorMessage}</p>}
          </div>
        </div>
      </form>

      {/* Appearance Section */}
      <div className="bg-card rounded-lg shadow-soft p-6 mt-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Appearance</h2>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-text-secondary">Theme</span>
          <ThemeToggle />
        </div>
        <div className="space-y-2">
          <span className="text-sm text-text-secondary">Season</span>
          <SeasonPicker />
        </div>
      </div>

      {/* Account Section */}
      <div className="bg-card rounded-lg shadow-soft p-6 mt-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Account</h2>
        {user && <p className="text-sm text-text-secondary mb-4">{user.username}</p>}
        <button
          type="button"
          aria-label="Logout"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="px-4 py-2 bg-error text-text-primary rounded-lg font-semibold hover:opacity-90 transition"
        >
          Logout
        </button>
      </div>

      {/* Feedback Section */}
      <div className="bg-card rounded-lg shadow-soft p-6 mt-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Feedback</h2>
        <p className="text-sm text-text-secondary mb-4">
          Help us improve by sharing your thoughts.
        </p>
        <button
          type="button"
          aria-label="Give Feedback"
          onClick={() => {
            capture();
            setIsFeedbackOpen(true);
          }}
          className="px-4 py-2 bg-accent text-text-on-accent rounded-lg font-semibold hover:bg-accent-hover transition"
        >
          Give Feedback
        </button>
      </div>
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        screenshotState={{ isCapturing, screenshot }}
      />
    </div>
  );
}
