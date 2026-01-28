# Local Testing Tips

You’ve done a lot of development without running the app locally. These tips should help you debug and verify things systematically.

---

## 1. Pre-flight checklist

**Environment**

- **Node:** `node -v` → use `>=20` (see `package.json` engines).
- **MongoDB:** Server uses MongoDB. Either:
  - Local: `mongod` running, or
  - Atlas: `MONGO_URI` in `server/.env` (see `server/.env.production` for format).
- **Env files:** `server/.env` with at least `PORT`, `MONGO_URI`, `JWT_SECRET`.  
  - No `server/.env`? Copy from `server/.env.production` and adjust for local (e.g. local Mongo URL).

**Ports**

- **API:** `5001` (default). Client and Vite proxy use `http://localhost:5001`.
- **Client (Vite):** `5176` per `client/vite.config.js` (`strictPort: false` → can fallback to 5177, etc.).
- **start-app.sh** checks frontend on `5176`; if your Vite port differs, the script may say “frontend not ready” even when it is.

**Dependencies**

```bash
npm run install:all
```

(Root, then `server`, then `client`.)

---

## 2. How to start

**Option A – Dev script (server + client together)**

```bash
npm run dev
```

- Runs `scripts/dev.js` → starts `server` (nodemon) and `client` (Vite) in parallel.
- Logs go to the same terminal. No log files.

**Option B – start-app.sh**

```bash
chmod +x start-app.sh && ./start-app.sh
```

- Kills existing `node` processes, clears Vite cache, frees 5001 / 5176, starts server then client.
- Logs: `server.log`, `client.log`. Use `tail -f server.log` and `tail -f client.log`.
- Waits for `http://localhost:5001/api/health` and `http://localhost:5176`.

If startup fails, read the last 30–50 lines of `server.log` and `client.log` first.

---

## 3. Verify in order

**1) API health**

```bash
curl -s http://localhost:5001/api/health
```

Expect JSON (e.g. `{"status":"ok",...}`). If this fails, fix server/Mongo/env before touching the UI.

**2) Frontend**

- Open `http://localhost:5176` (or whatever port Vite prints).
- Check console (F12) for runtime errors and failed `/api` requests.

**3) Auth**

- Register or log in. If “Access Denied” or 401s:
  - Use `AUTH_TROUBLESHOOTING.md` (e.g. `auth.checkAuth()`, `auth.clearAuth()`, `auth.testLogin()` in console).
  - Confirm `Authorization: Bearer <token>` in Network tab for `/api` calls.

**4) Core features**

- Load game world, move, open inventory, use a portal.
- Talk to NPCs, discover an artifact.

**5) Newer features**

- **Creation tokens (2nd artifact):** Create one artifact (free). Try creating a second; you should hit “creation token required” unless you’ve completed another user’s artifact. Check `GET /api/artifacts/creation-status` and `POST /api/artifacts` 403 handling.
- **Funny XP:** Fight enemies, discover/revisit artifacts, create artifacts. Occasionally you should see odd XP amounts and silly messages (e.g. “Found a neat rock.”).
- **NPC audit:** All NPCs have sprites and dialogue; no placeholders. Spots to check: Overworld, Overworld 2/3, Desert, Yosemite, Hemingway’s Battleground.
- **Recommendations:** Use Artifacts / discovery UI that calls recommendation APIs. Complete a game via `ArtifactGameLauncher`; that should call `trackArtifactCompletion` and feed completion-based recommendations.

---

## 4. Where to look when things break

| Symptom | Check |
|--------|--------|
| Server won’t start | `server.log`, `MONGO_URI`, `JWT_SECRET`, `PORT`; port 5001 free |
| Client won’t start | `client.log`, `client/node_modules`, Vite port; port 5176 (or fallback) free |
| Blank / crash on load | Browser console; React error boundaries; Network tab for failed `/api` or JS |
| 401 / “Access Denied” | Token in `localStorage`; `Authorization` header; `AUTH_TROUBLESHOOTING.md` |
| CORS errors | `server` CORS config (e.g. `server.mjs`); origins for `http://localhost:5176` etc. |
| API 404/500 | `server.log`; route exists in `server/routes`; correct HTTP method and URL |
| Creation token 403 | User has ≥1 artifact and 0 tokens; `requireCreationToken` middleware and `creation-status` |
| No funny XP | `maybeAwardFunnyXp` trigger paths (combat, artifact discover/revisit/create); low chance ≈2–4% |
| Recommendation issues | `POST /api/recommendations/interaction` (including `type: 'complete'`); `RECOMMENDATION_LOGIC.md` |

---

## 5. Quick fixes

- **Port in use:** `start-app.sh` runs `fuser -k 5001/tcp` (and similar for 5176). Or manually: `lsof -i :5001`, `lsof -i :5176`, then kill PIDs.
- **Vite cache:** `rm -rf client/node_modules/.vite` then restart client.
- **Stale API base URL:** Client uses `VITE_API_URL` or `http://localhost:5001`. Ensure no `.env` override pointing at wrong host/port.
- **Auth weirdness:** Clear `localStorage` for the app origin, log out, then log in again.
- **Recommendations in-memory:** `userBehaviorStore` is process-local. Restarting the server clears it; that’s expected.

---

## 6. Logs and network

- **Server:** `tail -f server.log` or `npm run dev` terminal. Look for uncaught errors, Mongo connection issues, and route logs.
- **Client:** `tail -f client.log` or dev terminal; Vite overlay (if enabled) and browser console.
- **Network:** DevTools → Network. Filter by “Fetch/XHR”, inspect `/api` requests: status, headers, payload, response body.

---

## 7. Sanity checks after our changes

- **Artifact creation:** First create free; second requires token. `creation-status` and error messaging in UI.
- **Artifact complete:** `POST /api/artifacts/:id/complete` rewards creation token and updates user; game launcher calls `trackArtifactCompletion`.
- **Recommendations:** Completion updates preferences and completion-history boost; completed artifacts excluded from results. See `RECOMMENDATION_LOGIC.md`.
- **NPCs:** `GameData` NPCs have `sprite` and `dialogue`; Hemingway uses `/assets/hemingway.png`. See `NPC_AUDIT.md`.

---

## 8. Port alignment (start-app.sh vs Vite)

`start-app.sh` expects the frontend on **5176** (to match `vite.config.js`). If you change Vite’s `port`, update the script’s `curl` and any “frontend ready” check to the same port so the script doesn’t falsely fail.

---

Focus on: **Health → Auth → Core gameplay → New features**. Fix each layer before moving on; use logs and Network tab consistently. If you hit a specific error (e.g. Mongo connection, 403 on create, or recommendation 500), check the matching row in the table above and the linked docs.
