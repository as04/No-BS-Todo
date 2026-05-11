import type { DailySnapshot } from '../types';
import { localDateKey, previousDateKey } from './dates';

/**
 * Count consecutive days, anchored at today (or yesterday if today doesn't
 * have a snapshot yet), where {@link DailySnapshot.endPercent} is at least
 * `threshold`. Used to render the 🔥 chip in the header.
 *
 * @param history snapshots, sorted ascending by date
 * @param threshold percent the day must reach to count (default 10)
 * @returns the streak length in whole days, or 0
 */
export function computeStreak(
  history: DailySnapshot[],
  threshold: number
): number {
  if (history.length === 0) return 0;
  const byDate = new Map(history.map((h) => [h.date, h]));
  const today = localDateKey();
  let cursor = byDate.has(today) ? today : previousDateKey(today);
  let count = 0;
  while (byDate.has(cursor)) {
    const snap = byDate.get(cursor)!;
    if (snap.endPercent >= threshold) {
      count += 1;
      cursor = previousDateKey(cursor);
    } else {
      break;
    }
  }
  return count;
}
