# ToBoo

A calm sticky-note todo app. Phase 1 (MVP) — local-first, no backend.

## What's in Phase 1

- Sticky-note cards with colored categories and progress bars
- Morning flow: pick today's categories → see only those notes, in-progress first
- Two progress modes per note:
  - **Checklist** — manual checkboxes
  - **Bulk** — set total (e.g. 15 chapters) + current; bar updates with one number
- Add/edit/delete categories (with colors)
- Add/edit/delete notes inline
- Everything persists in `localStorage` — survives reloads
- "Show all" toggle to see notes across every category
- "Change" link to re-pick today's focus

## Setup (one-time)

You need **Node.js 18+** installed. If you don't have it:

- Easiest: download from <https://nodejs.org> (LTS).
- Or via Homebrew: `brew install node`.

Then in the project folder:

```bash
cd /Users/anuradha/toboo
npm install
npm run dev
```

Open the printed URL (usually <http://localhost:5173>).

## Daily flow

1. Open ToBoo in the morning → picker asks which categories.
2. Select 2–3 → land on a clean grid of those notes, doing-first.
3. Click a note to expand. Either tick checklist items or bump the bulk counter.
4. Add notes/categories with the buttons in the top right.

## Tech

- Vite + React + TypeScript
- Tailwind CSS
- Zustand for state
- nanoid for IDs

## Project layout

```
src/
├── App.tsx                          # shell + morning-picker gate
├── main.tsx                         # React root
├── types/index.ts                   # Note, Category, ProgressMode, ChecklistItem
├── store/useToBooStore.ts           # Zustand store + localStorage persistence
├── lib/
│   ├── storage.ts                   # load/save helpers
│   ├── progress.ts                  # progressPercent, deriveStatus, sortByInProgressFirst
│   └── colors.ts                    # sticky color palette
├── components/
│   ├── MorningPicker.tsx            # category multi-select gate
│   ├── NoteGrid.tsx                 # responsive grid wrapper
│   ├── StickyNote.tsx               # collapsed + expanded note card
│   ├── ProgressBar.tsx
│   ├── BulkProgressInput.tsx        # +/- + number input
│   ├── ChecklistEditor.tsx
│   ├── AddNoteForm.tsx              # modal: new note (picks mode)
│   ├── CategoryManager.tsx          # modal: CRUD categories
│   └── CategoryChip.tsx
└── styles/index.css
```

## Roadmap

See `~/.claude/plans/create-a-new-structured-pearl.md` for the full phased plan:

- **Phase 2** — verticals, daily progress ring, evening review, streak, habit tracker, card/list toggle, minimalist mode, IndexedDB migration.
- **Phase 3** — AI note search + motivation chat (Claude API).
- **Phase 4** — activity charts, lazy-hour prompts, relax list, time-based reminders, "Doing" overview, bucket list.
- **Phase 5** — kanban + drag-drop, calming open popup, Jai-Shree-Ram random button, weekend hackathon mode, blog, PWA icon, optional cloud sync.

## Reset

To wipe local data and start over, in the browser devtools console:

```js
localStorage.removeItem('toboo:v1');
```
