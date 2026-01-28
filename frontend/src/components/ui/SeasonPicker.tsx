/**
 * SeasonPicker component
 *
 * Allows users to select a seasonal theme that changes the accent color.
 * Uses radio buttons with proper accessibility for keyboard navigation.
 * Includes color swatches and checkmark indicators for visual feedback.
 */

import { useTheme } from '../../contexts/ThemeContext';

type Season = 'spring' | 'summer' | 'fall' | 'winter';

// Season accent colors (must match ThemeContext SEASON_COLORS.accent values)
const SEASON_SWATCH_COLORS: Record<Season, string> = {
  spring: '#66bb6a',
  summer: '#ffa726',
  fall: '#e07850',
  winter: '#5c9dc4',
};

const SEASONS: { value: Season; label: string }[] = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
];

// Checkmark SVG icon
const CheckmarkIcon = ({ visible }: { visible: boolean }) => (
  <svg
    data-testid="season-checkmark"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-accent"
    aria-hidden={!visible}
    style={{ opacity: visible ? 1 : 0 }}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function SeasonPicker() {
  const { season, setSeason } = useTheme();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSeason(event.target.value as Season);
  };

  return (
    <div role="radiogroup" aria-label="Season" className="flex flex-wrap gap-3">
      {SEASONS.map(({ value, label }) => {
        const isSelected = season === value;
        return (
          <label
            key={value}
            data-season-option={value}
            data-selected={isSelected ? 'true' : undefined}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
              border-2 transition-all
              ${
                isSelected
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-card hover:border-accent/50'
              }
              focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2
            `}
          >
            <input
              type="radio"
              name="season"
              value={value}
              checked={isSelected}
              onChange={handleChange}
              className="sr-only"
              aria-label={label}
            />
            {/* Color swatch */}
            <span
              data-testid={`season-swatch-${value}`}
              className="w-5 h-5 rounded-full border border-border/50"
              style={{ backgroundColor: SEASON_SWATCH_COLORS[value] }}
              aria-hidden="true"
            />
            {/* Season name */}
            <span className="text-sm font-medium text-text-primary">{label}</span>
            {/* Checkmark indicator */}
            <CheckmarkIcon visible={isSelected} />
          </label>
        );
      })}
    </div>
  );
}
