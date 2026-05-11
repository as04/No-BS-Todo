import { useState } from 'react';
import { useToBooStore } from '../store/useToBooStore';
import type { ProgressMode } from '../types';
import { WeightPicker } from './WeightPicker';
import { CategoryPicker } from './CategoryPicker';

type Props = { onClose: () => void };

/**
 * Modal for creating a new note. Uses the shared CategoryPicker so the
 * user can pick an existing category, mark the note as uncategorized,
 * or create a new category inline. Lets the user pick a progress mode
 * (checklist OR bulk units) and assign a weight 1..5.
 */
export function AddNoteForm({ onClose }: Props) {
  const categories = useToBooStore((s) => s.categories);
  const addNote = useToBooStore((s) => s.addNote);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(
    categories[0]?.id ?? null
  );
  const [mode, setMode] = useState<'checklist' | 'bulk'>('checklist');
  const [unitLabel, setUnitLabel] = useState('chapter');
  const [total, setTotal] = useState(10);
  const [weight, setWeight] = useState(3);

  const canSubmit = title.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    const progress: ProgressMode =
      mode === 'checklist'
        ? { kind: 'checklist', items: [] }
        : { kind: 'bulk', unitLabel, total, current: 0 };
    addNote({ title: title.trim(), categoryId, progress, weight });
    onClose();
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full space-y-4 max-h-[85vh] overflow-y-auto">
      <h2 className="font-hand text-2xl">new note</h2>

      <div className="space-y-1.5">
        <label className="text-xs text-ink/60">Title</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Read Sapiens"
          className="w-full bg-paper rounded px-3 py-2 border border-black/10 focus:outline-none focus:border-black/40"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-ink/60">Category</label>
        <CategoryPicker value={categoryId} onChange={setCategoryId} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-ink/60">Progress mode</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('checklist')}
            className={`flex-1 text-sm py-2 rounded border ${
              mode === 'checklist'
                ? 'border-ink bg-ink text-paper'
                : 'border-black/10 bg-paper'
            }`}
          >
            Checklist
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`flex-1 text-sm py-2 rounded border ${
              mode === 'bulk'
                ? 'border-ink bg-ink text-paper'
                : 'border-black/10 bg-paper'
            }`}
          >
            Bulk (e.g. chapters)
          </button>
        </div>
      </div>

      {mode === 'bulk' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-ink/60">Unit</label>
            <input
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
              placeholder="chapter"
              className="w-full bg-paper rounded px-3 py-2 border border-black/10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-ink/60">Total</label>
            <input
              type="number"
              min={1}
              value={total}
              onChange={(e) => setTotal(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-paper rounded px-3 py-2 border border-black/10"
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs text-ink/60">Weight</label>
        <WeightPicker value={weight} onChange={setWeight} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="text-sm px-3 py-2 rounded hover:bg-black/5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="text-sm px-4 py-2 rounded bg-ink text-paper disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
