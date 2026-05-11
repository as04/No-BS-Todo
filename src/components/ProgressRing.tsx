type Props = {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string;
};

export function ProgressRing({
  percent,
  size = 56,
  stroke = 6,
  label,
}: Props) {
  const pct = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      title={label ?? `${pct}% today`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-ink/80 transition-all duration-500"
        />
      </svg>
      <span className="absolute text-xs font-medium">{pct}%</span>
    </div>
  );
}
