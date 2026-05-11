import type { ToBooState } from '../types';

const KEY = 'toboo:v1';

export function loadState(): ToBooState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ToBooState;
  } catch {
    return null;
  }
}

export function saveState(state: ToBooState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or private mode — silently drop. Phase 2 swaps to IndexedDB.
  }
}
