import { useState } from 'react';
import type { ChecklistItem } from '../types';

type Props = {
  items: ChecklistItem[];
  onToggle: (itemId: string) => void;
  onAdd: (text: string) => void;
  onRemove: (itemId: string) => void;
};

/**
 * Inline editor for a note's checklist. Items show as checkbox + text; the
 * trailing input adds a new item on Enter or Add-button click.
 */
export function ChecklistEditor({ items, onToggle, onAdd, onRemove }: Props) {
  const [draft, setDraft] = useState('');

  const submit = () => {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft('');
  };

  return (
    <div className="space-y-1.5">
      {items.map((i) => (
        <div key={i.id} className="flex items-center gap-2 group">
          <input
            type="checkbox"
            checked={i.done}
            onChange={() => onToggle(i.id)}
            className="w-4 h-4 accent-ink"
          />
          <span
            className={`text-sm flex-1 ${
              i.done ? 'line-through text-ink/50' : ''
            }`}
          >
            {i.text}
          </span>
          <button
            type="button"
            onClick={() => onRemove(i.id)}
            className="text-ink/30 hover:text-ink/80 opacity-0 group-hover:opacity-100 text-xs"
            aria-label="remove item"
          >
            ✕
          </button>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Add item…"
          className="flex-1 text-sm bg-white/60 rounded px-2 py-1 border border-black/10 focus:outline-none focus:border-black/40"
        />
        <button
          type="button"
          onClick={submit}
          className="text-sm px-2 py-1 rounded border border-black/10 bg-white/70 hover:bg-white"
        >
          Add
        </button>
      </div>
    </div>
  );
}
