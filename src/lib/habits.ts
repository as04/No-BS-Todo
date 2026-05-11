import { nanoid } from 'nanoid';
import type { Habit } from '../types';

/**
 * Ben Franklin's 13 classic virtues — used as the seed habits on first run.
 * Editable and removable from the Habits tab.
 */
const FRANKLIN_13 = [
  'Temperance',
  'Silence',
  'Order',
  'Resolution',
  'Frugality',
  'Industry',
  'Sincerity',
  'Justice',
  'Moderation',
  'Cleanliness',
  'Tranquility',
  'Chastity',
  'Humility',
];

/** Create the default habit set with empty ticks and weight 3. */
export function seedHabits(): Habit[] {
  return FRANKLIN_13.map((name) => ({
    id: nanoid(),
    name,
    weight: 3,
    ticks: {},
  }));
}

/**
 * Returns YYYY-MM-DD keys for the seven days ending on `today` (local time),
 * oldest first. Used to render the rolling tick grid in the Habit tracker.
 */
export function lastSevenDays(today: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

/** Single-letter weekday label for a YYYY-MM-DD key (e.g. "M", "T", "W"). */
export function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1);
}
