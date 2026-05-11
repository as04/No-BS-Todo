import type { Note, NoteStatus, ProgressMode } from '../types';

export function progressPercent(p: ProgressMode): number {
  if (p.kind === 'checklist') {
    if (p.items.length === 0) return 0;
    const done = p.items.filter((i) => i.done).length;
    return Math.round((done / p.items.length) * 100);
  }
  if (p.total <= 0) return 0;
  return Math.min(100, Math.round((p.current / p.total) * 100));
}

export function deriveStatus(p: ProgressMode): NoteStatus {
  const pct = progressPercent(p);
  if (pct >= 100) return 'done';
  if (pct > 0) return 'doing';
  return 'todo';
}

export function sortByInProgressFirst(notes: Note[]): Note[] {
  const rank: Record<NoteStatus, number> = { doing: 0, todo: 1, done: 2 };
  return [...notes].sort((a, b) => {
    const r = rank[a.status] - rank[b.status];
    if (r !== 0) return r;
    return b.updatedAt - a.updatedAt;
  });
}
