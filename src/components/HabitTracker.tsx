import { useMemo, useState } from 'react';
import { useToBooStore } from '../store/useToBooStore';
import { dayLabel, lastSevenDays } from '../lib/habits';
import { WeightPicker } from './WeightPicker';
import { localDateKey } from '../lib/dates';

/**
 * Standalone habits tab. Renders the user's habits (seeded with Ben
 * Franklin's 13 virtues on first run) with an inline-editable name, a
 * weight picker, and a rolling 7-day tick grid. Today's column is ringed
 * in orange so it's easy to find.
 */
export function HabitTracker() {
  const habits = useToBooStore((s) => s.habits);
  const addHabit = useToBooStore((s) => s.addHabit);
  const updateHabit = useToBooStore((s) => s.updateHabit);
  const deleteHabit = useToBooStore((s) => s.deleteHabit);
  const toggleHabitTick = useToBooStore((s) => s.toggleHabitTick);

  const week = useMemo(() => lastSevenDays(), []);
  const today = localDateKey();
  const [newName, setNewName] = useState('');

  const ticksThisWeek = (ticks: Record<string, boolean>) =>
    week.filter((d) => ticks[d]).length;

  const submitNew = () => {
    const t = newName.trim();
    if (!t) return;
    addHabit(t);
    setNewName('');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24">
      <header className="mb-6">
        <h2 className="font-hand text-3xl">habits</h2>
        <p className="text-xs text-ink/60 mt-1">
          tick a circle to mark done for that day · last 7 days shown
        </p>
      </header>

      <div className="space-y-1">
        <div className="grid grid-cols-[1fr_auto_repeat(7,_28px)_auto_auto] gap-2 items-center text-xs text-ink/50 px-3">
          <span>habit</span>
          <span className="text-right">weight</span>
          {week.map((d) => (
            <span
              key={d}
              className={`text-center ${d === today ? 'font-bold text-ink' : ''}`}
            >
              {dayLabel(d)}
            </span>
          ))}
          <span className="text-right">week</span>
          <span />
        </div>

        {habits.map((h) => {
          const count = ticksThisWeek(h.ticks);
          return (
            <div
              key={h.id}
              className="grid grid-cols-[1fr_auto_repeat(7,_28px)_auto_auto] gap-2 items-center bg-white/60 hover:bg-white rounded-lg px-3 py-2"
            >
              <input
                value={h.name}
                onChange={(e) => updateHabit(h.id, { name: e.target.value })}
                className="bg-transparent border-b border-transparent focus:border-black/30 focus:outline-none text-sm"
              />
              <WeightPicker
                value={h.weight}
                onChange={(w) => updateHabit(h.id, { weight: w })}
                compact
              />
              {week.map((d) => {
                const on = !!h.ticks[d];
                return (
                  <button
                    key={d}
                    onClick={() => toggleHabitTick(h.id, d)}
                    className={`w-6 h-6 rounded-full mx-auto transition ${
                      on
                        ? 'bg-ink text-paper'
                        : 'bg-black/5 hover:bg-black/15'
                    } ${d === today ? 'ring-2 ring-orange-400' : ''}`}
                    aria-label={`toggle ${h.name} on ${d}`}
                  >
                    {on ? '✓' : ''}
                  </button>
                );
              })}
              <span className="text-xs text-ink/60 text-right w-10">
                {count}/7
              </span>
              <button
                onClick={() => {
                  if (confirm(`Delete habit "${h.name}"?`)) deleteHabit(h.id);
                }}
                className="text-xs text-ink/30 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitNew();
          }}
          placeholder="add a habit (e.g. read 30 min)"
          className="flex-1 bg-paper rounded px-3 py-2 text-sm border border-black/10 focus:outline-none focus:border-black/40"
        />
        <button
          onClick={submitNew}
          className="text-sm px-4 py-2 rounded bg-ink text-paper"
        >
          add habit
        </button>
      </div>
    </div>
  );
}
