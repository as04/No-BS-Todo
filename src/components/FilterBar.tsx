import { useToBooStore } from '../store/useToBooStore';
import { COLOR_DOT } from '../lib/colors';

type Props = {
  /** Currently-selected category ids. When empty AND `includeUncategorized` is
   *  false, the filter is considered inactive (no narrowing applied). */
  selectedCategoryIds: Set<string>;
  /** Whether uncategorized notes should be included in the result. */
  includeUncategorized: boolean;
  /** Replace the selected-category-id set. */
  onCategoryIdsChange: (ids: Set<string>) => void;
  /** Toggle whether uncategorized notes are included. */
  onIncludeUncategorizedChange: (b: boolean) => void;
  /** Hide the panel. */
  onClose: () => void;
};

/**
 * Expandable filter panel shown beneath the App header. Groups categories by
 * vertical so you can toggle one vertical "all on" / "all off" in a click,
 * or toggle individual categories. Filter narrows on top of whatever set is
 * already visible (today's focus or show-all).
 */
export function FilterBar({
  selectedCategoryIds,
  includeUncategorized,
  onCategoryIdsChange,
  onIncludeUncategorizedChange,
  onClose,
}: Props) {
  const verticals = useToBooStore((s) => s.verticals);
  const categories = useToBooStore((s) => s.categories);

  const toggle = (id: string) => {
    const next = new Set(selectedCategoryIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onCategoryIdsChange(next);
  };

  const toggleVertical = (verticalId: string) => {
    const inVertical = categories
      .filter((c) => c.verticalId === verticalId)
      .map((c) => c.id);
    const allOn = inVertical.every((id) => selectedCategoryIds.has(id));
    const next = new Set(selectedCategoryIds);
    if (allOn) inVertical.forEach((id) => next.delete(id));
    else inVertical.forEach((id) => next.add(id));
    onCategoryIdsChange(next);
  };

  const clearAll = () => {
    onCategoryIdsChange(new Set());
    onIncludeUncategorizedChange(false);
  };

  return (
    <div className="bg-white/80 border-y border-black/5 px-6 py-3 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-ink/60 font-medium">filter</p>
        <div className="flex items-center gap-3">
          <button
            onClick={clearAll}
            className="text-xs text-ink/60 hover:text-ink underline underline-offset-2"
          >
            clear
          </button>
          <button
            onClick={onClose}
            className="text-xs text-ink/60 hover:text-ink"
          >
            done
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {verticals.map((v) => {
          const cats = categories.filter((c) => c.verticalId === v.id);
          if (cats.length === 0) return null;
          const allOn = cats.every((c) => selectedCategoryIds.has(c.id));
          return (
            <div key={v.id} className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => toggleVertical(v.id)}
                className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap transition ${
                  allOn
                    ? 'bg-ink text-paper'
                    : 'text-ink/70 hover:text-ink'
                }`}
              >
                {v.name}
              </button>
              {cats.map((c) => {
                const on = selectedCategoryIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition ${
                      on
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-white border-black/10 hover:border-black/30'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${COLOR_DOT[c.color]}`} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          );
        })}

        <div className="pt-1">
          <button
            onClick={() => onIncludeUncategorizedChange(!includeUncategorized)}
            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition ${
              includeUncategorized
                ? 'bg-ink text-paper border-ink'
                : 'bg-white border-black/10 hover:border-black/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            uncategorized
          </button>
        </div>
      </div>
    </div>
  );
}
