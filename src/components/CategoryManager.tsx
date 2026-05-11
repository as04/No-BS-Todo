import { useState } from 'react';
import { useToBooStore } from '../store/useToBooStore';
import { ALL_COLORS, COLOR_DOT } from '../lib/colors';
import type { StickyColor } from '../types';

type Props = { onClose: () => void };

export function CategoryManager({ onClose }: Props) {
  const categories = useToBooStore((s) => s.categories);
  const addCategory = useToBooStore((s) => s.addCategory);
  const updateCategory = useToBooStore((s) => s.updateCategory);
  const deleteCategory = useToBooStore((s) => s.deleteCategory);

  const [name, setName] = useState('');
  const [color, setColor] = useState<StickyColor>('yellow');

  const submit = () => {
    const t = name.trim();
    if (!t) return;
    addCategory(t, color);
    setName('');
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-hand text-2xl">categories</h2>
        <button onClick={onClose} className="text-sm text-ink/60 hover:text-ink">
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <div className="flex gap-1">
              {ALL_COLORS.map((col) => (
                <button
                  key={col}
                  onClick={() => updateCategory(c.id, { color: col })}
                  className={`w-4 h-4 rounded-full ${COLOR_DOT[col]} ${
                    c.color === col ? 'ring-2 ring-ink' : ''
                  }`}
                  aria-label={`set ${col}`}
                />
              ))}
            </div>
            <input
              value={c.name}
              onChange={(e) => updateCategory(c.id, { name: e.target.value })}
              className="flex-1 bg-paper rounded px-2 py-1 text-sm border border-black/10"
            />
            <button
              onClick={() => {
                if (
                  confirm(
                    `Delete "${c.name}"? Notes in this category will also be deleted.`
                  )
                )
                  deleteCategory(c.id);
              }}
              className="text-xs text-ink/40 hover:text-red-600"
            >
              delete
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-black/10 pt-4 space-y-2">
        <label className="text-xs text-ink/60">Add category</label>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1">
            {ALL_COLORS.map((col) => (
              <button
                key={col}
                onClick={() => setColor(col)}
                className={`w-4 h-4 rounded-full ${COLOR_DOT[col]} ${
                  color === col ? 'ring-2 ring-ink' : ''
                }`}
                aria-label={`pick ${col}`}
              />
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder="e.g. Health"
            className="flex-1 bg-paper rounded px-2 py-1 text-sm border border-black/10"
          />
          <button
            onClick={submit}
            className="text-sm px-3 py-1 rounded bg-ink text-paper"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
