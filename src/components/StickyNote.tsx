import { useState } from 'react';
import type { Category, Note } from '../types';
import { useToBooStore } from '../store/useToBooStore';
import { progressPercent } from '../lib/progress';
import { COLOR_BG, COLOR_DOT } from '../lib/colors';
import { ProgressBar } from './ProgressBar';
import { BulkProgressInput } from './BulkProgressInput';
import { ChecklistEditor } from './ChecklistEditor';

type Props = {
  note: Note;
  category: Category | undefined;
};

export function StickyNote({ note, category }: Props) {
  const [expanded, setExpanded] = useState(false);
  const toggleChecklistItem = useToBooStore((s) => s.toggleChecklistItem);
  const addChecklistItem = useToBooStore((s) => s.addChecklistItem);
  const removeChecklistItem = useToBooStore((s) => s.removeChecklistItem);
  const setBulkCurrent = useToBooStore((s) => s.setBulkCurrent);
  const deleteNote = useToBooStore((s) => s.deleteNote);
  const updateNote = useToBooStore((s) => s.updateNote);

  const pct = progressPercent(note.progress);
  const bg = category ? COLOR_BG[category.color] : 'bg-sticky-gray';

  return (
    <div
      className={`${bg} rounded-lg p-4 shadow-sticky transition-all`}
      style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-0.3deg)' }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-hand text-xl leading-tight pr-2">{note.title}</h3>
          {category && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs whitespace-nowrap px-2 py-0.5 rounded-full bg-white/60`}
            >
              <span className={`w-2 h-2 rounded-full ${COLOR_DOT[category.color]}`} />
              {category.name}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <ProgressBar percent={pct} />
          <span className="text-xs text-ink/70 w-9 text-right">{pct}%</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          <textarea
            value={note.body ?? ''}
            onChange={(e) => updateNote(note.id, { body: e.target.value })}
            placeholder="Description…"
            className="w-full text-sm bg-white/50 rounded p-2 border border-black/10 resize-none focus:outline-none focus:border-black/40"
            rows={2}
          />

          {note.progress.kind === 'checklist' ? (
            <ChecklistEditor
              items={note.progress.items}
              onToggle={(id) => toggleChecklistItem(note.id, id)}
              onAdd={(text) => addChecklistItem(note.id, text)}
              onRemove={(id) => removeChecklistItem(note.id, id)}
            />
          ) : (
            <BulkProgressInput
              unitLabel={note.progress.unitLabel}
              current={note.progress.current}
              total={note.progress.total}
              onChange={(c) => setBulkCurrent(note.id, c)}
            />
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${note.title}"?`)) deleteNote(note.id);
              }}
              className="text-xs text-ink/50 hover:text-red-600"
            >
              Delete note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
