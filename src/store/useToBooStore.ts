import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  Category,
  ChecklistItem,
  Habit,
  Note,
  ProgressMode,
  StickyColor,
  ToBooState,
  Vertical,
} from '../types';
import { loadState, saveState, freshVerticals } from '../lib/storage';
import { deriveStatus, weightedProgress } from '../lib/progress';
import { localDateKey } from '../lib/dates';
import { seedHabits } from '../lib/habits';
import type { DailySnapshot } from '../types';

type Actions = {
  setReflection: (text: string) => void;
  setStreakThreshold: (n: number) => void;

  addVertical: (name: string) => void;
  updateVertical: (id: string, patch: Partial<Omit<Vertical, 'id'>>) => void;
  deleteVertical: (id: string) => void;

  addCategory: (name: string, color: StickyColor, verticalId: string) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;

  addNote: (input: {
    title: string;
    categoryId: string | null;
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

  addHabit: (name: string, weight?: number) => void;
  updateHabit: (id: string, patch: Partial<Omit<Habit, 'id' | 'ticks'>>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitTick: (id: string, dateKey: string) => void;

  setViewPrefs: (patch: Partial<ToBooState['viewPrefs']>) => void;
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
    dailyHistory: [],
    streakThreshold: 10,
    habits: seedHabits(),
    viewPrefs: { view: 'card', minimalist: false, minN: 5 },
  };
};

const initial: ToBooState = loadState() ?? seed();

export const useToBooStore = create<Store>((set, get) => {
  const persist = () => {
    const {
      verticals,
      notes,
      categories,
      todaysCategoryIds,
      todaysPickedAt,
      dailyHistory,
      streakThreshold,
      habits,
      viewPrefs,
    } = get();
    saveState({
      schemaVersion: 2,
      verticals,
      notes,
      categories,
      todaysCategoryIds,
      todaysPickedAt,
      dailyHistory,
      streakThreshold,
      habits,
      viewPrefs,
    });
  };

  /** Notes that belong to today's picked categories (uncategorized ones excluded). */
  const todaysNotesFor = (state: ToBooState): Note[] =>
    state.todaysCategoryIds.length === 0
      ? state.notes
      : state.notes.filter(
          (n) =>
            n.categoryId !== null &&
            state.todaysCategoryIds.includes(n.categoryId)
        );

  const touchTodaysSnapshot = () => {
    set((s) => {
      const date = localDateKey();
      const pct = weightedProgress(todaysNotesFor(s));
      const existingIdx = s.dailyHistory.findIndex((h) => h.date === date);
      let history = s.dailyHistory;
      if (existingIdx === -1) {
        const fresh: DailySnapshot = {
          date,
          startPercent: pct,
          endPercent: pct,
          notesTouched: 1,
        };
        history = [...history, fresh];
      } else {
        const existing = history[existingIdx];
        const updated: DailySnapshot = {
          ...existing,
          endPercent: pct,
          notesTouched: existing.notesTouched + 1,
        };
        history = history.map((h, i) => (i === existingIdx ? updated : h));
      }
      // Bound history to last 400 entries (a bit over a year).
      if (history.length > 400) history = history.slice(history.length - 400);
      return { dailyHistory: history };
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
    // Only progress/weight changes affect the score; trigger snapshot for all
    // updateNote calls (cheap) — non-progress patches just re-stamp endPercent.
    touchTodaysSnapshot();
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
      // Notes lose their category but survive (become uncategorized) so the
      // user doesn't lose work when reorganising verticals.
      set((s) => ({
        verticals: s.verticals.filter((v) => v.id !== id),
        categories: s.categories.filter((c) => c.verticalId !== id),
        notes: s.notes.map((n) =>
          n.categoryId && catIds.has(n.categoryId) ? { ...n, categoryId: null } : n
        ),
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
      // Notes in this category survive as uncategorized rather than being deleted.
      set((s) => ({
        categories: s.categories.filter((c) => c.id !== id),
        notes: s.notes.map((n) =>
          n.categoryId === id ? { ...n, categoryId: null } : n
        ),
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
      // Stamp a snapshot for today's start state.
      set((s) => {
        const date = localDateKey();
        if (s.dailyHistory.some((h) => h.date === date)) return s;
        const pct = weightedProgress(todaysNotesFor(s));
        const fresh: DailySnapshot = {
          date,
          startPercent: pct,
          endPercent: pct,
          notesTouched: 0,
        };
        return { dailyHistory: [...s.dailyHistory, fresh] };
      });
      persist();
    },

    resetTodaysPick: () => {
      set({ todaysCategoryIds: [], todaysPickedAt: null });
      persist();
    },

    setReflection: (text) => {
      set((s) => {
        const date = localDateKey();
        const idx = s.dailyHistory.findIndex((h) => h.date === date);
        if (idx === -1) {
          const pct = weightedProgress(todaysNotesFor(s));
          return {
            dailyHistory: [
              ...s.dailyHistory,
              {
                date,
                startPercent: pct,
                endPercent: pct,
                notesTouched: 0,
                reflection: text,
              },
            ],
          };
        }
        const next = s.dailyHistory.map((h, i) =>
          i === idx ? { ...h, reflection: text } : h
        );
        return { dailyHistory: next };
      });
      persist();
    },

    setStreakThreshold: (n) => {
      set({ streakThreshold: Math.max(0, Math.min(100, n)) });
      persist();
    },

    addHabit: (name, weight = 3) => {
      set((s) => ({
        habits: [...s.habits, { id: nanoid(), name, weight, ticks: {} }],
      }));
      persist();
    },

    updateHabit: (id, patch) => {
      set((s) => ({
        habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      }));
      persist();
    },

    deleteHabit: (id) => {
      set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
      persist();
    },

    toggleHabitTick: (id, dateKey) => {
      set((s) => ({
        habits: s.habits.map((h) => {
          if (h.id !== id) return h;
          const next = { ...h.ticks };
          if (next[dateKey]) delete next[dateKey];
          else next[dateKey] = true;
          return { ...h, ticks: next };
        }),
      }));
      persist();
    },

    setViewPrefs: (patch) => {
      set((s) => ({ viewPrefs: { ...s.viewPrefs, ...patch } }));
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
