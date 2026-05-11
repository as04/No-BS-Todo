type Props = {
  /** Current value 1..5. */
  value: number;
  onChange: (v: number) => void;
  /** Hide the "weight" label when `true` (useful inline next to other controls). */
  compact?: boolean;
};

/**
 * Five-dot weight selector. Hover scale is a hint — clicking a dot sets the
 * weight to that position. Used on notes (to influence the progress ring)
 * and on habits.
 */
export function WeightPicker({ value, onChange, compact }: Props) {
  return (
    <div className="inline-flex items-center gap-1" title="Weight (1=trivial, 5=critical)">
      {!compact && <span className="text-xs text-ink/60 mr-1">weight</span>}
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-3.5 h-3.5 rounded-full transition ${
            n <= value ? 'bg-ink/80' : 'bg-black/15 hover:bg-black/30'
          }`}
          aria-label={`weight ${n}`}
        />
      ))}
    </div>
  );
}
