import type {
  ToBooState,
  Note,
  Category,
  Habit,
  DailySnapshot,
} from '../types';
import { progressPercent } from './progress';

/** What the exported JSON envelope looks like. */
export type ExportEnvelope = {
  app: 'toboo';
  exportedAt: string; // ISO timestamp
  state: ToBooState;
};

const ENVELOPE_APP = 'toboo';

// -----------------------------------------------------------------------------
// JSON export — full-fidelity backup, round-trippable via importJson()
// -----------------------------------------------------------------------------

/**
 * Trigger a browser download of the entire {@link ToBooState} wrapped in an
 * {@link ExportEnvelope}. The filename includes today's date so successive
 * exports sort chronologically on disk.
 */
export function exportJson(state: ToBooState): void {
  const envelope: ExportEnvelope = {
    app: ENVELOPE_APP,
    exportedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(envelope, null, 2)], {
    type: 'application/json',
  });
  triggerDownload(blob, `toboo-backup-${todayStamp()}.json`);
}

// -----------------------------------------------------------------------------
// Markdown export — human-friendly, drag-into-Apple-Notes friendly
// -----------------------------------------------------------------------------

/**
 * Trigger a browser download of the user's data as a single Markdown file:
 * one `##` section per (vertical → category) pair, one `###` heading per
 * note, checklist items as `- [x] / - [ ]`, bulk progress on one line.
 *
 * Renders nicely in Apple Notes (drag-and-drop the .md), Obsidian, Bear,
 * GitHub previews, and any text editor.
 */
export function exportMarkdown(state: ToBooState): void {
  const md = stateToMarkdown(state);
  const blob = new Blob([md], { type: 'text/markdown' });
  triggerDownload(blob, `toboo-${todayStamp()}.md`);
}

/** Build the full Markdown text. Exported for testing / preview. */
export function stateToMarkdown(state: ToBooState): string {
  const { verticals, categories, notes } = state;
  const lines: string[] = [];
  lines.push(`# ToBoo · exported ${new Date().toLocaleDateString()}`);
  lines.push('');

  const catsByVertical = new Map<string, Category[]>();
  for (const c of categories) {
    const arr = catsByVertical.get(c.verticalId) ?? [];
    arr.push(c);
    catsByVertical.set(c.verticalId, arr);
  }

  const notesByCategory = new Map<string | null, Note[]>();
  for (const n of notes) {
    const key = n.categoryId;
    const arr = notesByCategory.get(key) ?? [];
    arr.push(n);
    notesByCategory.set(key, arr);
  }

  // Section per (vertical → category). Empty categories are skipped.
  for (const v of verticals) {
    const cats = catsByVertical.get(v.id) ?? [];
    for (const c of cats) {
      const catNotes = notesByCategory.get(c.id) ?? [];
      if (catNotes.length === 0) continue;
      lines.push(`## ${v.name} — ${c.name}`);
      lines.push('');
      for (const n of catNotes) writeNote(lines, n);
    }
  }

  // Uncategorized notes get their own trailing section.
  const orphans = notesByCategory.get(null) ?? [];
  if (orphans.length > 0) {
    lines.push('## (Uncategorized)');
    lines.push('');
    for (const n of orphans) writeNote(lines, n);
  }

  return lines.join('\n');
}

