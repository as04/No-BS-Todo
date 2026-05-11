/**
 * Core data model for ToBoo. All app state is shaped by these types and is
 * persisted to localStorage as a single `ToBooState` blob (see `lib/storage.ts`).
 */

/** A single sub-task on a checklist-style note. */
export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

/**
 * Two ways a note tracks progress.
 *
 * - **checklist**: list of items the user ticks one-by-one. Useful for ad-hoc
 *   sub-tasks where each step is qualitatively different.
 * - **bulk**: a counter (e.g. "chapter 7 of 15"). Useful for sub-tasks that are
 *   numerically uniform — solves the "I don't want to click 15 boxes" pain.
 */
export type ProgressMode =
  | { kind: 'checklist'; items: ChecklistItem[] }
  | { kind: 'bulk'; unitLabel: string; total: number; current: number };

/** A note is `todo` (not started), `doing` (in progress), or `done` (100%). */
export type NoteStatus = 'todo' | 'doing' | 'done';

/**
 * A single sticky note. `categoryId` may be `null` for an uncategorized note
 * (renders with a neutral gray dot and is excluded from today's-focus
 * filtering unless "show all" is on).
 */
export type Note = {
  id: string;
  title: string;
  body?: string;
  categoryId: string | null;
  progress: ProgressMode;
  status: NoteStatus;
  /** 1..5 — pulls the daily progress ring proportionally. */
  weight: number;
  createdAt: number;
  updatedAt: number;
  /**
   * Set the moment the note first reaches 100% (status === 'done'); cleared
   * if progress drops back below 100%. Used by the History tab to group
   * completed notes by the day they were finished.
   */
  completedAt?: number;
};

/** Pastel palette options for category sticky-note tinting. */
export type StickyColor =
  | 'yellow'
  | 'pink'
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'gray';

/**
 * A grouping above categories. Kept short (Financial / Health / Career) so
 * the user has a small high-level mental model when filtering.
 */
export type Vertical = {
  id: string;
  name: string;
};

/** A coloured tag a note can belong to, nested under a {@link Vertical}. */
export type Category = {
  id: string;
  name: string;
  color: StickyColor;
  verticalId: string;
};

/**
 * One day's progress trace, used to compute the streak and (later phases)
 * activity charts. `startPercent` is captured when the user picks today's
 * categories; `endPercent` updates every time a note's progress changes.
 */
export type DailySnapshot = {
  /** YYYY-MM-DD in local time (see `lib/dates.ts`). */
  date: string;
  startPercent: number;
  endPercent: number;
  /** Count of note updates that touched today's snapshot. */
  notesTouched: number;
  /** Optional free-text reflection captured in the Evening Review modal. */
  reflection?: string;
};

/**
 * A habit on the dedicated habit-tracker tab. `ticks` is a sparse map of
 * date keys (YYYY-MM-DD) to `true` — entries are deleted when un-ticked so
 * the object stays small.
 */
export type Habit = {
  id: string;
  name: string;
  /** 1..5 — same scale as Note.weight; reserved for future weighted habit math. */
  weight: number;
  ticks: Record<string, boolean>;
};

/** Persisted UI preferences for the notes view. */
export type ViewPrefs = {
  view: 'card' | 'list';
  minimalist: boolean;
  /** Visible note count when `minimalist` is true. */
  minN: number;
};

/** Top-level ToBoo state — the single thing serialized to localStorage. */
export type ToBooState = {
  schemaVersion: 2;
  verticals: Vertical[];
  notes: Note[];
  categories: Category[];
  todaysCategoryIds: string[];
  todaysPickedAt: number | null;
  /** Sorted ascending by date; trimmed to the last 400 entries. */
  dailyHistory: DailySnapshot[];
  /** Percent threshold (default 10) used by {@link computeStreak}. */
  streakThreshold: number;
  habits: Habit[];
  viewPrefs: ViewPrefs;
};
