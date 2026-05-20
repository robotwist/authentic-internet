# Manual tests

Ad-hoc scripts and HTML fixtures — **not** part of `npm test` (Jest/Playwright).

## Client API smoke tests

Requires local API at `http://localhost:5001` (`npm run dev` or `./start-app.sh`):

```bash
node tests/manual/client/test-npcs.js
node tests/manual/client/test-artifacts.js
node tests/manual/client/test-system.js
node tests/manual/client/test-jesus.js
```

Open `tests/manual/client/test-auth.html` in a browser while the app is running.

## Dev / integration scripts (Node or Vite)

Moved from `client/src/` — import the real API from `client/src/api/api.js`:

```bash
node tests/manual/client/dev/test-auth-client.js
node tests/manual/client/dev/run-tests.js
```

See [client/src/api/README.md](../../client/src/api/README.md) for API layer conventions.

## Other

- `scripts/manual-tests/` — mobile accessibility and performance probe scripts
