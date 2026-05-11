import { useMemo, useState } from 'react';
import { useToBooStore, isSameLocalDay } from './store/useToBooStore';
import { MorningPicker } from './components/MorningPicker';
import { NoteGrid } from './components/NoteGrid';
import { AddNoteForm } from './components/AddNoteForm';
import { CategoryManager } from './components/CategoryManager';
import { DataModal } from './components/DataModal';
import { EveningReview } from './components/EveningReview';
import { HabitTracker } from './components/HabitTracker';
import { HistoryView } from './components/HistoryView';
import { FilterBar } from './components/FilterBar';
import { ProgressRing } from './components/ProgressRing';
import { sortByInProgressFirst, weightedProgress } from './lib/progress';
import { computeStreak } from './lib/streak';

/**
 * App shell. Responsibilities:
 * - gate the UI behind the once-per-day Morning Picker
 * - render header (ring + streak + tabs + filter/view/category/add buttons)
 * - swap between the Notes feed and the Habit Tracker tab
 * - host the filter bar and all top-level modals (AddNoteForm,
 *   CategoryManager, EveningReview)
 *
 * All persistent state is in the Zustand store; only UI-local toggles
 * (modals, picker dismissed, filter draft) live here.
 */
export default function App() {
  const notes = useToBooStore((s) => s.notes);
  const categories = useToBooStore((s) => s.categories);
  const todaysCategoryIds = useToBooStore((s) => s.todaysCategoryIds);
  const todaysPickedAt = useToBooStore((s) => s.todaysPickedAt);
  const resetTodaysPick = useToBooStore((s) => s.resetTodaysPick);
  const dailyHistory = useToBooStore((s) => s.dailyHistory);
  const streakThreshold = useToBooStore((s) => s.streakThreshold);
  const setStreakThreshold = useToBooStore((s) => s.setStreakThreshold);
  const viewPrefs = useToBooStore((s) => s.viewPrefs);
  const setViewPrefs = useToBooStore((s) => s.setViewPrefs);

  const [showAddNote, setShowAddNote] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showEveningReview, setShowEveningReview] = useState(false);
  const [showData, setShowData] = useState(false);
  const [pickerDismissed, setPickerDismissed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [tab, setTab] = useState<'notes' | 'habits' | 'done'>('notes');
  const [showFilter, setShowFilter] = useState(false);
  const [filterCategoryIds, setFilterCategoryIds] = useState<Set<string>>(
    new Set()
  );
  const [includeUncategorized, setIncludeUncategorized] = useState(false);
  const filterActive = filterCategoryIds.size > 0 || includeUncategorized;

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
    let filtered = showAll ? notes : todaysNotes;
    if (filterActive) {
      filtered = filtered.filter((n) =>
        n.categoryId === null
          ? includeUncategorized
          : filterCategoryIds.has(n.categoryId)
      );
    }
    const active = filtered.filter((n) => n.status !== 'done');
    const sorted = sortByInProgressFirst(active);
    return viewPrefs.minimalist ? sorted.slice(0, viewPrefs.minN) : sorted;
  }, [
    notes,
    todaysNotes,
    showAll,
    filterActive,
    filterCategoryIds,
    includeUncategorized,
    viewPrefs.minimalist,
    viewPrefs.minN,
  ]);

  const filterCount =
    filterCategoryIds.size + (includeUncategorized ? 1 : 0);

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
          <ProgressRing
            percent={todaysProgress}
            label={`${todaysProgress}% — weighted average of today's notes (high-weight notes count more)`}
          />
          <div>
            <button
              type="button"
              onClick={() => {
                // Logo click takes you back to the "main page" — the morning
                // category picker. From the picker you can pick a new focus
                // or hit "skip" to drop into whatever tab was open.
                resetTodaysPick();
                setPickerDismissed(false);
                setTab('notes');
              }}
              className="font-hand text-4xl leading-none hover:opacity-80 transition"
              title="back to the morning picker"
            >
              ToBoo
            </button>
            {categories.length > 0 && (
              <p className="text-xs text-ink/60 mt-1">
                {todaysCategories.length > 0 && !showAll ? (
                  <>today's focus: {todaysCategories.map((c) => c.name).join(' · ')}</>
                ) : showAll ? (
                  <>showing all categories</>
                ) : (
                  <>no focus picked for today</>
                )}
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
            <button
              onClick={() => setTab('done')}
              className={`text-xs px-3 py-1 rounded-full transition ${
                tab === 'done' ? 'bg-ink text-paper' : 'text-ink/70 hover:text-ink'
              }`}
            >
              done
            </button>
          </div>
          {streak > 0 && (
            <button
              onClick={() => {
                const next = prompt(
                  `Streak counts consecutive days where your daily progress ring reaches at least N%. Current N = ${streakThreshold}.\n\nSet a new threshold (0-100):`,
                  String(streakThreshold)
                );
                if (next === null) return;
                const n = parseInt(next, 10);
                if (!isNaN(n)) setStreakThreshold(n);
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-700 hover:bg-orange-200"
              title={`🔥 ${streak} day${streak === 1 ? '' : 's'} in a row above ${streakThreshold}%. Click to change the threshold.`}
            >
              🔥 {streak}
            </button>
          )}
          {tab === 'notes' && (
            <>
              <button
                onClick={() => setShowFilter((v) => !v)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  filterActive || showFilter
                    ? 'bg-ink text-paper border-ink'
                    : 'border-black/10 bg-white/60 hover:bg-white'
                }`}
                title="filter notes by vertical/category"
              >
                {filterActive ? `filter · ${filterCount}` : 'filter'}
              </button>
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
          <button
            onClick={() => setShowData(true)}
            className="text-xs px-3 py-1.5 rounded-full border border-black/10 bg-white/60 hover:bg-white"
            title="Export / import your data"
          >
            data
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

      {tab === 'notes' && showFilter && (
        <FilterBar
          selectedCategoryIds={filterCategoryIds}
          includeUncategorized={includeUncategorized}
          onCategoryIdsChange={setFilterCategoryIds}
          onIncludeUncategorizedChange={setIncludeUncategorized}
          onClose={() => setShowFilter(false)}
        />
      )}

      <main className="pb-24 max-w-6xl mx-auto pt-2">
        {tab === 'notes' && (
          <div className="px-6">
            <NoteGrid
              notes={visibleNotes}
              categories={categories}
              view={viewPrefs.view}
            />
          </div>
        )}
        {tab === 'habits' && <HabitTracker />}
        {tab === 'done' && <HistoryView />}
      </main>

      {(showAddNote || showCategories || showEveningReview || showData) && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-10"
          onClick={() => {
            setShowAddNote(false);
            setShowCategories(false);
            setShowEveningReview(false);
            setShowData(false);
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
            {showData && <DataModal onClose={() => setShowData(false)} />}
          </div>
        </div>
      )}
    </div>
  );
}
