import type { DailySnapshot } from '../types';
import { localDateKey, previousDateKey } from './dates';

/** A single histogram bar — caller decides how to render. */
export type ChartBar = {
  /** Short axis label, e.g. "12" (day) or "W22" (week). */
  label: string;
  /** Hover tooltip, e.g. "Mon 2026-05-04 · 5 note updates". */
  tooltip: string;
  /**
   * Raw numeric value. For % charts it's 0..100; for effort charts it's a
   * raw count and the caller passes `maxValue` to {@link SimpleBarChart}
   * for scaling.
   */
  value: number;
  /** Whether this bar has any underlying data (false → render dimly). */
  hasData: boolean;
};

/**
 * Return the Monday of the week containing `dateKey` as its own date key.
 * Monday = ISO week start (matches GitHub-style contribution grids).
 */
function mondayOf(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  // getDay: 0 = Sunday, 1 = Monday, … 6 = Saturday.
  const dayIdx = (dt.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
  dt.setDate(dt.getDate() - dayIdx);
  return localDateKey(dt.getTime());
}

/**
 * Build effort bars (raw counts of note interactions) for the last `days`
 * days, oldest left, newest right. Uses {@link DailySnapshot.notesTouched},
 * which counts every progress change / checklist tick / weight tweak — i.e.
 * "how busy was I" rather than "how complete am I."
 */
export function dailyEffortBars(
  history: DailySnapshot[],
  days: number
): ChartBar[] {
  const byDate = new Map(history.map((h) => [h.date, h]));
  const out: ChartBar[] = [];
  const keys: string[] = [];
  let cursor = localDateKey();
  for (let i = 0; i < days; i++) {
    keys.push(cursor);
    cursor = previousDateKey(cursor);
  }
  keys.reverse();
  for (const k of keys) {
    const snap = byDate.get(k);
    const [, , d] = k.split('-');
    const [y, m, day] = k.split('-').map(Number);
    const dateObj = new Date(y, m - 1, day);
    const count = snap?.notesTouched ?? 0;
    out.push({
      label: d,
      tooltip: `${dateObj.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })} · ${count} note update${count === 1 ? '' : 's'}`,
      value: count,
      hasData: snap !== undefined,
    });
  }
  return out;
}

/**
 * Build weekly effort bars — bar value is the **sum** of `notesTouched`
 * across all snapshots in that ISO week (total activity, not average).
 */
export function weeklyEffortBars(
  history: DailySnapshot[],
  weeks: number
): ChartBar[] {
  const byWeek = new Map<string, DailySnapshot[]>();
  for (const snap of history) {
    const mk = mondayOf(snap.date);
    const arr = byWeek.get(mk) ?? [];
    arr.push(snap);
    byWeek.set(mk, arr);
  }

  const out: ChartBar[] = [];
  let cursorMonday = mondayOf(localDateKey());
  const monKeys: string[] = [];
  for (let i = 0; i < weeks; i++) {
    monKeys.push(cursorMonday);
    let back = cursorMonday;
    for (let k = 0; k < 7; k++) back = previousDateKey(back);
    cursorMonday = back;
  }
  monKeys.reverse();

  for (const mk of monKeys) {
    const days = byWeek.get(mk) ?? [];
    const total = days.reduce((acc, d) => acc + d.notesTouched, 0);
    const weekNum = isoWeekNumber(mk);
    out.push({
      label: `W${weekNum}`,
      tooltip: `Week of ${formatMondayLabel(mk)} · ${total} note update${
        total === 1 ? '' : 's'
      }${days.length > 0 ? ` across ${days.length} day${days.length === 1 ? '' : 's'}` : ''}`,
      value: total,
      hasData: days.length > 0,
    });
  }
  return out;
}

/** Best-effort ISO week number — drives the W22 / W23 axis labels. */
function isoWeekNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil(((dt.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Locale-friendly "May 12" string for the Monday of a week. */
function formatMondayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
