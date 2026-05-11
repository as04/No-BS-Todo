import { useState } from 'react';
import type { StickyColor } from '../types';
import { useToBooStore } from '../store/useToBooStore';
import { ALL_COLORS, COLOR_DOT } from '../lib/colors';

/** Sentinel value for the "(uncategorized)" option in the dropdown. */
const NONE_VALUE = '';
/** Sentinel value for the "+ new category…" option in the dropdown. */
const NEW_VALUE = '__new__';

type Props = {
  /** Current category id; `null` means uncategorized. */
  value: string | null;
  /** Called with the resolved category id (or `null`). */
  onChange: (id: string | null) => void;
  /** Visual size of the dropdown. */
  size?: 'sm' | 'md';
};

/**
 * Reusable category dropdown used in AddNoteForm and on every expanded
 * sticky note. Lets the user pick an existing category, mark a note as
 * uncategorized, or create a new category inline (name + color +
 * vertical) — newly-created categories are saved to the global store
 * immediately and become the selected value.
 */
export function CategoryPicker({ value, onChange, size = 'md' }: Props) {
  const categories = useToBooStore((s) => s.categories);
  const verticals = useToBooStore((s) => s.verticals);
  const addCategory = useToBooStore((s) => s.addCategory);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<StickyColor>('yellow');
  const [verticalId, setVerticalId] = useState<string>(
    verticals[0]?.id ?? ''
  );

  const handleSelect = (next: string) => {
    if (next === NEW_VALUE) {
      setCreating(true);
      return;
    }
    setCreating(false);
    onChange(next === NONE_VALUE ? null : next);
  };

  const commitNew = () => {
    const t = name.trim();
    if (!t || !verticalId) return;
    addCategory(t, color, verticalId);
    const created = useToBooStore
      .getState()
      .categories.find((c) => c.name === t && c.verticalId === verticalId);
    if (created) onChange(created.id);
    setName('');
    setCreating(false);
  };

  const cancelNew = () => {
    setName('');
    setCreating(false);
  };

  const selectValue = creating ? NEW_VALUE : (value ?? NONE_VALUE);
  const sizeClass =
    size === 'sm'
      ? 'text-xs px-2 py-1'
      : 'text-sm px-3 py-2';

  return (
    <div className="space-y-2">
      <select
        value={selectValue}
        onChange={(e) => handleSelect(e.target.value)}
        className={`w-full bg-paper rounded border border-black/10 ${sizeClass}`}
      >
        <option value={NONE_VALUE}>(uncategorized)</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
        <option value={NEW_VALUE}>+ new category…</option>
      </select>

      {creating && (
        <div className="rounded border border-dashed border-black/20 bg-paper/60 p-2 space-y-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitNew();
              if (e.key === 'Escape') cancelNew();
            }}
            placeholder="new category name"
            className="w-full bg-white rounded px-2 py-1 text-sm border border-black/10"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              {ALL_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColor(col)}
                  className={`w-4 h-4 rounded-full ${COLOR_DOT[col]} ${
                    color === col ? 'ring-2 ring-ink' : ''
                  }`}
                  aria-label={`pick ${col}`}
                />
              ))}
            </div>
            <select
              value={verticalId}
              onChange={(e) => setVerticalId(e.target.value)}
              className="text-xs bg-white rounded px-2 py-1 border border-black/10 ml-auto"
            >
              {verticals.map((vv) => (
                <option key={vv.id} value={vv.id}>
                  {vv.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={cancelNew}
              className="text-xs px-2 py-1 text-ink/60 hover:text-ink"
            >
              cancel
            </button>
            <button
              type="button"
              onClick={commitNew}
              disabled={!name.trim() || !verticalId}
              className="text-xs px-3 py-1 rounded bg-ink text-paper disabled:opacity-40"
            >
              create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
