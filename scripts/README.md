# Scripts

| Directory | Purpose |
|-----------|---------|
| **`dev.js`** | Used by `npm run dev` — starts API + Vite |
| **`dev/`** | Shell helpers: `start-app.sh`, `stop-app.sh`, `diagnose.sh` (also available via `./start-app.sh` wrappers at repo root) |
| **`assets/`** | One-off asset generators and downloaders (images, sounds, icons) |
| **`archive/`** | Legacy PM2 / old dev scripts — not used in normal workflow |
| **`manual-tests/`** | Ad-hoc Node scripts (mobile a11y, performance probes) |
| **`*.mjs`** | Documentation archive tooling (see `docs/README.md`) |

## Common commands

```bash
npm run dev                    # preferred dev entry
./start-app.sh                 # alternative: background server + client
./scripts/dev/diagnose.sh      # environment checks
./deploy.sh                    # production deploy helper (repo root)
```

## Asset scripts

Run from anywhere; each script `cd`s to the repo root:

```bash
./scripts/assets/download-images.sh
node scripts/assets/create-png-icons.js
```

## Manual API smoke tests

With the API on port **5001**:

```bash
node tests/manual/client/test-npcs.js
node tests/manual/client/test-artifacts.js
```

## Archive / PM2

Only if you still use PM2:

```bash
./scripts/archive/pm2-start.sh start
```

Prefer `npm run dev` instead.
