import { useRef, useState } from 'react';
import { useToBooStore } from '../store/useToBooStore';
import { exportJson, exportMarkdown, importJson } from '../lib/dataIO';

type Props = { onClose: () => void };

type ImportPreview =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | {
      kind: 'preview';
      counts: { notes: number; categories: number; verticals: number };
      onConfirm: () => void;
    };

/**
 * Data-management modal: export the current state to a JSON backup or a
 * human-friendly Markdown file (Apple-Notes / Obsidian friendly), and
 * import a previously-exported JSON to overwrite local state.
 *
 * Import goes through a two-step flow: file picked → counts shown → user
 * confirms replace → state swapped via the store's {@link replaceState}.
 */
export function DataModal({ onClose }: Props) {
  // Don't subscribe to a derived object (would force re-renders on every
  // store change). Read the current snapshot lazily inside click handlers.
  const replaceState = useToBooStore((s) => s.replaceState);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<ImportPreview>({
    kind: 'idle',
  });

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setImportStatus({ kind: 'loading' });
    const result = await importJson(file);
    if (!result.ok) {
      setImportStatus({ kind: 'error', message: result.error });
      return;
    }
    const incoming = result.state;
    setImportStatus({
      kind: 'preview',
      counts: {
        notes: incoming.notes.length,
        categories: incoming.categories.length,
        verticals: incoming.verticals.length,
      },
      onConfirm: () => {
        replaceState(incoming);
        onClose();
      },
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full space-y-4">
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
            Pick a `.json` you previously exported. Will replace everything
            currently in this browser after you confirm.
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />

        {importStatus.kind === 'loading' && (
          <p className="text-xs text-ink/60">reading file…</p>
        )}

        {importStatus.kind === 'error' && (
          <p className="text-xs text-red-700">{importStatus.message}</p>
        )}

        {importStatus.kind === 'preview' && (
          <div className="bg-paper rounded-md border border-amber-300 p-3 space-y-2">
            <p className="text-sm">
              <strong>Replace your current data?</strong> The imported file
              has{' '}
              <strong>{importStatus.counts.notes}</strong> notes,{' '}
              <strong>{importStatus.counts.categories}</strong> categories,{' '}
              <strong>{importStatus.counts.verticals}</strong> verticals.
              This will overwrite everything in this browser.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setImportStatus({ kind: 'idle' })}
                className="text-xs px-3 py-1.5 rounded hover:bg-black/5"
              >
                cancel
              </button>
              <button
                onClick={importStatus.onConfirm}
                className="text-xs px-3 py-1.5 rounded bg-red-700 text-white hover:bg-red-800"
              >
                replace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
