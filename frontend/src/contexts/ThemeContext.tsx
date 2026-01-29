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

// Season theme colors: 14 CSS variables per season per mode
interface SeasonModeColors {
  accent: string;
  accentHover: string;
  accentSubtle: string;
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgHover: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardShadow: string;
  cardBorder: string;
  gradient: string;
}

const SEASON_COLORS: Record<Season, { dark: SeasonModeColors; light: SeasonModeColors }> = {
  spring: {
    dark: {
      accent: '#66bb6a',
      accentHover: '#4caf50',
      accentSubtle: 'rgba(102, 187, 106, 0.2)',
      bgPrimary: '#152215',
      bgSecondary: '#0f1a0f',
      bgCard: '#1e2e1e',
      bgHover: '#283828',
      border: '#2a4a2a',
      textPrimary: '#e8f5e8',
      textSecondary: '#90c090',
      textMuted: '#5a8a5a',
      cardShadow: '0 2px 16px rgba(102, 187, 106, 0.15)',
      cardBorder: '#2a4a2a',
      gradient: 'linear-gradient(135deg, #388e3c, #66bb6a, #aed581)',
    },
    light: {
      accent: '#4caf50',
      accentHover: '#388e3c',
      accentSubtle: 'rgba(76, 175, 80, 0.15)',
      bgPrimary: '#eaf5ea',
      bgSecondary: '#ddefdd',
      bgCard: '#f4faf4',
      bgHover: '#d4ead4',
      border: '#a8d4a8',
      textPrimary: '#1a2e1a',
      textSecondary: '#3a6a3a',
      textMuted: '#6a9a6a',
      cardShadow: '0 2px 16px rgba(76, 175, 80, 0.12)',
      cardBorder: '#a8d4a8',
      gradient: 'linear-gradient(135deg, #388e3c, #66bb6a, #aed581)',
    },
  },
  summer: {
    dark: {
      accent: '#ffa726',
      accentHover: '#f57c00',
      accentSubtle: 'rgba(255, 167, 38, 0.2)',
      bgPrimary: '#221a0e',
      bgSecondary: '#1a1408',
      bgCard: '#2e2416',
      bgHover: '#3a3020',
      border: '#4a3820',
      textPrimary: '#f5efe0',
      textSecondary: '#c0a878',
      textMuted: '#8a7450',
      cardShadow: '0 2px 16px rgba(255, 167, 38, 0.15)',
      cardBorder: '#4a3820',
      gradient: 'linear-gradient(135deg, #e65100, #ff9800, #ffc107)',
    },
    light: {
      accent: '#f57c00',
      accentHover: '#e65100',
      accentSubtle: 'rgba(245, 124, 0, 0.15)',
      bgPrimary: '#fef3e0',
      bgSecondary: '#faebd2',
      bgCard: '#fff8ee',
      bgHover: '#f5e4c8',
      border: '#d4b888',
      textPrimary: '#2e1e08',
      textSecondary: '#6a5030',
      textMuted: '#9a8060',
      cardShadow: '0 2px 16px rgba(245, 124, 0, 0.12)',
      cardBorder: '#d4b888',
      gradient: 'linear-gradient(135deg, #e65100, #ff9800, #ffc107)',
    },
  },
  fall: {
    dark: {
      accent: '#e07850',
      accentHover: '#c96842',
      accentSubtle: 'rgba(224, 120, 80, 0.2)',
      bgPrimary: '#1e1410',
      bgSecondary: '#180e0a',
      bgCard: '#2a1e18',
      bgHover: '#362820',
      border: '#4a3428',
      textPrimary: '#f5e8e0',
      textSecondary: '#b89080',
      textMuted: '#806050',
      cardShadow: '0 2px 16px rgba(224, 120, 80, 0.15)',
      cardBorder: '#4a3428',
      gradient: 'linear-gradient(135deg, #bf360c, #e07850, #d4a574)',
    },
    light: {
      accent: '#e07850',
      accentHover: '#c96842',
      accentSubtle: 'rgba(224, 120, 80, 0.15)',
      bgPrimary: '#faf0ea',
      bgSecondary: '#f2e4da',
      bgCard: '#fef6f0',
      bgHover: '#eedace',
      border: '#d4b0a0',
      textPrimary: '#2e1810',
      textSecondary: '#6a4838',
      textMuted: '#9a7868',
      cardShadow: '0 2px 16px rgba(224, 120, 80, 0.12)',
      cardBorder: '#d4b0a0',
      gradient: 'linear-gradient(135deg, #bf360c, #e07850, #d4a574)',
    },
  },
  winter: {
    dark: {
      accent: '#5c9dc4',
      accentHover: '#4a8ab4',
      accentSubtle: 'rgba(92, 157, 196, 0.2)',
      bgPrimary: '#0e1620',
      bgSecondary: '#0a1018',
      bgCard: '#162030',
      bgHover: '#1e2a3a',
      border: '#203448',
      textPrimary: '#e0eef8',
      textSecondary: '#7098b8',
      textMuted: '#4a6a88',
      cardShadow: '0 2px 16px rgba(92, 157, 196, 0.15)',
      cardBorder: '#203448',
      gradient: 'linear-gradient(135deg, #1565c0, #5c9dc4, #90caf9)',
    },
    light: {
      accent: '#4a8ab4',
      accentHover: '#3a7aa4',
      accentSubtle: 'rgba(74, 138, 180, 0.15)',
      bgPrimary: '#e4f0fa',
      bgSecondary: '#d6e8f6',
      bgCard: '#eef6ff',
      bgHover: '#cce0f2',
      border: '#98c0e0',
      textPrimary: '#0e1620',
      textSecondary: '#2e5070',
      textMuted: '#5a88a8',
      cardShadow: '0 2px 16px rgba(74, 138, 180, 0.12)',
      cardBorder: '#98c0e0',
      gradient: 'linear-gradient(135deg, #1565c0, #5c9dc4, #90caf9)',
    },
  },
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
 * Apply all 14 season theme CSS variables to document
 */
const applySeasonTheme = (season: Season, theme: Theme): void => {
  const colors = SEASON_COLORS[season][theme];
  const root = document.documentElement;
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-hover', colors.accentHover);
  root.style.setProperty('--accent-subtle', colors.accentSubtle);
  root.style.setProperty('--bg-primary', colors.bgPrimary);
  root.style.setProperty('--bg-secondary', colors.bgSecondary);
  root.style.setProperty('--bg-card', colors.bgCard);
  root.style.setProperty('--bg-hover', colors.bgHover);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--text-muted', colors.textMuted);
  root.style.setProperty('--card-shadow', colors.cardShadow);
  root.style.setProperty('--card-border', colors.cardBorder);
  root.style.setProperty('--season-gradient', colors.gradient);
  root.setAttribute('data-season', season);
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
  const setSeason = useCallback(
    (newSeason: Season) => {
      setSeasonState(newSeason);
      localStorage.setItem(SEASON_STORAGE_KEY, newSeason);
      applySeasonTheme(newSeason, theme);
    },
    [theme]
  );

  // Apply initial theme and season to document on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    applySeasonTheme(season, theme);
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
