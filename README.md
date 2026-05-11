# ToBoo · the No-BS Todo app

A todo app for people who already have eight todo apps and still write
on a sticky note. ToBoo is **calm**, **local-first**, and refuses to
gamify you into the ground.

> 🪧 codename: **ToBoo** &nbsp;·&nbsp; repo: `No-BS-Todo`
>
> if you can read this README without scrolling, the app is doing its job.

---

## Why this exists

Most todo apps wage psychological warfare. ToBoo just wants you to:

1. open the app in the morning
2. pick a couple of categories you actually feel like working on
3. see a small grid of sticky notes (in-progress first, so you finish things before starting new ones)
4. nudge one of them forward
5. close laptop

That's it. Everything else is an optional flourish that you can ignore
until you want it.

---

## What's in the box

### 📝 Sticky notes (the basics)

- Cards in real sticky-note pastels (yellow, pink, blue, green, purple, orange, gray)
- Click a card to expand → description, progress controls, category picker, weight, delete
- **Two progress modes per note** — because the world has both kinds of tasks:
  - **Checklist** — tick off sub-tasks one at a time
  - **Bulk** — "chapter 7 of 15", "lesson 4 of 30" — tap +/− or type a number, bar moves, your finger doesn't fall off
- Notes can live in a **category**, or be **uncategorized** (gray dot, no judgment)
- Inline rename, inline delete, no modal nesting hell

### 🗂 Verticals + categories

A two-level structure that stays out of your way:

- **Verticals** at the top (default: **Financial**, **Health**, **Career** — kept short on purpose)
- **Categories** nest inside a vertical, each with its own color
- Rename anything inline, delete anything safely — **deleting a category does not delete its notes** (they survive as uncategorized so your past work isn't punished)
- Add a new category mid-flow when creating a note — no need to bail out to a settings page

### 🌅 Morning picker

Open the app fresh and ToBoo asks "what's on your plate today?" with
multi-select chips. You pick 2–3, you see only those notes (in-progress
first), you ignore the rest of your life. Click **change** in the header
to re-pick. Skip if you don't feel like committing.

### ⭕ Daily Progress Ring

Top-left of the header. Today's **weighted** progress as a circle.

- Each note has a **weight 1–5** (small dots under its bar)
- High-weight notes pull the ring more (so finishing your weight-5
  "Read Sapiens" matters more than finishing your weight-1 "buy milk")
- Hover the ring for the math; tweak weights anytime

### 🔥 Streak

A small chip next to the ring. Counts consecutive days where your daily
ring crossed a threshold (default **10%**). Click it to **change the
threshold** — choose a number that feels honest for the level of "showed
up today" you want to count.

### 🌙 Evening Review

A "🌙 review" button in the header opens a calming little screen at the
end of the day:

- today's start → end % (and how many note updates that took)
- the notes you touched
- a free-text reflection field that gets saved onto today's snapshot

Tomorrow it's gone from this screen, but it survives in **Done** (see
below), so you can look back and feel something.

### 🌿 Habits tab

A separate tab for the 13 Ben-Franklin-style virtues, pre-seeded and
fully editable:

- inline-rename any habit
- weight per habit (forward-compat with future weighted habit math)
- 7-day rolling tick grid (today's column ringed in orange so you can't miss it)
- delete what doesn't fit you, add what does

### ✅ Done tab (formerly "history")

Where past you lives. Three things stacked, newest first:

- **how busy you've been** — a GitHub-contributions-style **calendar
  heatmap** of the last 52 weeks. Each square is one day, darker =
  more note interactions. The grid stays legible from day one (sparse
  data ≠ broken chart), and as you use the app the pattern starts
  filling in. Header shows running totals (`X updates · Y active
  days`). Hover any square for the exact count.
  - This is **not** the same metric as the ring (today's %) or the
    streak (the chain). The heatmap is pure activity: were you here
    on a given day?
- **per-day cards** with that day's start→end %, your reflection (if
  you wrote one), and **every note you finished that day**
- empty state that doesn't shame you

### 🔍 Filter

A `filter` pill in the header opens a panel of vertical/category toggles:

- click a vertical name → toggle all its categories at once
- click a category chip → toggle just that one
- separate **uncategorized** toggle for orphan notes
- filter **narrows on top of** today's focus (or the full set if "show all" is on)

### 👀 View controls

For when you want a different shape of the same data:

- **▦ card** ↔ **☰ list** — sticky-note grid vs. condensed table
- **minimalist** mode — slice the visible list to the top N (N editable inline, 1–50)
- **show all** ↔ **today only** — bypass the morning focus when you want the full board

### 💾 Storage

Everything lives in your browser's `localStorage` under `toboo:v1`.

- No server. No account. No tracking. No cloud bill.
- Survives page reloads
- Open the same browser, see the same notes
- If you ever want multi-device sync, it's an opt-in Phase-5 thing — not the default

### 🧠 What weight, streak, and the chart actually mean

Three views, three different questions, no redundancy:

- **Ring** → "how complete is today, right now"
- **🔥 streak** → "am I showing up every day"
- **Done-tab heatmap** → "what's the long-game pattern of when I show up" (count of interactions per day, calendar grid)

You don't have to look at any of them. They're there if you like that
kind of thing.

---

## How to run it (locally)

You'll need **Node 18+**. If you don't have it:

```bash
# Download installer from https://nodejs.org (LTS)
# OR if you're using Homebrew:
brew install node
```

Then:

```bash
cd /path/to/toboo
npm install
npm run dev
```

Open whatever URL Vite prints (usually `http://localhost:5173`).

---

## How to reset

To wipe your local data and start fresh (open devtools console in the
browser):

```js
localStorage.removeItem('toboo:v1');
```

---

## Tech stack (deliberately tiny)

- **Vite + React + TypeScript**
- **Tailwind CSS** + a hand-written `Patrick Hand` font for the sticky feel
- **Zustand** for state (one store, no Redux)
- **nanoid** for IDs
- **inline SVG** for the calendar heatmap (no chart lib yet — Recharts joins in Phase 4 if/when we add multi-series stuff)
- No backend, no auth, no analytics

---

## Roadmap

The full phased plan is at
`~/.claude/plans/create-a-new-structured-pearl.md` — rolling document.
Highlights:

- **Phase 3 — AI layer:** natural-language search across your notes, motivation chat with Claude when you're stuck. Bring your own Anthropic API key, stored locally.
- **Phase 4 — Smart nudges & insights:** activity multi-series chart (Recharts), "what are you doing right now?" lazy-hour prompts, time-based reminders, bucket list, "doing" overview, optional IndexedDB migration.
- **Phase 5 — Polish, fun & long-tail:** kanban board with drag-and-drop, calming dream-collage open popup, the "Jai Shree Ram" random-todo button, weekend hackathon mode + blog-out, PWA install, optional cloud sync.

The deal: every phase ends with something you'd actually want to use,
not a half-built thing. If a feature stops being fun to build or use,
it gets dropped instead of finished out of guilt.

---

## License

This is a personal app. Take whatever you want from it. Don't ship a
worse todo app.
