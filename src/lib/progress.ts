import type { Note, NoteStatus, ProgressMode } from '../types';

/**
 * Compute the completion percent (0..100) of a single note's progress.
 * - Checklist mode: `(items done / total) * 100`, or 0 if no items.
 * - Bulk mode: `(current / total) * 100`, capped at 100 and clamped to a
 *   non-negative total.
 */
export function progressPercent(p: ProgressMode): number {
  if (p.kind === 'checklist') {
    if (p.items.length === 0) return 0;
    const done = p.items.filter((i) => i.done).length;
    return Math.round((done / p.items.length) * 100);
  }
  if (p.total <= 0) return 0;
  return Math.min(100, Math.round((p.current / p.total) * 100));
}

/**
 * Derive a `todo`/`doing`/`done` status from a {@link ProgressMode}. The
 * derived value is also stored on `Note.status` for cheap filtering — the
 * two should stay in sync.
 */
export function deriveStatus(p: ProgressMode): NoteStatus {
  const pct = progressPercent(p);
  if (pct >= 100) return 'done';
  if (pct > 0) return 'doing';
  return 'todo';
}

/**
 * Sort notes so in-progress (`doing`) appear first, then `todo`, then `done`.
 * Within a status group, most-recently-updated wins. Returns a new array.
 */
export function sortByInProgressFirst(notes: Note[]): Note[] {
  const rank: Record<NoteStatus, number> = { doing: 0, todo: 1, done: 2 };
  return [...notes].sort((a, b) => {
    const r = rank[a.status] - rank[b.status];
    if (r !== 0) return r;
    return b.updatedAt - a.updatedAt;
  });
}

/**
 * Weighted-average progress percent across a set of notes. Each note's
 * percent contributes proportionally to its `weight` (1..5), so high-weight
 * notes pull the resulting figure more.
 *
 * Returns 0 for an empty input or if all weights are zero.
 */
export function weightedProgress(notes: Note[]): number {
  if (notes.length === 0) return 0;
  let num = 0;
  let den = 0;
  for (const n of notes) {
    const w = Math.max(1, Math.min(5, n.weight ?? 3));
    num += progressPercent(n.progress) * w;
    den += w;
  }
  if (den === 0) return 0;
  return Math.round(num / den);
}
