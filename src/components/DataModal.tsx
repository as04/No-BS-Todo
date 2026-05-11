import { useRef, useState } from 'react';
import { useToBooStore } from '../store/useToBooStore';
import type { ToBooState } from '../types';
import {
  exportJson,
  exportMarkdown,
  importJson,
  mergeStates,
} from '../lib/dataIO';

type Props = { onClose: () => void };

type ImportStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | {
      kind: 'preview';
      incoming: ToBooState;
    };

/**
 * Data-management modal. Three things the user can do:
 *
 * 1. Export the full state as JSON (backup, round-trippable).
 * 2. Export a human-readable Markdown copy (Apple-Notes / Obsidian friendly).
 * 3. Import a previously-exported JSON.
 *
 * Import is intentionally non-destructive by default: after the user picks a
 * file, the modal shows counts AND two confirm actions — **merge** (additive,
 * conflict-by-updatedAt) and **replace** (red, wipes everything first).
 * Before either action runs, a safety backup of the current state is
 * downloaded automatically (toggle-able) so a slip cannot lose data.
 */
export function DataModal({ onClose }: Props) {
  const replaceState = useToBooStore((s) => s.replaceState);

  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>({ kind: 'idle' });
  const [safetyBackup, setSafetyBackup] = useState(true);

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setStatus({ kind: 'loading' });
    const result = await importJson(file);
    if (!result.ok) {
      setStatus({ kind: 'error', message: result.error });
      return;
    }
    setStatus({ kind: 'preview', incoming: result.state });
  };

  const runMerge = () => {
    if (status.kind !== 'preview') return;
    const current = useToBooStore.getState();
    if (safetyBackup) exportJson(current);
    const report = mergeStates(current, status.incoming);
    replaceState(report.result);
    const summary = formatMergeReport(report);
    alert(`Merged.\n\n${summary}`);
    onClose();
  };

  const runReplace = () => {
    if (status.kind !== 'preview') return;
    const current = useToBooStore.getState();
    if (safetyBackup) exportJson(current);
    replaceState(status.incoming);
    alert(
      `Replaced. Now showing ${status.incoming.notes.length} notes from the file.`
    );
    onClose();
  };

  /** Build a human-readable summary of what the merge actually changed. */
  const formatMergeReport = (r: ReturnType<typeof mergeStates>): string => {
    const bits: string[] = [];
    if (r.notesAdded) bits.push(`+${r.notesAdded} notes`);
    if (r.notesUpdated) bits.push(`${r.notesUpdated} notes updated to a newer version`);
    if (r.categoriesAdded) bits.push(`+${r.categoriesAdded} categories`);
    if (r.verticalsAdded) bits.push(`+${r.verticalsAdded} verticals`);
    if (r.habitsAdded) bits.push(`+${r.habitsAdded} habits`);
    if (r.daysAdded) bits.push(`+${r.daysAdded} days of history`);
    if (r.notesRemapped)
      bits.push(`${r.notesRemapped} notes re-pointed to your existing categories`);
    if (bits.length === 0) {
      return 'Nothing was new — the file matched what you already have.';
    }
    return bits.join('\n');
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full space-y-4 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-hand text-2xl">your data</h2>
        <button onClick={onClose} className="text-sm text-ink/60 hover:text-ink">
          ✕
        </button>
      </div>

      <p className="text-xs text-ink/60">
        Everything lives in your browser. Download a backup before clearing
        site data, switching browsers, or letting Phase 3 send your notes
        to Claude.
      </p>

      <div className="space-y-2">
        <button
          onClick={() => exportJson(useToBooStore.getState())}
          className="w-full text-left bg-paper rounded-md border border-black/10 px-3 py-2 hover:bg-white"
        >
          <div className="text-sm font-medium">export · backup (.json)</div>
          <div className="text-xs text-ink/60">
            Full fidelity. Use this with the "import" button below to restore.
          </div>
        </button>

        <button
          onClick={() => exportMarkdown(useToBooStore.getState())}
          className="w-full text-left bg-paper rounded-md border border-black/10 px-3 py-2 hover:bg-white"
        >
          <div className="text-sm font-medium">export · readable (.md)</div>
          <div className="text-xs text-ink/60">
            Drag into Apple Notes, Obsidian, or any text editor. Lossy — for
            reading, not importing back.
          </div>
        </button>
      </div>

      <div className="border-t border-black/10 pt-3 space-y-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full text-left bg-paper rounded-md border border-black/10 px-3 py-2 hover:bg-white"
        >
          <div className="text-sm font-medium">import · restore from backup</div>
          <div className="text-xs text-ink/60">
            Pick a `.json` you previously exported. Default is **merge** —
            we keep your current work and only add things missing or older
            than the imported version.
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />

        {status.kind === 'loading' && (
          <p className="text-xs text-ink/60">reading file…</p>
        )}

        {status.kind === 'error' && (
          <p className="text-xs text-red-700">{status.message}</p>
        )}

        {status.kind === 'preview' && (
          <div className="bg-paper rounded-md border border-amber-300 p-3 space-y-3">
            <p className="text-sm">
              File contains <strong>{status.incoming.notes.length}</strong>{' '}
              notes, <strong>{status.incoming.categories.length}</strong>{' '}
              categories,{' '}
              <strong>{status.incoming.verticals.length}</strong> verticals.
              Pick how to bring it in:
            </p>

            <label className="flex items-center gap-2 text-xs text-ink/70">
              <input
                type="checkbox"
                checked={safetyBackup}
                onChange={(e) => setSafetyBackup(e.target.checked)}
                className="accent-ink"
              />
              also download a safety backup of my current data first
            </label>

            <div className="flex flex-col gap-2">
              <button
                onClick={runMerge}
                className="text-sm px-3 py-2 rounded bg-ink text-paper hover:bg-ink/80"
                title="Keep my current work; add anything missing or newer from the file"
              >
                merge with current (recommended)
              </button>
              <button
                onClick={runReplace}
                className="text-sm px-3 py-2 rounded border border-red-300 text-red-700 hover:bg-red-50"
                title="Discard my current data and use only what's in the file"
              >
                replace everything (destructive)
              </button>
              <button
                onClick={() => setStatus({ kind: 'idle' })}
                className="text-xs text-ink/50 hover:text-ink underline underline-offset-2 self-end"
              >
                cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
