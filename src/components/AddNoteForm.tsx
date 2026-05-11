import { useState } from 'react';
import { useToBooStore } from '../store/useToBooStore';
import type { ProgressMode, StickyColor } from '../types';
import { WeightPicker } from './WeightPicker';
import { ALL_COLORS, COLOR_DOT } from '../lib/colors';

type Props = { onClose: () => void };

const NONE_VALUE = '__none__';
const NEW_VALUE = '__new__';

/**
 * Modal for creating a new note. Supports:
 *  - picking an existing category, leaving as (none), or creating a new
 *    category inline (name + color + vertical) without leaving the form
 *  - selecting a progress mode (checklist OR bulk units with a unit label)
 *  - assigning a weight 1..5
 */
export function AddNoteForm({ onClose }: Props) {
  const categories = useToBooStore((s) => s.categories);
  const verticals = useToBooStore((s) => s.verticals);
  const addNote = useToBooStore((s) => s.addNote);
  const addCategory = useToBooStore((s) => s.addCategory);

  const [title, setTitle] = useState('');
  const [categoryValue, setCategoryValue] = useState<string>(
    categories[0]?.id ?? NONE_VALUE
  );
  const [mode, setMode] = useState<'checklist' | 'bulk'>('checklist');
  const [unitLabel, setUnitLabel] = useState('chapter');
  const [total, setTotal] = useState(10);
  const [weight, setWeight] = useState(3);

  // Inline new-category state.
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState<StickyColor>('yellow');
  const [newCatVerticalId, setNewCatVerticalId] = useState(
    verticals[0]?.id ?? ''
  );

  const isCreatingCategory = categoryValue === NEW_VALUE;
  const newCatReady =
    isCreatingCategory && newCatName.trim().length > 0 && newCatVerticalId;
  const canSubmit =
    title.trim().length > 0 &&
    (categoryValue !== NEW_VALUE || newCatReady);

  /** Resolve the final categoryId. If user is creating a new category, do it now. */
  const resolveCategoryId = (): string | null => {
    if (categoryValue === NONE_VALUE) return null;
    if (categoryValue === NEW_VALUE) {
      const t = newCatName.trim();
      if (!t || !newCatVerticalId) return null;
      addCategory(t, newCatColor, newCatVerticalId);
      // addCategory generates the id internally; grab the freshest one.
      const created = useToBooStore.getState().categories.find(
        (c) => c.name === t && c.verticalId === newCatVerticalId
      );
      return created?.id ?? null;
    }
    return categoryValue;
  };

  const submit = () => {
    if (!canSubmit) return;
    const progress: ProgressMode =
      mode === 'checklist'
        ? { kind: 'checklist', items: [] }
        : { kind: 'bulk', unitLabel, total, current: 0 };
    addNote({
      title: title.trim(),
      categoryId: resolveCategoryId(),
      progress,
      weight,
    });
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
        <select
          value={categoryValue}
          onChange={(e) => setCategoryValue(e.target.value)}
          className="w-full bg-paper rounded px-3 py-2 border border-black/10"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={NONE_VALUE}>(uncategorized)</option>
          <option value={NEW_VALUE}>+ new category…</option>
        </select>
      </div>

      {isCreatingCategory && (
        <div className="rounded border border-dashed border-black/20 bg-paper/60 p-3 space-y-2">
          <p className="text-xs text-ink/60">create a new category</p>
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="e.g. Brilliant"
            className="w-full bg-white rounded px-2 py-1 text-sm border border-black/10"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              {ALL_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setNewCatColor(col)}
                  className={`w-4 h-4 rounded-full ${COLOR_DOT[col]} ${
                    newCatColor === col ? 'ring-2 ring-ink' : ''
                  }`}
                  aria-label={`pick ${col}`}
                />
              ))}
            </div>
            <select
              value={newCatVerticalId}
              onChange={(e) => setNewCatVerticalId(e.target.value)}
              className="text-xs bg-white rounded px-2 py-1 border border-black/10 ml-auto"
            >
              {verticals.map((vv) => (
                <option key={vv.id} value={vv.id}>
                  {vv.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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
