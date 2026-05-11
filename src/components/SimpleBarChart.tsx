import type { ChartBar } from '../lib/charts';

type Props = {
  bars: ChartBar[];
  /**
   * Used only when `hideThreshold` is false. Percent (0..100) at or above
   * which a bar is treated as having "passed" — gets the inked color and
   * the dashed guideline is drawn at this level.
   */
  threshold?: number;
  /** Drawn height of the chart in px (defaults to 120). */
  height?: number;
  /**
   * Optional explicit max for height scaling. When set, bar height is
   * `value / maxValue * chartHeight` — required for raw-count charts where
   * the scale isn't 0..100. When omitted, falls back to a 0..100 scale.
   */
  maxValue?: number;
  /**
   * Hide the dashed threshold guideline and skip pass/fail coloring; all
   * bars render in a single neutral ink tone. Use this for metrics where
   * "passed" doesn't apply (e.g. raw activity counts).
   */
  hideThreshold?: boolean;
};

/**
 * Dependency-free SVG bar chart. Renders one rectangle per {@link ChartBar},
 * with thin axis labels below. Behavior depends on the props:
 *
 * - **% mode** (default): `maxValue` omitted, `hideThreshold` false. Bars
 *   above `threshold` ink dark (passed), below render muted, and a dashed
 *   guideline crosses at the threshold.
 * - **Effort mode**: `maxValue` set to the visible max, `hideThreshold` true.
 *   Bars scale to `maxValue`, render in a single neutral tone, no guideline.
 *
 * Hover a bar to see its tooltip (native `<title>` element).
 */
export function SimpleBarChart({
  bars,
  threshold = 0,
  height = 120,
  maxValue,
  hideThreshold = false,
}: Props) {
  if (bars.length === 0) return null;

  const padding = 6;
  const barGap = 2;
  const barCount = bars.length;
  const viewWidth = 600;
  const usableWidth = viewWidth - padding * 2;
  const barWidth = (usableWidth - barGap * (barCount - 1)) / barCount;
  const chartBottom = height - 16;
  const chartTop = padding;
  const chartHeight = chartBottom - chartTop;

  // Effort mode uses maxValue (with a floor so a single update doesn't fill
  // the chart); % mode keeps the 0..100 scale.
  const scaleMax = maxValue !== undefined ? Math.max(maxValue, 1) : 100;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${height}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label="progress histogram"
    >
      {!hideThreshold && threshold > 0 && (
        <line
          x1={padding}
          x2={viewWidth - padding}
          y1={chartBottom - (threshold / 100) * chartHeight}
          y2={chartBottom - (threshold / 100) * chartHeight}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}

      {bars.map((b, i) => {
        const x = padding + i * (barWidth + barGap);
        const clamped = Math.max(0, b.value);
        const h = (clamped / scaleMax) * chartHeight;
        let fill: string;
        if (!b.hasData) {
          fill = 'rgba(0,0,0,0.06)';
        } else if (hideThreshold) {
          fill = 'rgba(43,42,38,0.7)';
        } else {
          const passed = clamped >= threshold;
          fill = passed ? 'rgba(43,42,38,0.8)' : 'rgba(0,0,0,0.25)';
        }
        return (
          <g key={i}>
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
