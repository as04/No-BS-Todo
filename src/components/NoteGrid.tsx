import type { Category, Note } from '../types';
import { StickyNote } from './StickyNote';

type Props = {
  notes: Note[];
  categories: Category[];
};

export function NoteGrid({ notes, categories }: Props) {
  const byId = new Map(categories.map((c) => [c.id, c]));

  if (notes.length === 0) {
    return (
      <div className="text-center py-20 text-ink/50">
        <p className="font-hand text-2xl">no notes here yet</p>
        <p className="text-sm mt-1">add one with the + button below</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((n) => (
        <StickyNote key={n.id} note={n} category={byId.get(n.categoryId)} />
      ))}
    </div>
  );
}
