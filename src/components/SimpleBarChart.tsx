import type { ChartBar } from '../lib/charts';

type Props = {
  bars: ChartBar[];
  /** Percent threshold at or above which a bar gets the "passed" color. */
  threshold: number;
  /** Drawn height of the chart in px (defaults to 120). */
  height?: number;
};

/**
 * Dependency-free SVG bar chart. Renders one rectangle per {@link ChartBar},
 * with thin axis labels below. Bars at or above `threshold` are inked dark
 * (success); below-threshold bars are muted; days with no data are rendered
 * as a 1px floor stripe so they're visible but distinct.
 *
 * Hover a bar to see its tooltip (native `<title>` element).
 */
export function SimpleBarChart({ bars, threshold, height = 120 }: Props) {
  if (bars.length === 0) return null;

  const padding = 6;
  const barGap = 2;
  const barCount = bars.length;
  // Use viewBox-based scaling so the chart fills its container width.
  const viewWidth = 600;
  const usableWidth = viewWidth - padding * 2;
  const barWidth = (usableWidth - barGap * (barCount - 1)) / barCount;
  const chartBottom = height - 16; // leave room for axis labels
  const chartTop = padding;
  const chartHeight = chartBottom - chartTop;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${height}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label="progress histogram"
    >
      {/* Threshold guideline */}
      <line
        x1={padding}
        x2={viewWidth - padding}
        y1={chartBottom - (threshold / 100) * chartHeight}
        y2={chartBottom - (threshold / 100) * chartHeight}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {bars.map((b, i) => {
        const x = padding + i * (barWidth + barGap);
        const valuePct = Math.max(0, Math.min(100, b.value));
        const h = (valuePct / 100) * chartHeight;
        const passed = b.hasData && valuePct >= threshold;
        let fill: string;
        if (!b.hasData) fill = 'rgba(0,0,0,0.06)';
        else if (passed) fill = 'rgba(43,42,38,0.8)'; // ink
        else fill = 'rgba(0,0,0,0.25)';
        return (
          <g key={i}>
            {/* Render a 1px floor for no-data days so they remain visible. */}
            {!b.hasData ? (
              <rect
                x={x}
                y={chartBottom - 1}
                width={barWidth}
                height={1}
                fill={fill}
              />
            ) : (
              <rect
                x={x}
                y={chartBottom - h}
                width={barWidth}
                height={h}
                fill={fill}
                rx={1}
              />
            )}
            <title>{b.tooltip}</title>
            <text
              x={x + barWidth / 2}
              y={height - 3}
              textAnchor="middle"
              fontSize={8}
              fill="rgba(0,0,0,0.45)"
            >
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
