import { useMemo } from 'react';
import { useToBooStore } from '../store/useToBooStore';
import { localDateKey } from '../lib/dates';
import { COLOR_DOT } from '../lib/colors';
import { CalendarHeatmap } from './CalendarHeatmap';
import type { Note, DailySnapshot } from '../types';

type DayBucket = {
  date: string;
  snap?: DailySnapshot;
  done: Note[];
};

/**
 * Past-activity view. For each day with either a snapshot or a completed
 * note, we render one card showing:
 *  - the day label (Today / Yesterday / weekday + date)
 *  - start → end weighted % and notes-touched count (if a snapshot exists)
 *  - the reflection text if the user wrote one in Evening Review
 *  - the notes completed on that day, with their final category
 *
 * Cards are listed most-recent first. Empty state when there's no history.
 */
export function HistoryView() {
  const dailyHistory = useToBooStore((s) => s.dailyHistory);
  const notes = useToBooStore((s) => s.notes);
  const categories = useToBooStore((s) => s.categories);

  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const totalUpdates = useMemo(
    () => dailyHistory.reduce((acc, s) => acc + s.notesTouched, 0),
    [dailyHistory]
  );

  const activeDays = useMemo(
    () => dailyHistory.filter((s) => s.notesTouched > 0).length,
    [dailyHistory]
  );

  const buckets = useMemo<DayBucket[]>(() => {
    const map = new Map<string, DayBucket>();
    for (const snap of dailyHistory) {
      map.set(snap.date, { date: snap.date, snap, done: [] });
    }
    for (const n of notes) {
      if (n.status !== 'done' || !n.completedAt) continue;
      const key = localDateKey(n.completedAt);
      const existing = map.get(key);
      if (existing) existing.done.push(n);
      else map.set(key, { date: key, done: [n] });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.date < b.date ? 1 : -1
    );
  }, [dailyHistory, notes]);

  return (
    <div className="max-w-3xl mx-auto px-6 pb-24 space-y-4">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-hand text-3xl">what you got done</h2>
          <p className="text-xs text-ink/60 mt-1">
            finished notes, past reflections, and how busy you've been —
            newest first
          </p>
        </div>
      </header>

      <div className="bg-white/70 rounded-lg p-4 shadow-sticky space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-hand text-lg leading-none">
            how busy you've been
          </h3>
          <p className="text-xs text-ink/60 whitespace-nowrap">
            <strong>{totalUpdates}</strong> updates ·{' '}
            <strong>{activeDays}</strong> active day
            {activeDays === 1 ? '' : 's'}
          </p>
        </div>
        <CalendarHeatmap history={dailyHistory} weeks={52} />
        <div className="flex items-center justify-between text-xs text-ink/50">
          <span>
            each square = one day, darker = more note interactions
          </span>
          <span className="inline-flex items-center gap-1">
            less
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-black/10" />
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-ink/25" />
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-ink/45" />
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-ink/65" />
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-ink/85" />
            more
          </span>
        </div>
      </div>

      {buckets.length === 0 ? (
        <div className="text-center py-12 text-ink/50">
          <p className="font-hand text-xl">no entries yet</p>
          <p className="text-sm mt-1">
            finish a task or save an evening reflection — they'll show up here.
          </p>
        </div>
      ) : (
        buckets.map((b) => (
          <DayCard key={b.date} bucket={b} catById={catById} />
        ))
      )}
    </div>
  );
}

/**
 * Human-readable label for a date key: "Today", "Yesterday", or a
 * locale-formatted weekday + date.
 */
function dayLabel(dateKey: string): string {
  const today = localDateKey();
  if (dateKey === today) return 'Today';
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (localDateKey(yesterday.getTime()) === dateKey) return 'Yesterday';

  return dt.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function DayCard({
  bucket,
  catById,
}: {
  bucket: DayBucket;
  catById: Map<string, { name: string; color: keyof typeof COLOR_DOT }>;
}) {
  const { date, snap, done } = bucket;
  const delta = snap ? snap.endPercent - snap.startPercent : null;

  return (
    <div className="bg-white/70 rounded-lg p-4 space-y-3 shadow-sticky">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-hand text-xl">{dayLabel(date)}</h3>
        {snap && (
          <span className="text-xs text-ink/60 whitespace-nowrap">
            <strong>{snap.endPercent}%</strong>
            {delta !== null && delta !== 0 && (
              <span
                className={
                  delta > 0 ? 'text-green-700 ml-1' : 'text-orange-700 ml-1'
                }
              >
                ({delta > 0 ? '+' : ''}
                {delta}%)
              </span>
            )}
            {' · '}
            {snap.notesTouched} updates
          </span>
        )}
      </div>

      {snap?.reflection && (
        <p className="text-sm text-ink/80 italic border-l-2 border-black/10 pl-3 whitespace-pre-wrap">
          {snap.reflection}
        </p>
      )}

      {done.length > 0 && (
        <div>
          <p className="text-xs text-ink/50 mb-1.5">
            ✓ finished {done.length} {done.length === 1 ? 'note' : 'notes'}
          </p>
          <ul className="space-y-1">
            {done.map((n) => {
              const cat = n.categoryId ? catById.get(n.categoryId) : undefined;
              return (
                <li
                  key={n.id}
                  className="flex items-center gap-2 text-sm bg-paper/60 rounded px-2 py-1"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      cat ? COLOR_DOT[cat.color] : 'bg-gray-300'
                    }`}
                  />
                  <span className="line-through text-ink/70 flex-1 truncate">
                    {n.title}
                  </span>
                  <span className="text-xs text-ink/40 whitespace-nowrap">
                    {cat?.name ?? 'uncategorized'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
