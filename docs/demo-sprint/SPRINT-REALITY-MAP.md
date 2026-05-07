# Demo sprint — plan vs reality & pacing

**North star (unchanged):** cold start → Overworld → reach **Yosemite** → interact with **John Muir** → clear a defined **WIN** moment.

This doc ties the **demo-sprint pack** (CSV/checklist) to **what is already in the codebase** and what still belongs on the board. Use it to avoid scope creep without losing good work you already shipped.

---

## 1. What the pack defines (reference)

| Epic | Intent |
|------|--------|
| **E1** | Demo spine: Overworld → Yosemite → Muir + victory |
| **E2** | Stability: loading, saves, focus, demo gating |
| **E3** | Juice: copy, timing, win feedback |
| **E4** | PM practice: Jira, Airtable, retro, evidence |

**Stories 1–15** (see `02-stories-tasks.csv`): happy-path script, Yosemite load gate, WIN at Muir, dry-runs, **demo mode UI gate**, keyboard regression, session smoke, copy pass, win juice, board hygiene, review/retro, AI evidence, demo video, presenter cheat sheet.

**14-day checklist:** `04-day-1-through-14-checklist.txt` (ship gates per day).

---

## 2. Already delivered in code (ahead of or parallel to the checklist)

These are **not** all required by the minimal spine, but they **landed in `main`** and support E1–E3:

| Area | What shipped (high level) | Rough map to epics |
|------|---------------------------|-------------------|
| **Yosemite mini-games** | Tiles **6 / 7 / 8** dispatch `portalCollision` like dungeon tile 9; **Terminal / Shooter / Text adventure** open on step; dedupe + music stop/resume; `usePortalCollisions` duplicate path removed | E1 spine exploration; beyond “Muir only” |
| **NPC / dock talk** | Transcript-style UI; dock **panel above tab bar**; embedded talk without duplicate title row; **typewriter unfurl** + **mumble SFX** (`SoundManager.playNpcDialogBlurb`); Space/Shift/tap behavior | E2 focus/typing; E3 juice |
| **World Guide art** | Socrates crop + animation assets; overworld map NPC entry updated | E3 polish |
| **Reward / controls / game state** | Related UI and state tweaks in same delivery window | E2/E3 |

**Example commit (May 6, 2026):** `6073624` — *feat(client): NPC talk UX, dock layout, dialogue SFX, Yosemite mini-game portals*.

**Implication:** you have **more product surface** than the “single path to WIN” story strictly needs. That is fine if you **label** extra work as *post-demo* or *stretch* in Jira so the spine stays the decision filter.

---

## 3. Gaps vs the sprint pack (still open or blocked)

| Pack item | Status | Notes |
|-----------|--------|--------|
| Happy path script + WIN one-liner in Jira | PM / docs | Day 1 gate in checklist |
| **Demo mode UI gate** (Story 5) | Likely **not** done | Hide/disable dock tabs / specials for presenter-safe build |
| **CI/CD Pipeline** | **Failing** | Security/audit, **lint**, **server tests**, **accessibility** jobs red; build/deploy jobs skipped |
| **Deploy to Netlify** (GitHub Action) | **Failing** | `Unauthorized` on Netlify action → rotate **`NETLIFY_AUTH_TOKEN`**, verify **`NETLIFY_SITE_ID`** |
| Production URL smoke | **404** on `authentic-internet.netlify.app` at last check | Aligns with failed deploys |
| Airtable copy table / presenter cheat sheet | PM | Stories 8, 15, cheat sheet |
| Session/save smoke | Verify | Story 7 |

---

## 4. Organized pace — **Now / Next / Later**

Use this as the **default filter** when choosing work.

### Now (protect the demo)

1. **Spine P0 only:** Overworld → Yosemite → Muir → **WIN** fires once; no blank map; no soft-lock on that path.
2. **Presenter safety:** implement or document **Story 5** (demo gate) *or* a one-page “do not click” list until the gate exists.
3. **Deploy path:** fix Netlify secrets → confirm one **green** deploy → smoke test production URL.

### Next (stability without boiling the ocean)

1. **CI:** either fix ESLint + server tests + a11y scripts, or **narrow** `.github/workflows/ci.yml` to “install + client build” until you can afford the full matrix.
2. **Dependency audits:** treat `npm audit` failures as a **scheduled** task, not a merge blocker, unless course requires otherwise.

### Later (post-demo / stretch)

- Yosemite **three** mini-games as hero features (marketing / portfolio).
- Full NPC unfurl + SFX polish across all NPCs.
- Broader map progression beyond the demo spine.

---

## 5. Jira hygiene (recommended)

- **Label:** `spine` | `stretch-shipped` | `post-demo` | `ci-infra`.
- **Single filter:** “spine-only” for daily stand-up; everything else visible but **not** in WIP.
- **WIP limit:** keep **≤ 3** stories in progress; finish or park.

---

## 6. Files in this folder

| File | Purpose |
|------|---------|
| `01-epics.csv` | Epic import for Jira |
| `02-stories-tasks.csv` | Stories/tasks import |
| `03-sprint-calendar.csv` | Calendar seed |
| `04-day-1-through-14-checklist.txt` | Day-by-day ship gates |
| `IMPORT-INSTRUCTIONS.txt` | Jira + Airtable import steps |
| `jira-epic-keys-template.txt` | Fix Parent keys after epic import |
| `airtable-*.txt` / `*.csv` | Airtable setup |
| **`SPRINT-REALITY-MAP.md`** (this file) | Plan vs code vs CI — **living**; update when spine or deploy status changes |

---

*Last updated: 2026-05-06 (aligned with CI/Netlify investigation and client feature commit).*
