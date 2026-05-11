import { useMemo, useState } from 'react';
import { useToBooStore, isSameLocalDay } from './store/useToBooStore';
import { MorningPicker } from './components/MorningPicker';
import { NoteGrid } from './components/NoteGrid';
import { AddNoteForm } from './components/AddNoteForm';
import { CategoryManager } from './components/CategoryManager';
import { ProgressRing } from './components/ProgressRing';
import { sortByInProgressFirst, weightedProgress } from './lib/progress';

export default function App() {
  const notes = useToBooStore((s) => s.notes);
  const categories = useToBooStore((s) => s.categories);
  const todaysCategoryIds = useToBooStore((s) => s.todaysCategoryIds);
  const todaysPickedAt = useToBooStore((s) => s.todaysPickedAt);
  const resetTodaysPick = useToBooStore((s) => s.resetTodaysPick);

  const [showAddNote, setShowAddNote] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [pickerDismissed, setPickerDismissed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const pickedToday =
    todaysPickedAt != null && isSameLocalDay(todaysPickedAt, Date.now());

  const showPicker =
    !pickedToday && !pickerDismissed && categories.length > 0;

  const todaysNotes = useMemo(
    () =>
      todaysCategoryIds.length === 0
        ? notes
        : notes.filter((n) => todaysCategoryIds.includes(n.categoryId)),
    [notes, todaysCategoryIds]
  );

  const todaysProgress = useMemo(() => weightedProgress(todaysNotes), [todaysNotes]);

  const visibleNotes = useMemo(() => {
    const filtered = showAll ? notes : todaysNotes;
    const active = filtered.filter((n) => n.status !== 'done');
    return sortByInProgressFirst(active);
  }, [notes, todaysNotes, showAll]);

  if (showPicker) {
    return <MorningPicker onDone={() => setPickerDismissed(true)} />;
  }

  const todaysCategories = categories.filter((c) =>
    todaysCategoryIds.includes(c.id)
  );

  return (
    <div className="min-h-screen">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <ProgressRing percent={todaysProgress} label={`${todaysProgress}% across today's notes`} />
          <div>
            <h1 className="font-hand text-4xl leading-none">ToBoo</h1>
            {todaysCategories.length > 0 && !showAll && (
              <p className="text-xs text-ink/60 mt-1">
                today's focus: {todaysCategories.map((c) => c.name).join(' · ')}
                <button
                  onClick={() => {
                    resetTodaysPick();
                    setPickerDismissed(false);
                  }}
                  className="ml-2 underline hover:text-ink"
                >
                  change
                </button>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-full border border-black/10 bg-white/60 hover:bg-white"
          >
            {showAll ? 'today only' : 'show all'}
          </button>
          <button
            onClick={() => setShowCategories(true)}
            className="text-xs px-3 py-1.5 rounded-full border border-black/10 bg-white/60 hover:bg-white"
          >
            categories
          </button>
          <button
            onClick={() => setShowAddNote(true)}
            className="text-xs px-3 py-1.5 rounded-full bg-ink text-paper hover:bg-ink/80"
          >
            + note
          </button>
        </div>
      </header>

      <main className="px-6 pb-24 max-w-6xl mx-auto">
        <NoteGrid notes={visibleNotes} categories={categories} />
      </main>

      {(showAddNote || showCategories) && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-10"
          onClick={() => {
            setShowAddNote(false);
            setShowCategories(false);
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {showAddNote && <AddNoteForm onClose={() => setShowAddNote(false)} />}
            {showCategories && (
              <CategoryManager onClose={() => setShowCategories(false)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
