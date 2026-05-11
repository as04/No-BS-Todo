import { nanoid } from 'nanoid';
import type { Habit } from '../types';

// Ben Franklin's 13 virtues — editable defaults.
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

export function seedHabits(): Habit[] {
  return FRANKLIN_13.map((name) => ({
    id: nanoid(),
    name,
    weight: 3,
    ticks: {},
  }));
}

// Returns YYYY-MM-DD keys for the 7 days ending today (local time), oldest first.
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

export function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1);
}
