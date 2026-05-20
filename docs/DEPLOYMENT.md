# Deployment

Production stack:

| Layer | Host | Config |
|-------|------|--------|
| **Frontend** | Netlify | Root [`netlify.toml`](../netlify.toml), [`client/public/_redirects`](../client/public/_redirects) |
| **Backend** | Render | [`render.yaml`](../render.yaml), [`docs/RENDER_SETUP.md`](RENDER_SETUP.md) |

## URLs

- **API:** `https://authentic-internet.onrender.com`
- **API health:** `https://authentic-internet.onrender.com/api/health`
- **Frontend:** `https://flourishing-starburst-8cf88b.netlify.app` (also `https://authentic-internet.netlify.app`)

Netlify proxies browser `/api/*` requests to Render so the client can use relative URLs and avoid CORS issues.

## Backend (Render)

1. Push to `main` — Render auto-deploys when the service is linked to this repo (`render.yaml`, `rootDir: server`).
2. Set secrets in the Render dashboard: `JWT_SECRET`, `SESSION_SECRET`, `CSRF_SECRET`, `MONGO_URI`, and optional email vars.
3. First-time or blueprint setup: follow [RENDER_SETUP.md](RENDER_SETUP.md).

Verify:

```bash
curl -sS https://authentic-internet.onrender.com/api/health
```

## Frontend (Netlify)

- **CI:** [`.github/workflows/netlify-deploy.yml`](../.github/workflows/netlify-deploy.yml) builds with `VITE_API_URL=https://authentic-internet.onrender.com`.
- **Manual:** from repo root, `./deploy.sh` → option 2 (requires Netlify CLI).

Canonical Netlify config is **only** the root `netlify.toml` (not under `client/`).

## Local development

```bash
npm run dev
```

- Client: `http://localhost:5176` (Vite proxies `/api` → `http://localhost:5001`)
- API: `http://localhost:5001`

Set `VITE_API_URL=http://localhost:5001` in `client/.env` if needed.

## Retired: Heroku

The backend no longer deploys to Heroku. Removed artifacts: `app.json`, `Procfile`, `client/netlify.toml`, `deploy-production.sh`, `simple-deploy.sh`.

If a `heroku` git remote remains locally, it is unused:

```bash
git remote remove heroku   # optional cleanup
```

Historical deployment notes live in [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) (search `Source: DEPLOYMENT`).
