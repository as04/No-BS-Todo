import { useState } from 'react';
import { useToBooStore } from '../store/useToBooStore';
import { CategoryChip } from './CategoryChip';

type Props = {
  /** Fires after the user submits OR explicitly skips the picker. */
  onDone: () => void;
};

/**
 * Once-per-day gate that asks "what's on your plate today?" and writes the
 * selected category ids into the store. Skipped automatically if the user
 * has already picked today, dismissed it for this session, or has no
 * categories at all.
 */
export function MorningPicker({ onDone }: Props) {
  const categories = useToBooStore((s) => s.categories);
  const pick = useToBooStore((s) => s.pickTodaysCategories);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]
    );
  };

  const submit = () => {
    if (selected.length === 0) return;
    pick(selected);
    onDone();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center space-y-8">
        <div>
          <p className="text-sm text-ink/60">good morning</p>
          <h1 className="font-hand text-5xl mt-1">what's on your plate today?</h1>
          <p className="text-ink/60 mt-3 text-sm">
            pick the categories you want to focus on. you can change later.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {categories.length === 0 && (
            <p className="text-ink/50 text-sm">
              No categories yet — close this and add one first.
            </p>
          )}
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              category={c}
              selected={selected.includes(c.id)}
              onClick={() => toggle(c.id)}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-ink/50 hover:text-ink underline underline-offset-4"
          >
            skip
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={selected.length === 0}
            className="px-5 py-2 rounded-full bg-ink text-paper text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/80"
          >
            let's go →
          </button>
        </div>
      </div>
    </div>
  );
}
