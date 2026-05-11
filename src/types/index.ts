export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type ProgressMode =
  | { kind: 'checklist'; items: ChecklistItem[] }
  | { kind: 'bulk'; unitLabel: string; total: number; current: number };

export type NoteStatus = 'todo' | 'doing' | 'done';

export type Note = {
  id: string;
  title: string;
  body?: string;
  categoryId: string;
  progress: ProgressMode;
  status: NoteStatus;
  weight: number; // 1..5 — drives the daily progress ring
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

export type ToBooState = {
  schemaVersion: 2;
  verticals: Vertical[];
  notes: Note[];
  categories: Category[];
  todaysCategoryIds: string[];
  todaysPickedAt: number | null;
};
