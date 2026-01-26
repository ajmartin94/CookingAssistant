/**
 * SeasonPicker component
 *
 * Allows users to select a seasonal theme that changes the accent color.
 * Uses radio buttons with proper accessibility for keyboard navigation.
 */

import { useTheme } from '../../contexts/ThemeContext';

type Season = 'spring' | 'summer' | 'fall' | 'winter';

const SEASONS: { value: Season; label: string }[] = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
];

export function SeasonPicker() {
  const { season, setSeason } = useTheme();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSeason(event.target.value as Season);
  };

  return (
    <fieldset role="radiogroup" aria-label="Season">
      <legend className="sr-only">Season</legend>
      {SEASONS.map(({ value, label }) => (
        <label key={value}>
          <input
            type="radio"
            name="season"
            value={value}
            checked={season === value}
            onChange={handleChange}
            aria-label={label}
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
