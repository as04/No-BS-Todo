import { useMemo } from 'react';
import type { DailySnapshot } from '../types';
import { localDateKey, previousDateKey } from '../lib/dates';

type Props = {
  history: DailySnapshot[];
  /** How many weeks to show, ending on this week. Default 52. */
  weeks?: number;
};

/**
 * GitHub-contributions-style calendar heatmap. Each square = one day,
 * laid out in week columns (Monday at the top, Sunday at the bottom).
 * Intensity reflects {@link DailySnapshot.notesTouched} — the same
 * "effort" metric the bar chart used to show, but the grid layout stays
 * legible even with very sparse data.
 *
 * Hover any square for a tooltip with the date and exact count.
 */
export function CalendarHeatmap({ history, weeks = 52 }: Props) {
  const grid = useMemo(() => buildGrid(history, weeks), [history, weeks]);

  // SVG geometry
  const cellSize = 11;
  const cellGap = 3;
  const cellStep = cellSize + cellGap;
  const leftGutter = 22; // room for "Mon / Wed / Fri" labels
  const topGutter = 14; // room for month labels
  const width = leftGutter + grid.weekKeys.length * cellStep;
  const height = topGutter + 7 * cellStep;

  // Compute a color scale from the visible data. Five buckets:
  //   0 = empty (light gray), 1..max scaled across four ink tints.
  const maxCount = grid.cells.reduce(
    (acc, c) => (c.count > acc ? c.count : acc),
    0
  );
  const colorFor = (count: number): string => {
    if (count <= 0) return 'rgba(0,0,0,0.06)';
    if (maxCount <= 1) return 'rgba(43,42,38,0.65)';
    const ratio = count / maxCount;
    if (ratio < 0.25) return 'rgba(43,42,38,0.25)';
    if (ratio < 0.5) return 'rgba(43,42,38,0.45)';
    if (ratio < 0.75) return 'rgba(43,42,38,0.65)';
    return 'rgba(43,42,38,0.85)';
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label="calendar heatmap of note activity"
    >
      {/* Weekday labels — only Mon / Wed / Fri to keep it light */}
      <g fill="rgba(0,0,0,0.4)" fontSize={8}>
        <text x={0} y={topGutter + cellStep * 0 + cellSize - 1}>M</text>
        <text x={0} y={topGutter + cellStep * 2 + cellSize - 1}>W</text>
        <text x={0} y={topGutter + cellStep * 4 + cellSize - 1}>F</text>
      </g>

      {/* Month labels above */}
      {grid.monthLabels.map((m) => (
        <text
          key={`${m.label}-${m.x}`}
          x={leftGutter + m.x}
          y={topGutter - 4}
          fontSize={8}
          fill="rgba(0,0,0,0.45)"
        >
          {m.label}
        </text>
      ))}

      {/* Day squares */}
      {grid.cells.map((c) => (
        <g key={c.dateKey}>
          <rect
            x={leftGutter + c.col * cellStep}
            y={topGutter + c.row * cellStep}
            width={cellSize}
            height={cellSize}
            rx={2}
            fill={colorFor(c.count)}
          />
          <title>{c.tooltip}</title>
        </g>
      ))}
    </svg>
  );
}

type Cell = {
  dateKey: string;
  /** 0..6 = Mon..Sun row index. */
  row: number;
  /** 0..N week-column index, leftmost = oldest. */
  col: number;
  /** Effort count for this day (0 when no snapshot). */
  count: number;
  tooltip: string;
};

type MonthLabel = { label: string; x: number };

/** Compute the Monday of the week containing `key` and return its date key. */
function mondayOf(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dayIdx = (dt.getDay() + 6) % 7; // 0 = Mon … 6 = Sun
  dt.setDate(dt.getDate() - dayIdx);
  return localDateKey(dt.getTime());
}

/** Build the grid + month labels for `weeks` weeks ending this week. */
function buildGrid(
  history: DailySnapshot[],
  weeks: number
): { cells: Cell[]; weekKeys: string[]; monthLabels: MonthLabel[] } {
  const byDate = new Map(history.map((h) => [h.date, h]));

  // Walk back N weeks of Mondays from this week's Monday.
  const weekKeys: string[] = [];
  let cursor = mondayOf(localDateKey());
  for (let i = 0; i < weeks; i++) {
    weekKeys.push(cursor);
    let back = cursor;
    for (let k = 0; k < 7; k++) back = previousDateKey(back);
    cursor = back;
  }
  weekKeys.reverse();

  const cells: Cell[] = [];
  const monthLabels: MonthLabel[] = [];
  let lastMonth = -1;

  weekKeys.forEach((monday, colIdx) => {
    // Month label whenever the current week's Monday crosses into a new month.
    const [my, mm] = monday.split('-').map(Number);
    if (mm - 1 !== lastMonth) {
      lastMonth = mm - 1;
      const labelDate = new Date(my, mm - 1, 1);
      monthLabels.push({
        label: labelDate.toLocaleDateString(undefined, { month: 'short' }),
        x: colIdx * (11 + 3),
      });
    }

    let dayCursor = monday;
    for (let row = 0; row < 7; row++) {
      const snap = byDate.get(dayCursor);
      const count = snap?.notesTouched ?? 0;
      const [yy, mmd, dd] = dayCursor.split('-').map(Number);
      const dateObj = new Date(yy, mmd - 1, dd);
      cells.push({
        dateKey: dayCursor,
        row,
        col: colIdx,
        count,
        tooltip: `${dateObj.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })} · ${count} note update${count === 1 ? '' : 's'}`,
      });
      // Advance one day.
      const next = new Date(yy, mmd - 1, dd);
      next.setDate(next.getDate() + 1);
      dayCursor = localDateKey(next.getTime());
    }
  });

  return { cells, weekKeys, monthLabels };
}
