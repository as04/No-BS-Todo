export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type ProgressMode =
  | { kind: 'checklist'; items: ChecklistItem[] }
  | { kind: 'bulk'; unitLabel: string; total: number; current: number };

export type NoteStatus = 'todo' | 'doing' | 'done';

/**
 * A single sticky note. `categoryId` may be `null` for an uncategorized note
 * (renders with a neutral gray dot and is excluded from today's-focus filtering
 * unless "show all" is on).
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
};

export type StickyColor =
  | 'yellow'
  | 'pink'
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'gray';

export type Vertical = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
  color: StickyColor;
  verticalId: string;
};

export type DailySnapshot = {
  date: string; // YYYY-MM-DD (local)
  startPercent: number; // weighted % of today's picked notes at start of day
  endPercent: number; // weighted % at most recent update
  notesTouched: number; // count of distinct notes whose progress changed today
  reflection?: string; // filled by Evening Review (Phase 2.4)
};

export type Habit = {
  id: string;
  name: string;
  weight: number; // 1..5
  ticks: Record<string, boolean>; // dateKey -> ticked
};

export type ViewPrefs = {
  view: 'card' | 'list';
  minimalist: boolean;
  minN: number;
};

export type ToBooState = {
  schemaVersion: 2;
  verticals: Vertical[];
  notes: Note[];
  categories: Category[];
  todaysCategoryIds: string[];
  todaysPickedAt: number | null;
  dailyHistory: DailySnapshot[]; // sorted ascending by date; trimmed to last 400
  streakThreshold: number; // percent — default 10
  habits: Habit[];
  viewPrefs: ViewPrefs;
};
