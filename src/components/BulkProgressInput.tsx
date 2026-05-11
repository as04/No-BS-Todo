import { useState } from 'react';

type Props = {
  /** Singular noun (e.g. "chapter", "page", "lesson"). */
  unitLabel: string;
  /** Current count (clamped at the parent). */
  current: number;
  /** Total expected count (denominator for the progress bar). */
  total: number;
  onChange: (current: number) => void;
};

/**
 * Counter control for bulk-mode notes. Shows "−  N  +  of M units" with
 * a number input you can also type into directly. The "15 chapters" UX
 * solution: one click per progress step, no fifteen checkboxes.
 */
export function BulkProgressInput({ unitLabel, current, total, onChange }: Props) {
  const [draft, setDraft] = useState(String(current));

  const commit = (v: string) => {
    const n = parseInt(v, 10);
    if (isNaN(n)) {
      setDraft(String(current));
      return;
    }
    onChange(n);
    setDraft(String(Math.max(0, Math.min(total, n))));
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        className="w-7 h-7 rounded-full bg-white/70 hover:bg-white border border-black/10"
        aria-label="decrement"
      >
        −
      </button>
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="w-14 text-center bg-white/70 rounded px-1 py-0.5 border border-black/10"
      />
      <span className="text-ink/70">
        of {total} {unitLabel}
        {total === 1 ? '' : 's'}
      </span>
      <button
        type="button"
        onClick={() => onChange(current + 1)}
        className="w-7 h-7 rounded-full bg-white/70 hover:bg-white border border-black/10"
        aria-label="increment"
      >
        +
      </button>
    </div>
  );
}
