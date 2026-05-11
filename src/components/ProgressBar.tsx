type Props = { percent: number };

/**
 * Thin horizontal bar showing 0..100% completion. Clamps out-of-range
 * input visually. No label — pair it with a `{pct}%` span if you need text.
 */
export function ProgressBar({ percent }: Props) {
  return (
    <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-ink/70 transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}
