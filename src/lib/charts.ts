import type { DailySnapshot } from '../types';
import { localDateKey, previousDateKey } from './dates';

/** A single histogram bar — caller decides how to render. */
export type ChartBar = {
  /** Short axis label, e.g. "12" (day) or "W22" (week). */
  label: string;
  /** Hover tooltip, e.g. "Mon 2026-05-04 · 45%". */
  tooltip: string;
  /** 0..100. Drives bar height. */
  value: number;
  /** Whether this bar has any underlying data (false → render dimly). */
  hasData: boolean;
};

/**
 * Build the last `days` bars (oldest left, newest right) using each day's
 * {@link DailySnapshot.endPercent}. Days with no snapshot show as 0-height,
 * `hasData: false` so the renderer can dim them.
 */
export function dailyBars(history: DailySnapshot[], days: number): ChartBar[] {
  const byDate = new Map(history.map((h) => [h.date, h]));
  const out: ChartBar[] = [];
  let cursor = localDateKey();
  // Walk backwards to gather `days` keys, then reverse to get oldest-first.
  const keys: string[] = [];
  for (let i = 0; i < days; i++) {
    keys.push(cursor);
    cursor = previousDateKey(cursor);
  }
  keys.reverse();
  for (const k of keys) {
    const snap = byDate.get(k);
    const [, , d] = k.split('-');
    const dateObj = (() => {
      const [y, m, day] = k.split('-').map(Number);
      return new Date(y, m - 1, day);
    })();
    out.push({
      label: d,
      tooltip: `${dateObj.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })} · ${snap?.endPercent ?? 0}%`,
      value: snap?.endPercent ?? 0,
      hasData: snap !== undefined,
    });
  }
  return out;
}

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
 * Build the last `weeks` weekly bars (oldest left, newest right) where each
 * bar is the **average** endPercent across days with snapshots in that ISO
 * week. Weeks with no snapshot days show as 0, `hasData: false`.
 */
export function weeklyBars(history: DailySnapshot[], weeks: number): ChartBar[] {
  // Group history by Monday key.
  const byWeek = new Map<string, DailySnapshot[]>();
  for (const snap of history) {
    const mk = mondayOf(snap.date);
    const arr = byWeek.get(mk) ?? [];
    arr.push(snap);
    byWeek.set(mk, arr);
  }

  // Walk back N weeks from this week's Monday.
  const out: ChartBar[] = [];
  let cursorMonday = mondayOf(localDateKey());
  const monKeys: string[] = [];
  for (let i = 0; i < weeks; i++) {
    monKeys.push(cursorMonday);
    // Go back 7 days from this Monday.
    let back = cursorMonday;
    for (let k = 0; k < 7; k++) back = previousDateKey(back);
    cursorMonday = back;
  }
  monKeys.reverse();

  for (const mk of monKeys) {
    const days = byWeek.get(mk) ?? [];
    const avg =
      days.length === 0
        ? 0
        : Math.round(
            days.reduce((acc, d) => acc + d.endPercent, 0) / days.length
          );
    const weekNum = isoWeekNumber(mk);
    out.push({
      label: `W${weekNum}`,
      tooltip: `Week of ${formatMondayLabel(mk)} · avg ${avg}%${
        days.length > 0 ? ` (${days.length} day${days.length === 1 ? '' : 's'})` : ''
      }`,
      value: avg,
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
