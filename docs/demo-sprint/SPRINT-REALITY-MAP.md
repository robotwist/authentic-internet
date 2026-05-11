# Demo sprint — plan vs reality & pacing

**North star (completed):** cold start → Overworld → reach **Yosemite** → clear a defined **WIN** moment → independently talk with **John Muir**.

This doc ties the **demo-sprint pack** (CSV/checklist) to **what shipped in phase 1** and what moves into the next phase. Use it to keep the sprint closed without losing good follow-up work.

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

## 3. Phase 1 closeout status

| Pack item | Status | Notes |
|-----------|--------|--------|
| Happy path script + WIN one-liner | **Done for demo** | Win now triggers on Yosemite entry; John Muir remains conversational after the win |
| Yosemite entry/spawn | **Done** | Character enters on a walkable meadow tile near John Muir |
| NPC talk dock | **Done** | Natural transcript UI, close behavior, local fallback responses, and throttled dialogue mumble |
| Yosemite mini-game portals | **Done / stretch shipped** | Terminal, Shooter, and Text Adventure sigils are wired as step-on portals |
| Friend demo readiness | **Ready for selective demo** | Share with a small trusted group; ask them to test the spine first, then free explore |
| Backend services | **Deferred** | Heroku/backend recovery moves to next phase |
| CI/CD full hardening | **Deferred** | Client production build passes locally; broader CI cleanup is next phase |

---

## 4. Organized pace — **Now / Next / Later**

Use this as the **default filter** when choosing work.

### Now (freeze phase 1)

1. **Commit and push** the phase-1 demo freeze.
2. **Friend demo:** ask testers to try Overworld → Yosemite → win → John Muir → one mini-game portal.
3. **Collect notes only:** do not expand phase-1 scope unless the demo path breaks.

### Next (phase 2)

1. Evaluate a lighter game engine path, likely **React shell + Phaser game core**.
2. Recover or replace backend services.
3. Decide whether to keep this repo as the phase-1 artifact or branch into phase 2.

### Later

- Yosemite **three** mini-games as hero features (marketing / portfolio).
- Full NPC unfurl + SFX polish across all NPCs.
- Broader map progression beyond the demo spine.

---

## 5. Jira hygiene (recommended)

- **Label:** `spine` | `stretch-shipped` | `post-demo` | `ci-infra`.
- **Single filter:** “spine-only” for daily stand-up; everything else visible but **not** in WIP.
- **WIP limit:** keep **≤ 3** stories in progress; finish or park.

---

## 6. Jira closeout map

Use this table to update the Jira sprint board. Keep phase-1 issues closed or deferred; do not reopen phase-1 scope unless the friend-demo spine breaks.

| CSV issue | Jira action | Closeout status | Evidence / method |
|-----------|-------------|-----------------|-------------------|
| 1 — Happy path script | Move to **Done** | **Done** | Demo route is documented here: Overworld → Desert → Dungeon → Yosemite → WIN → John Muir → optional mini-game |
| 2 — Yosemite chunk load / travel gate | Move to **Done** | **Done** | Yosemite route is operational from the main progression path and developer shortcut |
| 3 — Define and implement victory at Muir | Move to **Done** with note | **Done, changed trigger** | Win now triggers on Yosemite map entry; John Muir conversation is independent after the win |
| 4 — Dry-run #1 | Move to **Done** | **Done** | User-tested route confirmed: Overworld → Desert → Dungeon → Yosemite is operative |
| 5 — Demo mode UI gate | Move to **Deferred / Phase 2** | **Deferred** | We chose a frozen friend-demo path instead of gating all UI |
| 6 — Keyboard + typing regression | Move to **Done** | **Done** | NPC talk no longer traps movement flow; Terminal input/typing was polished |
| 7 — Session smoke | Move to **Deferred / Known limitation** | **Deferred** | Backend/session recovery moves to phase 2 |
| 8 — Copy pass: Muir + portals + win | Move to **Done** | **Done** | Yosemite win modal and NPC/dialogue copy were updated for demo tone |
| 9 — Win juice | Move to **Done** | **Done** | Yosemite-specific victory modal, music handling, and reward link are shipped |
| 10 — Sprint board hygiene | Move to **Done** | **Done** | Labels/method below; phase-1 docs identify Done vs Deferred |
| 11 — Mid-sprint review notes | Move to **Done** | **Done** | This doc is the review note and reality map |
| 12 — Retrospective | Move to **Done / lightweight** | **Done** | Process improvement: freeze phase 1; move backend/engine/CI to phase 2 |
| 13 — AI-assisted task evidence | Move to **Done** | **Done** | Commits on `main` document AI-assisted implementation and fixes |
| 14 — Record 3-min demo video | Move to **To Do / Optional** | **Open optional** | Record after final deployed smoke test |
| 15 — Presenter cheat sheet | Move to **Done / this doc** | **Done enough** | Friend-demo path and known method are listed here |

### Method We Are Using

- **Sprint rule:** close phase 1 around the working demo spine; no new systems inside this sprint.
- **Board rule:** move finished spine/polish work to **Done**; move backend, CI hardening, and engine migration to **Deferred / Phase 2**.
- **Evidence rule:** use merged commits on `main`, this closeout map, and friend-demo smoke notes as proof.
- **Demo rule:** testers should run the spine first, then optionally explore Yosemite mini-game portals.
- **Phase-2 rule:** create new Jira cards for backend recovery, CI cleanup, and React shell + Phaser evaluation instead of carrying them as sprint leftovers.

---

## 7. Files in this folder

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

*Last updated: 2026-05-11 (Jira closeout map and phase-1 Done/Deferred method).*
