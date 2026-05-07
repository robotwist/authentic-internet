# Documentation (source of truth)

This folder is the **canonical place** for human-maintained project documentation. The repository root [`README.md`](../README.md) stays short and points here.

## What lives where

| Kind | Location | Purpose |
|------|----------|---------|
| **Project overview & setup** | [`README.md`](../README.md) | Install, env, run, build, tests |
| **Demo sprint (Jira/Airtable pack + pacing)** | [`demo-sprint/`](demo-sprint/) | CSV/checklist imports; **[demo-sprint/SPRINT-REALITY-MAP.md](demo-sprint/SPRINT-REALITY-MAP.md)** = plan vs shipped code vs CI |
| **Full archive (historical)** | [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md) | All former root/client/server `*.md` files merged into one file with `## Source: <original-filename>` sections |
| **Cursor session logs** | [`.specstory/`](../.specstory/) | Tooling transcripts—not product docs, not merged |
| **Module / asset notes** | Next to code (e.g. `client/public/assets/**/README.md`) | Local context only |

## Archive navigation

In [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md):

- Each imported document starts with **`## Source: FILENAME.md`**.
- Stable jump targets use anchors `doc-<slug>` (for example API docs: `#doc-api-documentation`). Run:

  ```bash
  rg '^## Source:' docs/PROJECT_DOCUMENTATION.md
  ```

  to list every section title.

- The block at **[#documentation-archive](PROJECT_DOCUMENTATION.md#documentation-archive)** explains how cross-references inside the archive work.

## Adding or changing docs (team convention)

1. **New “living” guides** (deployment runbooks, ADRs, testing strategy): add a **new file under `docs/`** (e.g. `docs/deployment.md`) and link it from this README. Prefer small, focused files over growing the archive only.
2. **Do not** scatter new `.md` files at the repo root—keep the root clean.
3. **Regenerating the big archive** is optional: only if you intentionally merge more Markdown again using [`scripts/consolidate-markdown.mjs`](../scripts/consolidate-markdown.mjs) (destructive). Afterward run [`scripts/annotate-doc-archive.mjs`](../scripts/annotate-doc-archive.mjs) so anchors and `./*.md` links stay consistent. If merged prose still contains bare `` `FILE.md` `` or `` **FILE.md** `` references, run [`scripts/rewrite-archive-md-refs.mjs`](../scripts/rewrite-archive-md-refs.mjs) once (same anchor scheme; skips fenced code blocks).

## Quick links into the archive

| Topic | Jump (GitHub / compatible viewers) |
|-------|-------------------------------------|
| API endpoints | [PROJECT_DOCUMENTATION.md#doc-api-documentation](PROJECT_DOCUMENTATION.md#doc-api-documentation) |
| Deployment | Search **Source: DEPLOYMENT** or **DEPLOYMENT_GUIDE** in [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md) |
| Local testing | **Source: LOCAL_TESTING_TIPS.md** |
| Auth troubleshooting | **Source: AUTH_TROUBLESHOOTING.md** |
| Client CORS / ports | **Source: CORS-TROUBLESHOOTING.md**, **README-PORT-MANAGEMENT.md** |

When in doubt, open [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md) and use your editor’s search for `Source: <name>`.
