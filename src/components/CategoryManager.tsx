import { useState } from 'react';
import { useToBooStore } from '../store/useToBooStore';
import { ALL_COLORS, COLOR_DOT } from '../lib/colors';
import type { StickyColor } from '../types';

type Props = { onClose: () => void };

export function CategoryManager({ onClose }: Props) {
  const verticals = useToBooStore((s) => s.verticals);
  const categories = useToBooStore((s) => s.categories);
  const addCategory = useToBooStore((s) => s.addCategory);
  const updateCategory = useToBooStore((s) => s.updateCategory);
  const deleteCategory = useToBooStore((s) => s.deleteCategory);
  const addVertical = useToBooStore((s) => s.addVertical);
  const updateVertical = useToBooStore((s) => s.updateVertical);
  const deleteVertical = useToBooStore((s) => s.deleteVertical);

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState<StickyColor>('yellow');
  const [newCatVerticalId, setNewCatVerticalId] = useState(
    verticals[0]?.id ?? ''
  );
  const [newVerticalName, setNewVerticalName] = useState('');

  const addNewCategory = () => {
    const t = newCatName.trim();
    if (!t || !newCatVerticalId) return;
    addCategory(t, newCatColor, newCatVerticalId);
    setNewCatName('');
  };

  const addNewVertical = () => {
    const t = newVerticalName.trim();
    if (!t) return;
    addVertical(t);
    setNewVerticalName('');
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-lg w-full space-y-5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-hand text-2xl">verticals & categories</h2>
        <button onClick={onClose} className="text-sm text-ink/60 hover:text-ink">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {verticals.map((v) => {
          const cats = categories.filter((c) => c.verticalId === v.id);
          return (
            <div
              key={v.id}
              className="border border-black/10 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  value={v.name}
                  onChange={(e) => updateVertical(v.id, { name: e.target.value })}
                  className="font-hand text-lg bg-transparent flex-1 border-b border-transparent focus:border-black/30 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Delete "${v.name}" vertical and ALL its categories + notes?`
                      )
                    )
                      deleteVertical(v.id);
                  }}
                  className="text-xs text-ink/40 hover:text-red-600"
                >
                  delete vertical
                </button>
              </div>

              <div className="space-y-1.5 pl-2">
                {cats.length === 0 && (
                  <p className="text-xs text-ink/40 italic">no categories yet</p>
                )}
                {cats.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {ALL_COLORS.map((col) => (
                        <button
                          key={col}
                          onClick={() => updateCategory(c.id, { color: col })}
                          className={`w-3.5 h-3.5 rounded-full ${COLOR_DOT[col]} ${
                            c.color === col ? 'ring-2 ring-ink' : ''
                          }`}
                          aria-label={`set ${col}`}
                        />
                      ))}
                    </div>
                    <input
                      value={c.name}
                      onChange={(e) =>
                        updateCategory(c.id, { name: e.target.value })
                      }
                      className="flex-1 bg-paper rounded px-2 py-1 text-sm border border-black/10"
                    />
                    <select
                      value={c.verticalId}
                      onChange={(e) =>
                        updateCategory(c.id, { verticalId: e.target.value })
                      }
                      className="text-xs bg-paper rounded px-1 py-1 border border-black/10"
                      title="move to vertical"
                    >
                      {verticals.map((vv) => (
                        <option key={vv.id} value={vv.id}>
                          {vv.name}
                        </option>
                      ))}
                    </select>
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
                      del
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-black/10 pt-4 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs text-ink/60">Add category</label>
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex gap-1">
              {ALL_COLORS.map((col) => (
                <button
                  key={col}
                  onClick={() => setNewCatColor(col)}
                  className={`w-4 h-4 rounded-full ${COLOR_DOT[col]} ${
                    newCatColor === col ? 'ring-2 ring-ink' : ''
                  }`}
                  aria-label={`pick ${col}`}
                />
              ))}
            </div>
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addNewCategory();
              }}
              placeholder="e.g. Brilliant"
              className="flex-1 bg-paper rounded px-2 py-1 text-sm border border-black/10 min-w-0"
            />
            <select
              value={newCatVerticalId}
              onChange={(e) => setNewCatVerticalId(e.target.value)}
              className="text-sm bg-paper rounded px-2 py-1 border border-black/10"
            >
              {verticals.map((vv) => (
                <option key={vv.id} value={vv.id}>
                  {vv.name}
                </option>
              ))}
            </select>
            <button
              onClick={addNewCategory}
              className="text-sm px-3 py-1 rounded bg-ink text-paper"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-ink/60">Add vertical</label>
          <div className="flex gap-2 items-center">
            <input
              value={newVerticalName}
              onChange={(e) => setNewVerticalName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addNewVertical();
              }}
              placeholder="e.g. Creative"
              className="flex-1 bg-paper rounded px-2 py-1 text-sm border border-black/10"
            />
            <button
              onClick={addNewVertical}
              className="text-sm px-3 py-1 rounded border border-black/30"
            >
              + Vertical
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
