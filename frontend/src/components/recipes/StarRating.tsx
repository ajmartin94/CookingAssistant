interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-pressed={i <= value ? 'true' : 'false'}
          onClick={() => onChange(i)}
          className={`text-2xl ${i <= value ? 'text-accent' : 'text-text-muted'}`}
          aria-label={i === 1 ? `${i} star` : `${i} stars`}
        >
          {i <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}
