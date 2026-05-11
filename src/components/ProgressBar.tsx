type Props = { percent: number };

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
