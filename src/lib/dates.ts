/**
 * Helpers for local-time date keys (YYYY-MM-DD). All time-of-day comparisons
 * elsewhere in the app use these, never raw timestamps, so daylight-saving
 * shifts and timezone changes don't accidentally drop or duplicate days.
 */

/**
 * Convert a millisecond timestamp (or "now") into a local-time date key.
 * Format: `YYYY-MM-DD`.
 */
export function localDateKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get the key for the day immediately before `key`. Handles month/year
 * rollover via the Date constructor.
 */
export function previousDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return localDateKey(dt.getTime());
}
