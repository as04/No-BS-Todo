import type { ToBooState, Vertical, Category, Note } from '../types';
import { seedHabits } from './habits';

/** localStorage key under which the whole {@link ToBooState} blob lives. */
const KEY = 'toboo:v1';

/** Default verticals used when seeding or migrating from v1 state. */
const DEFAULT_VERTICALS: Vertical[] = [
  { id: 'vert-financial', name: 'Financial' },
  { id: 'vert-health', name: 'Health' },
  { id: 'vert-career', name: 'Career' },
];

/** Shape of the original v1-era state (pre-verticals, pre-history). */
type V1State = {
  notes: Note[];
  categories: { id: string; name: string; color: Category['color'] }[];
  todaysCategoryIds: string[];
  todaysPickedAt: number | null;
};

/**
 * Type guard: is the parsed JSON a current-version (v2) state?
 *
 * We use a minimal `Record` cast here only because TypeScript can't narrow
 * `unknown` purely with `in` checks; the runtime check (`schemaVersion === 2`)
 * is what gives us the actual safety.
 */
function isV2(s: unknown): s is ToBooState {
  if (typeof s !== 'object' || s === null) return false;
  const obj = s as Record<string, unknown>;
  return obj.schemaVersion === 2;
}

/** Shallow runtime check that an object looks v1-shaped. */
function looksLikeV1(s: unknown): s is V1State {
  if (typeof s !== 'object' || s === null) return false;
  const obj = s as Record<string, unknown>;
  return Array.isArray(obj.notes) && Array.isArray(obj.categories);
}

/** Read the `weight` from a possibly-untyped note, falling back to 3. */
function safeWeight(n: unknown): number {
  if (typeof n !== 'object' || n === null) return 3;
  const w = (n as Record<string, unknown>).weight;
  return typeof w === 'number' ? w : 3;
}

/**
 * Migrate a v1 state into the current shape. Existing categories get pinned
 * to the Career fallback vertical; existing notes get a default weight; new
 * fields (`dailyHistory`, `streakThreshold`, `habits`, `viewPrefs`) are seeded
 * with sensible defaults.
 */
function migrateV1ToV2(v1: V1State): ToBooState {
  const fallbackVerticalId = DEFAULT_VERTICALS[2].id;
  return {
    schemaVersion: 2,
    verticals: DEFAULT_VERTICALS,
    notes: v1.notes.map((n) => ({ ...n, weight: safeWeight(n) })),
    categories: v1.categories.map((c) => ({ ...c, verticalId: fallbackVerticalId })),
    todaysCategoryIds: v1.todaysCategoryIds,
    todaysPickedAt: v1.todaysPickedAt,
    dailyHistory: [],
    streakThreshold: 10,
    habits: seedHabits(),
    viewPrefs: { view: 'card', minimalist: false, minN: 5 },
  };
}

/**
 * Backfill fields that newer Phase-2 sub-pieces added — handles cases where
 * a user's saved v2 state predates a newer field. Never destroys data.
 */
function backfillV2(s: ToBooState): ToBooState {
  return {
    ...s,
    dailyHistory: s.dailyHistory ?? [],
    streakThreshold: s.streakThreshold ?? 10,
    habits: s.habits ?? seedHabits(),
    viewPrefs: s.viewPrefs ?? { view: 'card', minimalist: false, minN: 5 },
  };
}

/**
 * Load and normalise state from localStorage. Returns `null` if there's
 * nothing saved (so the caller can seed defaults), or if the saved blob is
 * unrecognisable.
 */
export function loadState(): ToBooState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isV2(parsed)) return backfillV2(parsed);
    if (looksLikeV1(parsed)) return migrateV1ToV2(parsed);
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist the entire state to localStorage. Silently drops on quota errors
 * or in private-mode storage; Phase 4 plans to migrate to IndexedDB.
 */
export function saveState(state: ToBooState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or private mode — silently drop.
  }
}

/** A fresh copy of the default verticals (shared with the store's `seed()`). */
export function freshVerticals(): Vertical[] {
  return DEFAULT_VERTICALS.map((v) => ({ ...v }));
}
