import { useMemo } from 'react';
import type { DailySnapshot } from '../types';
import { localDateKey, previousDateKey } from '../lib/dates';

/** Width and height of one day square, in SVG user units. */
const CELL_SIZE = 11;
/** Gap between adjacent day squares, in SVG user units. */
const CELL_GAP = 3;
/** Center-to-center distance between adjacent squares (size + gap). */
const CELL_STEP = CELL_SIZE + CELL_GAP;
/** Horizontal space reserved on the left for weekday labels (M / W / F). */
const LEFT_GUTTER = 22;
/** Vertical space reserved at the top for month labels. */
const TOP_GUTTER = 14;

type Props = {
  history: DailySnapshot[];
  /** How many weeks to show, ending on this week. Default 52. */
  weeks?: number;
};

/**
 * GitHub-contributions-style calendar heatmap. Each square is one day,
 * laid out in week columns (Monday at the top, Sunday at the bottom).
 * Square intensity reflects {@link DailySnapshot.notesTouched} — the same
 * "effort" metric the old bar chart showed, but the grid stays legible
 * even with very sparse data because empty days still claim a square.
 *
 * Hover any square for a tooltip with the date and exact count.
 */
export function CalendarHeatmap({ history, weeks = 52 }: Props) {
  const grid = useMemo(() => buildGrid(history, weeks), [history, weeks]);

  const width = LEFT_GUTTER + grid.weekKeys.length * CELL_STEP;
  const height = TOP_GUTTER + 7 * CELL_STEP;

  // Five-step intensity scale, anchored to the visible maximum so a quiet
  // user still gets useful contrast.
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
      {/* Weekday labels — only M / W / F to keep the gutter light. */}
      <g fill="rgba(0,0,0,0.4)" fontSize={8}>
        <text x={0} y={TOP_GUTTER + CELL_STEP * 0 + CELL_SIZE - 1}>M</text>
        <text x={0} y={TOP_GUTTER + CELL_STEP * 2 + CELL_SIZE - 1}>W</text>
        <text x={0} y={TOP_GUTTER + CELL_STEP * 4 + CELL_SIZE - 1}>F</text>
      </g>

      {grid.monthLabels.map((m) => (
        <text
          key={`${m.label}-${m.x}`}
          x={LEFT_GUTTER + m.x}
          y={TOP_GUTTER - 4}
          fontSize={8}
          fill="rgba(0,0,0,0.45)"
        >
          {m.label}
        </text>
      ))}

      {grid.cells.map((c) => (
        <g key={c.dateKey}>
          <rect
            x={LEFT_GUTTER + c.col * CELL_STEP}
            y={TOP_GUTTER + c.row * CELL_STEP}
            width={CELL_SIZE}
            height={CELL_SIZE}
            rx={2}
            fill={colorFor(c.count)}
          />
          <title>{c.tooltip}</title>
        </g>
      ))}
    </svg>
  );
}

/** One day-square in the heatmap. */
type Cell = {
  /** YYYY-MM-DD date key this square represents. */
  dateKey: string;
  /** 0..6 — row index within a week column (0 = Mon, 6 = Sun). */
  row: number;
  /** 0..N − 1 — week column index (leftmost = oldest). */
  col: number;
  /** {@link DailySnapshot.notesTouched} for this day, or 0 if no snapshot. */
  count: number;
  /** Native `<title>` text shown on hover. */
  tooltip: string;
};

/** A month abbreviation positioned above its first week column. */
type MonthLabel = {
  label: string;
  /** X offset relative to the first day-column (not including LEFT_GUTTER). */
  x: number;
};

/**
 * Returns the Monday of the week containing `key` as its own YYYY-MM-DD
 * date key. Used as the "anchor" we walk backwards from when laying out
 * week columns oldest-to-newest.
 */
function mondayOf(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dayIdx = (dt.getDay() + 6) % 7; // 0 = Mon … 6 = Sun
  dt.setDate(dt.getDate() - dayIdx);
  return localDateKey(dt.getTime());
}

/**
 * Build the full grid of cells + month-label positions for `weeks` weeks
 * ending this week (oldest column first).
 */
function buildGrid(
  history: DailySnapshot[],
  weeks: number
): { cells: Cell[]; weekKeys: string[]; monthLabels: MonthLabel[] } {
  const byDate = new Map(history.map((h) => [h.date, h]));

  // Walk back N weeks of Mondays from this week's Monday, then reverse so
  // index 0 is the oldest week.
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
    // Drop a month label whenever the current week's Monday crosses into
    // a new calendar month.
    const [my, mm] = monday.split('-').map(Number);
    if (mm - 1 !== lastMonth) {
      lastMonth = mm - 1;
      const labelDate = new Date(my, mm - 1, 1);
      monthLabels.push({
        label: labelDate.toLocaleDateString(undefined, { month: 'short' }),
        x: colIdx * CELL_STEP,
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
