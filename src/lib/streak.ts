import type { DailySnapshot } from '../types';
import { localDateKey, previousDateKey } from './dates';

// Counts the consecutive days ending today (or yesterday if today not started)
// where endPercent >= threshold.
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
