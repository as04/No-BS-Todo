import { useMemo, useState } from 'react';
import { useToBooStore, isSameLocalDay } from './store/useToBooStore';
import { MorningPicker } from './components/MorningPicker';
import { NoteGrid } from './components/NoteGrid';
import { AddNoteForm } from './components/AddNoteForm';
import { CategoryManager } from './components/CategoryManager';
import { EveningReview } from './components/EveningReview';
import { HabitTracker } from './components/HabitTracker';
import { ProgressRing } from './components/ProgressRing';
import { sortByInProgressFirst, weightedProgress } from './lib/progress';
import { computeStreak } from './lib/streak';

export default function App() {
  const notes = useToBooStore((s) => s.notes);
  const categories = useToBooStore((s) => s.categories);
  const todaysCategoryIds = useToBooStore((s) => s.todaysCategoryIds);
  const todaysPickedAt = useToBooStore((s) => s.todaysPickedAt);
  const resetTodaysPick = useToBooStore((s) => s.resetTodaysPick);
  const dailyHistory = useToBooStore((s) => s.dailyHistory);
  const streakThreshold = useToBooStore((s) => s.streakThreshold);
  const viewPrefs = useToBooStore((s) => s.viewPrefs);
  const setViewPrefs = useToBooStore((s) => s.setViewPrefs);

  const [showAddNote, setShowAddNote] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showEveningReview, setShowEveningReview] = useState(false);
  const [pickerDismissed, setPickerDismissed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [tab, setTab] = useState<'notes' | 'habits'>('notes');

  const pickedToday =
    todaysPickedAt != null && isSameLocalDay(todaysPickedAt, Date.now());

  // With zero categories the picker has nothing to offer, so skip it and let
  // the user go straight to creating notes (the +note form now supports
  // inline category creation and an uncategorized fallback).
  const showPicker =
    !pickedToday && !pickerDismissed && categories.length > 0;

  const todaysNotes = useMemo(
    () =>
      todaysCategoryIds.length === 0
        ? notes
        : notes.filter(
            (n) => n.categoryId !== null && todaysCategoryIds.includes(n.categoryId)
          ),
    [notes, todaysCategoryIds]
  );

  const todaysProgress = useMemo(() => weightedProgress(todaysNotes), [todaysNotes]);
  const streak = useMemo(
    () => computeStreak(dailyHistory, streakThreshold),
    [dailyHistory, streakThreshold]
  );

  const visibleNotes = useMemo(() => {
    const filtered = showAll ? notes : todaysNotes;
    const active = filtered.filter((n) => n.status !== 'done');
    const sorted = sortByInProgressFirst(active);
    return viewPrefs.minimalist ? sorted.slice(0, viewPrefs.minN) : sorted;
  }, [notes, todaysNotes, showAll, viewPrefs.minimalist, viewPrefs.minN]);

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
          <div className="inline-flex bg-white/60 rounded-full p-0.5 mr-1 border border-black/10">
            <button
              onClick={() => setTab('notes')}
              className={`text-xs px-3 py-1 rounded-full transition ${
                tab === 'notes' ? 'bg-ink text-paper' : 'text-ink/70 hover:text-ink'
              }`}
            >
              notes
            </button>
            <button
              onClick={() => setTab('habits')}
              className={`text-xs px-3 py-1 rounded-full transition ${
                tab === 'habits' ? 'bg-ink text-paper' : 'text-ink/70 hover:text-ink'
              }`}
            >
              habits
            </button>
          </div>
          {streak > 0 && (
            <span
              className="text-xs px-3 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-700"
              title={`Streak: ${streak} day${streak === 1 ? '' : 's'} above ${streakThreshold}%`}
            >
              🔥 {streak}
            </span>
          )}
          {tab === 'notes' && (
            <>
              <div className="inline-flex bg-white/60 rounded-full p-0.5 border border-black/10">
                <button
                  onClick={() => setViewPrefs({ view: 'card' })}
                  className={`text-xs px-2.5 py-1 rounded-full transition ${
                    viewPrefs.view === 'card'
                      ? 'bg-ink text-paper'
                      : 'text-ink/70 hover:text-ink'
                  }`}
                  title="card view"
                >
                  ▦
                </button>
                <button
                  onClick={() => setViewPrefs({ view: 'list' })}
                  className={`text-xs px-2.5 py-1 rounded-full transition ${
                    viewPrefs.view === 'list'
                      ? 'bg-ink text-paper'
                      : 'text-ink/70 hover:text-ink'
                  }`}
                  title="list view"
                >
                  ☰
                </button>
              </div>
              <button
                onClick={() => setViewPrefs({ minimalist: !viewPrefs.minimalist })}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  viewPrefs.minimalist
                    ? 'bg-ink text-paper border-ink'
                    : 'border-black/10 bg-white/60 hover:bg-white'
                }`}
                title="show only the top N notes"
              >
                {viewPrefs.minimalist ? `min · top ${viewPrefs.minN}` : 'minimalist'}
              </button>
              {viewPrefs.minimalist && (
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={viewPrefs.minN}
                  onChange={(e) =>
                    setViewPrefs({
                      minN: Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)),
                    })
                  }
                  className="w-12 text-xs bg-white/60 border border-black/10 rounded px-1.5 py-1"
                  aria-label="minimalist count"
                />
              )}
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-xs px-3 py-1.5 rounded-full border border-black/10 bg-white/60 hover:bg-white"
              >
                {showAll ? 'today only' : 'show all'}
              </button>
            </>
          )}
          <button
            onClick={() => setShowEveningReview(true)}
            className="text-xs px-3 py-1.5 rounded-full border border-black/10 bg-white/60 hover:bg-white"
            title="Evening review"
          >
            🌙 review
          </button>
          {tab === 'notes' && (
            <>
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
            </>
          )}
        </div>
      </header>

      <main className="pb-24 max-w-6xl mx-auto">
        {tab === 'notes' ? (
          <div className="px-6">
            <NoteGrid
              notes={visibleNotes}
              categories={categories}
              view={viewPrefs.view}
            />
          </div>
        ) : (
          <HabitTracker />
        )}
      </main>

      {(showAddNote || showCategories || showEveningReview) && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-10"
          onClick={() => {
            setShowAddNote(false);
            setShowCategories(false);
            setShowEveningReview(false);
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {showAddNote && <AddNoteForm onClose={() => setShowAddNote(false)} />}
            {showCategories && (
              <CategoryManager onClose={() => setShowCategories(false)} />
            )}
            {showEveningReview && (
              <EveningReview onClose={() => setShowEveningReview(false)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
