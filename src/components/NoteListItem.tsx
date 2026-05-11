import { useState } from 'react';
import type { Category, Note } from '../types';
import { useToBooStore } from '../store/useToBooStore';
import { progressPercent } from '../lib/progress';
import { COLOR_DOT } from '../lib/colors';
import { ProgressBar } from './ProgressBar';
import { BulkProgressInput } from './BulkProgressInput';
import { ChecklistEditor } from './ChecklistEditor';
import { WeightPicker } from './WeightPicker';
import { CategoryPicker } from './CategoryPicker';

type Props = {
  note: Note;
  category: Category | undefined;
};

export function NoteListItem({ note, category }: Props) {
  const [expanded, setExpanded] = useState(false);
  const toggleChecklistItem = useToBooStore((s) => s.toggleChecklistItem);
  const addChecklistItem = useToBooStore((s) => s.addChecklistItem);
  const removeChecklistItem = useToBooStore((s) => s.removeChecklistItem);
  const setBulkCurrent = useToBooStore((s) => s.setBulkCurrent);
  const deleteNote = useToBooStore((s) => s.deleteNote);
  const updateNote = useToBooStore((s) => s.updateNote);

  const pct = progressPercent(note.progress);
  const colorDot = category ? COLOR_DOT[category.color] : 'bg-gray-300';

  return (
    <div className="border-b border-black/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-white/40 transition"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${colorDot}`} />
        <span className="flex-1 min-w-0">
          <span className="block truncate text-sm">{note.title}</span>
          <span className="text-xs text-ink/40">
            {category ? category.name : 'uncategorized'}
          </span>
        </span>
        <span className="w-32 hidden sm:block">
          <ProgressBar percent={pct} />
        </span>
        <span className="text-xs text-ink/60 w-9 text-right">{pct}%</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 bg-white/40">
          <textarea
            value={note.body ?? ''}
            onChange={(e) => updateNote(note.id, { body: e.target.value })}
            placeholder="Description…"
            className="w-full text-sm bg-white/60 rounded p-2 border border-black/10 resize-none focus:outline-none focus:border-black/40"
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

          <div>
            <label className="text-xs text-ink/60 block mb-1">category</label>
            <CategoryPicker
              value={note.categoryId}
              onChange={(id) => updateNote(note.id, { categoryId: id })}
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <WeightPicker
              value={note.weight ?? 3}
              onChange={(w) => updateNote(note.id, { weight: w })}
              compact
            />
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
