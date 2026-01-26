/**
 * Theme Context
 *
 * Manages theme state (light/dark), season state (spring/summer/fall/winter),
 * system preference detection, localStorage persistence, and CSS custom properties
 * via data-theme and data-season attributes.
 */

/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Season = 'spring' | 'summer' | 'fall' | 'winter';

// Season accent colors
const SEASON_COLORS: Record<Season, string> = {
  spring: '#66bb6a',
  summer: '#ffa726',
  fall: '#e07850',
  winter: '#5c9dc4',
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  season: Season;
  setSeason: (season: Season) => void;
}

const THEME_STORAGE_KEY = 'theme';
const SEASON_STORAGE_KEY = 'season';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Detect system color scheme preference
 */
const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // mediaQuery can be undefined or may not have matches property in some environments
    if (mediaQuery && typeof mediaQuery.matches === 'boolean') {
      return mediaQuery.matches ? 'dark' : 'light';
    }
  }
  return 'dark'; // Default fallback
};

/**
 * Get initial theme from localStorage or system preference
 */
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return getSystemTheme();
  }
  return 'dark';
};

/**
 * Get initial season from localStorage or default to fall
 */
const getInitialSeason = (): Season => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SEASON_STORAGE_KEY);
    if (stored === 'spring' || stored === 'summer' || stored === 'fall' || stored === 'winter') {
      return stored;
    }
  }
  return 'fall';
};

/**
 * Apply season accent color to document
 */
const applySeasonAccent = (season: Season): void => {
  document.documentElement.style.setProperty('--accent', SEASON_COLORS[season]);
  document.documentElement.setAttribute('data-season', season);
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [season, setSeasonState] = useState<Season>(getInitialSeason);

  // Apply theme to document and persist to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Apply season to document and persist to localStorage
  const setSeason = useCallback((newSeason: Season) => {
    setSeasonState(newSeason);
    localStorage.setItem(SEASON_STORAGE_KEY, newSeason);
    applySeasonAccent(newSeason);
  }, []);

  // Apply initial theme and season to document on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    applySeasonAccent(season);
  }, [theme, season]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    season,
    setSeason,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
