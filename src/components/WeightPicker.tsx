type Props = {
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
};

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
