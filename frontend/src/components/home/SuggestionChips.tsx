/**
 * Suggestion Chips Component
 *
 * Horizontally scrollable list of suggestion chips below the AI input.
 */

export interface SuggestionChip {
  id: string;
  label: string;
}

export interface SuggestionChipsProps {
  suggestions?: SuggestionChip[];
  onChipClick?: (chip: SuggestionChip) => void;
}

const defaultSuggestions: SuggestionChip[] = [
  { id: '1', label: 'Plan next week' },
  { id: '2', label: 'Quick dinner recipe' },
  { id: '3', label: 'What can I make with chicken?' },
  { id: '4', label: 'Healthy breakfast ideas' },
  { id: '5', label: 'Vegetarian options' },
];

export function SuggestionChips({
  suggestions = defaultSuggestions,
  onChipClick,
}: SuggestionChipsProps) {
  return (
    <div
      data-testid="suggestion-chips"
      className="flex gap-2 flex-wrap mt-3"
      role="listbox"
      aria-label="Suggested prompts"
    >
      {suggestions.map((chip) => (
        <button
          key={chip.id}
          data-testid="suggestion-chip"
          role="option"
          onClick={() => onChipClick?.(chip)}
          className="
            bg-card border border-default
            px-4 py-2 rounded-full
            text-sm text-text-secondary
            hover:bg-hover hover:text-text-primary hover:border-text-muted
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
          "
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

export default SuggestionChips;
