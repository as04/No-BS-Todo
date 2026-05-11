import { useMemo, useState } from 'react';
import { useToBooStore } from '../store/useToBooStore';
import { localDateKey } from '../lib/dates';
import { ProgressRing } from './ProgressRing';

type Props = { onClose: () => void };

export function EveningReview({ onClose }: Props) {
  const notes = useToBooStore((s) => s.notes);
  const categories = useToBooStore((s) => s.categories);
  const dailyHistory = useToBooStore((s) => s.dailyHistory);
  const setReflection = useToBooStore((s) => s.setReflection);

  const today = localDateKey();
  const snap = useMemo(
    () => dailyHistory.find((h) => h.date === today),
    [dailyHistory, today]
  );

  const todaysWork = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const ts = startOfDay.getTime();
    return notes
      .filter((n) => n.updatedAt >= ts)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes]);

  const [text, setText] = useState(snap?.reflection ?? '');
  const [saved, setSaved] = useState(false);

  const save = () => {
    setReflection(text);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const catName = (id: string | null): string => {
    if (!id) return 'uncategorized';
    return categories.find((c) => c.id === id)?.name ?? '—';
  };

  const delta = snap ? snap.endPercent - snap.startPercent : 0;

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-lg w-full space-y-5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-hand text-3xl">how was today?</h2>
        <button onClick={onClose} className="text-sm text-ink/60 hover:text-ink">
          ✕
        </button>
      </div>

      <div className="flex items-center gap-4">
        <ProgressRing percent={snap?.endPercent ?? 0} size={72} stroke={7} />
        <div className="text-sm">
          <p className="text-ink/70">
            started at <strong>{snap?.startPercent ?? 0}%</strong>, now at{' '}
            <strong>{snap?.endPercent ?? 0}%</strong>.
          </p>
          <p className="text-ink/70">
            {delta > 0
              ? `+${delta}% gained · ${snap?.notesTouched ?? 0} updates`
              : delta < 0
                ? `${delta}% (notes added or expanded)`
                : 'no change yet today'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-ink/80">what you touched</h3>
        {todaysWork.length === 0 ? (
          <p className="text-sm text-ink/40 italic">
            no notes updated today yet.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {todaysWork.slice(0, 10).map((n) => (
              <li
                key={n.id}
                className="flex items-baseline gap-2 border-b border-black/5 pb-1"
              >
                <span className="text-ink/40 text-xs w-14">
                  {n.status === 'done'
                    ? '✓ done'
                    : n.status === 'doing'
                      ? 'doing'
                      : 'to do'}
                </span>
                <span className="flex-1">{n.title}</span>
                <span className="text-xs text-ink/40">{catName(n.categoryId)}</span>
              </li>
            ))}
            {todaysWork.length > 10 && (
              <li className="text-xs text-ink/40 italic">
                …and {todaysWork.length - 10} more.
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-ink/80">reflection</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="what worked? what didn't? one thing you want to carry into tomorrow…"
          className="w-full text-sm bg-paper rounded p-2 border border-black/10 focus:outline-none focus:border-black/40 resize-none"
        />
        <div className="flex justify-end items-center gap-2">
          {saved && <span className="text-xs text-green-700">saved</span>}
          <button
            onClick={save}
            className="text-sm px-4 py-1.5 rounded bg-ink text-paper hover:bg-ink/80"
          >
            save reflection
          </button>
        </div>
      </div>
    </div>
  );
}
