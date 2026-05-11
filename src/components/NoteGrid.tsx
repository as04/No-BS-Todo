import type { Category, Note } from '../types';
import { StickyNote } from './StickyNote';
import { NoteListItem } from './NoteListItem';

type Props = {
  notes: Note[];
  categories: Category[];
  view: 'card' | 'list';
};

export function NoteGrid({ notes, categories, view }: Props) {
  const byId = new Map(categories.map((c) => [c.id, c]));

  if (notes.length === 0) {
    return (
      <div className="text-center py-20 text-ink/50">
        <p className="font-hand text-2xl">no notes here yet</p>
        <p className="text-sm mt-1">add one with the + button below</p>
      </div>
    );
  }

  const lookup = (id: string | null) => (id ? byId.get(id) : undefined);

  if (view === 'list') {
    return (
      <div className="bg-white/60 rounded-lg shadow-sticky overflow-hidden">
        {notes.map((n) => (
          <NoteListItem key={n.id} note={n} category={lookup(n.categoryId)} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((n) => (
        <StickyNote key={n.id} note={n} category={lookup(n.categoryId)} />
      ))}
    </div>
  );
}
