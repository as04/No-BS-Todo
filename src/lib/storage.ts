import type { ToBooState, Vertical, Category } from '../types';
import { nanoid } from 'nanoid';
import { seedHabits } from './habits';

const KEY = 'toboo:v1';

const DEFAULT_VERTICALS: Vertical[] = [
  { id: 'vert-financial', name: 'Financial' },
  { id: 'vert-health', name: 'Health' },
  { id: 'vert-career', name: 'Career' },
];

type V1State = {
  notes: ToBooState['notes'];
  categories: { id: string; name: string; color: Category['color'] }[];
  todaysCategoryIds: string[];
  todaysPickedAt: number | null;
};

function isV2(s: unknown): s is ToBooState {
  return !!s && typeof s === 'object' && (s as ToBooState).schemaVersion === 2;
}

function migrateV1ToV2(v1: V1State): ToBooState {
  const fallbackVerticalId = DEFAULT_VERTICALS[2].id; // Career as catch-all
  return {
    schemaVersion: 2,
    verticals: DEFAULT_VERTICALS,
    notes: v1.notes.map((n) => ({ ...n, weight: (n as { weight?: number }).weight ?? 3 })),
    categories: v1.categories.map((c) => ({ ...c, verticalId: fallbackVerticalId })),
    todaysCategoryIds: v1.todaysCategoryIds,
    todaysPickedAt: v1.todaysPickedAt,
    dailyHistory: [],
    streakThreshold: 10,
    habits: seedHabits(),
  };
}

function backfillV2(s: ToBooState): ToBooState {
  // Older saved-v2 states may lack the newer fields. Add defaults non-destructively.
  return {
    ...s,
    dailyHistory: s.dailyHistory ?? [],
    streakThreshold: s.streakThreshold ?? 10,
    habits: s.habits ?? seedHabits(),
  };
}

export function loadState(): ToBooState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isV2(parsed)) return backfillV2(parsed);
    // anything else: treat as v1
    return migrateV1ToV2(parsed as V1State);
  } catch {
    return null;
  }
}

export function saveState(state: ToBooState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or private mode — silently drop.
  }
}

export function freshVerticals(): Vertical[] {
  return DEFAULT_VERTICALS.map((v) => ({ ...v }));
}

export function newVertical(name: string): Vertical {
  return { id: nanoid(), name };
}
