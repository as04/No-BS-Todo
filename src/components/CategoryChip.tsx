import type { Category } from '../types';
import { COLOR_DOT } from '../lib/colors';

type Props = {
  category: Category;
  selected?: boolean;
  onClick?: () => void;
};

export function CategoryChip({ category, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition ${
        selected
          ? 'border-ink bg-white shadow-sm'
          : 'border-transparent bg-white/50 hover:bg-white'
      }`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${COLOR_DOT[category.color]}`} />
      <span>{category.name}</span>
    </button>
  );
}