function writeNote(lines: string[], n: Note): void {
  const pct = progressPercent(n.progress);
  const statusBits = [`${pct}%`, n.status];
  if (typeof n.weight === 'number') statusBits.push(`weight ${n.weight}`);
  lines.push(`### ${n.title} · ${statusBits.join(' · ')}`);

  if (n.body && n.body.trim()) {
    lines.push('');
    lines.push(n.body.trim());
  }

  if (n.progress.kind === 'checklist') {
    if (n.progress.items.length > 0) {
      lines.push('');
      for (const item of n.progress.items) {
        lines.push(`- [${item.done ? 'x' : ' '}] ${item.text}`);
      }
    }
  } else {
    lines.push('');
    lines.push(
      `- bulk: **${n.progress.current}** of **${n.progress.total}** ${n.progress.unitLabel}${n.progress.total === 1 ? '' : 's'}`
    );
  }

  if (n.completedAt) {
    lines.push('');
    lines.push(`*completed ${new Date(n.completedAt).toLocaleDateString()}*`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
}

// -----------------------------------------------------------------------------
// JSON import — round-trip from a previously-exported file
// -----------------------------------------------------------------------------

/** Discriminated result of an import attempt, exposed to the UI. */
export type ImportResult =
  | { ok: true; state: ToBooState }
  | { ok: false; error: string };

/**
 * Read + parse + lightly validate a user-supplied file. Accepts both the
 * full {@link ExportEnvelope} we emit and a bare state object (e.g. exported
 * by a tinkerer). Returns the parsed {@link ToBooState} so the caller can
 * confirm with the user before swapping it in.
 *
 * Migration & backfill (v1 → v2, plus field defaults) is delegated to the
 * existing storage helpers via {@link normalizeIncomingState}.
 */
export async function importJson(file: File): Promise<ImportResult> {
  let raw: string;
  try {
    raw = await file.text();
  } catch {
    return { ok: false, error: 'Could not read the selected file.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }

  const candidate = extractStateCandidate(parsed);
  if (!candidate) {
    return {
      ok: false,
      error:
        'File does not look like a ToBoo export. Expected a backup with `app: "toboo"` or a state object.',
    };
  }

  const normalized = await normalizeIncomingState(candidate);
  if (!normalized) {
    return { ok: false, error: 'Imported state failed validation.' };
  }
  return { ok: true, state: normalized };
}

/** If the JSON is our envelope, return the inner state; otherwise the JSON itself. */
function extractStateCandidate(parsed: unknown): unknown | null {
  if (parsed === null || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  if (obj.app === ENVELOPE_APP && typeof obj.state === 'object') {
    return obj.state;
  }
  // Bare state object (with verticals/categories/notes arrays) — accept too.
  if (
    Array.isArray(obj.notes) &&
    Array.isArray(obj.categories)
  ) {
    return obj;
  }
  return null;
}

/**
 * Run the candidate through the storage layer's migration so v1 exports
 * still work and so newer-field defaults get backfilled. We do this by
 * temporarily routing the candidate through loadState() via a tiny
 * write-and-read trick — keeps the migration logic in one place.
 */
async function normalizeIncomingState(
  candidate: unknown
): Promise<ToBooState | null> {
  // Dynamically import to avoid circular imports between dataIO and storage.
  const storage = await import('./storage');
  const STAGING_KEY = 'toboo:import-staging';
  try {
    localStorage.setItem(STAGING_KEY, JSON.stringify(candidate));
    // Swap the live key for the staging blob temporarily to reuse loadState's
    // migration logic without duplicating it.
    const liveKey = 'toboo:v1';
    const livePrev = localStorage.getItem(liveKey);
    localStorage.setItem(liveKey, JSON.stringify(candidate));
    const migrated = storage.loadState();
    if (livePrev !== null) localStorage.setItem(liveKey, livePrev);
    else localStorage.removeItem(liveKey);
    localStorage.removeItem(STAGING_KEY);
    return migrated;
  } catch {
    localStorage.removeItem(STAGING_KEY);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Merge — non-destructive combination of current + incoming
// -----------------------------------------------------------------------------

/** Summary of what the merge actually changed — surfaced as a toast. */
export type MergeReport = {
  notesAdded: number;
  notesUpdated: number;
  categoriesAdded: number;
  verticalsAdded: number;
  habitsAdded: number;
  daysAdded: number;
  notesRemapped: number;
  result: ToBooState;
};

/**
 * Combine `current` and `incoming` without destroying user work.
 *
 * Vertical / category merge has a fix for the seed-id problem: when the
 * incoming side has a vertical or category with a *new id but identical
 * name*, we keep the current id and remap any incoming notes that
 * referenced the duplicate. That prevents the "I imported a backup and
 * now have two 'Career' verticals" surprise.
 *
 * Rules:
 * - **Verticals**: dedupe by id, then by name (case-insensitive). Current
 *   wins on conflict.
 * - **Categories**: dedupe by id, then by `(verticalId, name)`. Current
 *   wins on conflict. Notes whose `categoryId` referred to the duplicated
 *   incoming category get remapped to the current id.
 * - **Notes**: union by id. On conflict, the one with later `updatedAt`
 *   wins.
 * - **Habits**: union by id, ticks unioned.
 * - **dailyHistory**: union by date. On same-date conflicts we take the
 *   higher endPercent, the lower startPercent, the higher notesTouched,
 *   and prefer a non-empty reflection.
 * - **todaysCategoryIds / todaysPickedAt / streakThreshold / viewPrefs /
 *   schemaVersion**: `current` wins (session-scoped preferences).
 */
export function mergeStates(
  current: ToBooState,
  incoming: ToBooState
): MergeReport {
  // 1. Verticals
  const verticalRemap = buildNameRemap(
    current.verticals,
    incoming.verticals,
    (v) => v.name.trim().toLowerCase()
  );
  const verticals = unionByIdPreserving(
    current.verticals,
    incoming.verticals,
    verticalRemap
  );
  const verticalsAdded = verticals.length - current.verticals.length;

  // 2. Categories — apply vertical remap to incoming before deduping, so
  // categories pointing at a remapped vertical compare correctly.
  const incomingCategories = incoming.categories.map((c) => ({
    ...c,
    verticalId: verticalRemap.get(c.verticalId) ?? c.verticalId,
  }));
  const categoryRemap = buildNameRemap(
    current.categories,
    incomingCategories,
    (c) => `${c.verticalId}|${c.name.trim().toLowerCase()}`
  );
  const categories = unionByIdPreserving(
    current.categories,
    incomingCategories,
    categoryRemap
  );
  const categoriesAdded = categories.length - current.categories.length;

  // 3. Notes — apply category remap to incoming so reassigned notes land in
  // the existing category instead of an orphaned one.
  const incomingNotes = incoming.notes.map((n) => ({
    ...n,
    categoryId:
      n.categoryId === null
        ? null
        : (categoryRemap.get(n.categoryId) ?? n.categoryId),
  }));
  const { merged: notes, added: notesAdded, updated: notesUpdated } =
    mergeNotesByUpdatedAt(current.notes, incomingNotes);
  const notesRemapped = incomingNotes.filter(
    (n, i) => n.categoryId !== incoming.notes[i].categoryId
  ).length;

  // 4. Habits
  const habits = mergeHabits(current.habits, incoming.habits);
  const habitsAdded = habits.length - current.habits.length;

  // 5. Daily history
  const dailyHistory = mergeDailyHistory(
    current.dailyHistory,
    incoming.dailyHistory
  );
  const daysAdded = dailyHistory.length - current.dailyHistory.length;

  return {
    notesAdded,
    notesUpdated,
    categoriesAdded,
    verticalsAdded,
    habitsAdded,
    daysAdded,
    notesRemapped,
    result: {
      schemaVersion: current.schemaVersion,
      verticals,
      categories,
      notes,
      todaysCategoryIds: current.todaysCategoryIds,
      todaysPickedAt: current.todaysPickedAt,
      dailyHistory,
      streakThreshold: current.streakThreshold,
      habits,
      viewPrefs: current.viewPrefs,
    },
  };
}

/**
 * Build a map from "incoming id" to "current id" for items where the names
 * (per `keyFn`) match. Lets us treat duplicate-by-name as duplicate-by-id
 * during the merge so seed-generated nanoid collisions don't cause dupes.
 */
function buildNameRemap<T extends { id: string }>(
  current: T[],
  incoming: T[],
  keyFn: (t: T) => string
): Map<string, string> {
  const currentByKey = new Map<string, string>();
  for (const c of current) currentByKey.set(keyFn(c), c.id);
  const remap = new Map<string, string>();
  for (const i of incoming) {
    const matchId = currentByKey.get(keyFn(i));
    if (matchId && matchId !== i.id) remap.set(i.id, matchId);
  }
  return remap;
}

/**
 * Union of `current` and `incoming` by id, with current winning on
 * conflict. Any incoming entry whose id is in `remap` is treated as
 * already-present (its data was already in `current`).
 */
function unionByIdPreserving<T extends { id: string }>(
  current: T[],
  incoming: T[],
  remap: Map<string, string>
): T[] {
  const seenIds = new Set(current.map((c) => c.id));
  const out = [...current];
  for (const i of incoming) {
    if (seenIds.has(i.id) || remap.has(i.id)) continue;
    out.push(i);
    seenIds.add(i.id);
  }
  return out;
}

/**
 * Notes merge — newest updatedAt wins per id. Reports how many were
 * brand-new vs. overwritten by a newer incoming version, so the UI can
 * tell the user what just happened.
 */
function mergeNotesByUpdatedAt(
  current: Note[],
  incoming: Note[]
): { merged: Note[]; added: number; updated: number } {
  const byId = new Map<string, Note>();
  for (const n of current) byId.set(n.id, n);
  let added = 0;
  let updated = 0;
  for (const n of incoming) {
    const existing = byId.get(n.id);
    if (!existing) {
      byId.set(n.id, n);
      added += 1;
    } else if (n.updatedAt > existing.updatedAt) {
      byId.set(n.id, n);
      updated += 1;
    }
  }
  return { merged: Array.from(byId.values()), added, updated };
}

/** Habits merge — current's metadata wins; ticks are unioned. */
function mergeHabits(current: Habit[], incoming: Habit[]): Habit[] {
  const byId = new Map<string, Habit>();
  for (const h of current) byId.set(h.id, { ...h, ticks: { ...h.ticks } });
  for (const inc of incoming) {
    const existing = byId.get(inc.id);
    if (!existing) {
      byId.set(inc.id, { ...inc, ticks: { ...inc.ticks } });
      continue;
    }
    // Union ticks — either source counts as ticked.
    const mergedTicks = { ...existing.ticks };
    for (const dateKey of Object.keys(inc.ticks)) {
      if (inc.ticks[dateKey]) mergedTicks[dateKey] = true;
    }
    existing.ticks = mergedTicks;
  }
  return Array.from(byId.values());
}

/** Per-day union: max progress, max touches, prefer any non-empty reflection. */
function mergeDailyHistory(
  current: DailySnapshot[],
  incoming: DailySnapshot[]
): DailySnapshot[] {
  const byDate = new Map<string, DailySnapshot>();
  for (const s of current) byDate.set(s.date, { ...s });
  for (const inc of incoming) {
    const existing = byDate.get(inc.date);
    if (!existing) {
      byDate.set(inc.date, { ...inc });
      continue;
    }
    byDate.set(inc.date, {
      date: existing.date,
      startPercent: Math.min(existing.startPercent, inc.startPercent),
      endPercent: Math.max(existing.endPercent, inc.endPercent),
      notesTouched: Math.max(existing.notesTouched, inc.notesTouched),
      reflection: existing.reflection || inc.reflection,
    });
  }
  return Array.from(byDate.values()).sort((a, b) =>
    a.date < b.date ? -1 : 1
  );
}

// -----------------------------------------------------------------------------
// internals
// -----------------------------------------------------------------------------

/** YYYY-MM-DD stamp used in filenames. */
function todayStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Browser-side "save as" using an anchor element + object URL. */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Small timeout so the browser actually starts the download before we
  // revoke the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

