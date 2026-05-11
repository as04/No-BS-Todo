import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  Category,
  ChecklistItem,
  Note,
  ProgressMode,
  StickyColor,
  ToBooState,
  Vertical,
} from '../types';
import { loadState, saveState, freshVerticals } from '../lib/storage';
import { deriveStatus } from '../lib/progress';

type Actions = {
  addVertical: (name: string) => void;
  updateVertical: (id: string, patch: Partial<Omit<Vertical, 'id'>>) => void;
  deleteVertical: (id: string) => void;

  addCategory: (name: string, color: StickyColor, verticalId: string) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;

  addNote: (input: {
    title: string;
    categoryId: string;
    body?: string;
    progress: ProgressMode;
    weight?: number;
  }) => void;
  updateNote: (id: string, patch: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;

  toggleChecklistItem: (noteId: string, itemId: string) => void;
  addChecklistItem: (noteId: string, text: string) => void;
  removeChecklistItem: (noteId: string, itemId: string) => void;
  setBulkCurrent: (noteId: string, current: number) => void;

  pickTodaysCategories: (ids: string[]) => void;
  resetTodaysPick: () => void;
};

type Store = ToBooState & Actions;

const seed = (): ToBooState => {
  const verticals = freshVerticals();
  const cats: Category[] = [
    { id: nanoid(), name: 'Reading', color: 'yellow', verticalId: verticals[2].id },
    { id: nanoid(), name: 'Workout', color: 'green', verticalId: verticals[1].id },
    { id: nanoid(), name: 'Savings', color: 'blue', verticalId: verticals[0].id },
  ];
  return {
    schemaVersion: 2,
    verticals,
    categories: cats,
    notes: [],
    todaysCategoryIds: [],
    todaysPickedAt: null,
  };
};

const initial: ToBooState = loadState() ?? seed();

export const useToBooStore = create<Store>((set, get) => {
  const persist = () => {
    const { verticals, notes, categories, todaysCategoryIds, todaysPickedAt } = get();
    saveState({
      schemaVersion: 2,
      verticals,
      notes,
      categories,
      todaysCategoryIds,
      todaysPickedAt,
    });
  };

  const updateNoteInternal = (id: string, patch: Partial<Note>) => {
    set((s) => ({
      notes: s.notes.map((n) => {
        if (n.id !== id) return n;
        const merged = { ...n, ...patch, updatedAt: Date.now() } as Note;
        merged.status = deriveStatus(merged.progress);
        return merged;
      }),
    }));
    persist();
  };

  return {
    ...initial,

    addVertical: (name) => {
      set((s) => ({
        verticals: [...s.verticals, { id: nanoid(), name }],
      }));
      persist();
    },

    updateVertical: (id, patch) => {
      set((s) => ({
        verticals: s.verticals.map((v) =>
          v.id === id ? { ...v, ...patch } : v
        ),
      }));
      persist();
    },

    deleteVertical: (id) => {
      const cats = get().categories.filter((c) => c.verticalId === id);
      const catIds = new Set(cats.map((c) => c.id));
      set((s) => ({
        verticals: s.verticals.filter((v) => v.id !== id),
        categories: s.categories.filter((c) => c.verticalId !== id),
        notes: s.notes.filter((n) => !catIds.has(n.categoryId)),
        todaysCategoryIds: s.todaysCategoryIds.filter((cid) => !catIds.has(cid)),
      }));
      persist();
    },

    addCategory: (name, color, verticalId) => {
      set((s) => ({
        categories: [...s.categories, { id: nanoid(), name, color, verticalId }],
      }));
      persist();
    },

    updateCategory: (id, patch) => {
      set((s) => ({
        categories: s.categories.map((c) =>
          c.id === id ? { ...c, ...patch } : c
        ),
      }));
      persist();
    },

    deleteCategory: (id) => {
      set((s) => ({
        categories: s.categories.filter((c) => c.id !== id),
        notes: s.notes.filter((n) => n.categoryId !== id),
        todaysCategoryIds: s.todaysCategoryIds.filter((cid) => cid !== id),
      }));
      persist();
    },

    addNote: ({ title, categoryId, body, progress, weight }) => {
      const now = Date.now();
      const note: Note = {
        id: nanoid(),
        title,
        body,
        categoryId,
        progress,
        status: deriveStatus(progress),
        weight: weight ?? 3,
        createdAt: now,
        updatedAt: now,
      };
      set((s) => ({ notes: [note, ...s.notes] }));
      persist();
    },

    updateNote: (id, patch) => updateNoteInternal(id, patch),

    deleteNote: (id) => {
      set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
      persist();
    },

    toggleChecklistItem: (noteId, itemId) => {
      const note = get().notes.find((n) => n.id === noteId);
      if (!note || note.progress.kind !== 'checklist') return;
      const items = note.progress.items.map((i) =>
        i.id === itemId ? { ...i, done: !i.done } : i
      );
      updateNoteInternal(noteId, {
        progress: { kind: 'checklist', items },
      });
    },

    addChecklistItem: (noteId, text) => {
      const note = get().notes.find((n) => n.id === noteId);
      if (!note || note.progress.kind !== 'checklist') return;
      const item: ChecklistItem = { id: nanoid(), text, done: false };
      updateNoteInternal(noteId, {
        progress: { kind: 'checklist', items: [...note.progress.items, item] },
      });
    },

    removeChecklistItem: (noteId, itemId) => {
      const note = get().notes.find((n) => n.id === noteId);
      if (!note || note.progress.kind !== 'checklist') return;
      updateNoteInternal(noteId, {
        progress: {
          kind: 'checklist',
          items: note.progress.items.filter((i) => i.id !== itemId),
        },
      });
    },

    setBulkCurrent: (noteId, current) => {
      const note = get().notes.find((n) => n.id === noteId);
      if (!note || note.progress.kind !== 'bulk') return;
      const clamped = Math.max(0, Math.min(note.progress.total, current));
      updateNoteInternal(noteId, {
        progress: { ...note.progress, current: clamped },
      });
    },

    pickTodaysCategories: (ids) => {
      set({ todaysCategoryIds: ids, todaysPickedAt: Date.now() });
      persist();
    },

    resetTodaysPick: () => {
      set({ todaysCategoryIds: [], todaysPickedAt: null });
      persist();
    },
  };
});

export function isSameLocalDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
