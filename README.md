# Authentic Internet

Creative metaverse platform: discover interactive content, create puzzles and experiences, publish work, and unlock powers through exploration and creation.

**Documentation hub (what to read, where things live, how we add docs):** [docs/README.md](docs/README.md)

**Historical / merged reference (API notes, audits, deployment text, troubleshooting):** [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)

## Stack (short)

- **Frontend:** React 18, Vite, React Router, MUI, Socket.io client
- **Backend:** Node.js (ESM), Express, MongoDB, Socket.io, JWT, Swagger

## Prerequisites

- Node.js 20+
- npm
- MongoDB (local or Atlas)

## Install

From the repository root:

```bash
npm install
cd server && npm install && cd ../client && npm install
```

Or: `npm run install:all`

## Environment

**Server** — create `server/.env`. Typical development values:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5176
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production URLs and hosting. Fuller env lists: [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md).

**Client** — create `client/.env`:

```env
VITE_API_URL=http://localhost:5001
```

## Run (development)

Recommended (starts API + Vite from repo root):

```bash
npm run dev
```

- Client (Vite): default port **5176** (see `client/vite.config.js`; may fall back if busy)
- API: **http://localhost:5001** (Swagger often at `/api-docs`)

Manual alternative: `cd server && npm run dev` and `cd client && npm run dev` in two terminals.

Other helpers: `./start-app.sh`, `./stop-app.sh`, `./scripts/dev/diagnose.sh` (see [scripts/README.md](scripts/README.md)).

## Build

```bash
npm run build
```

## Tests

```bash
npm test
```

## Deployment

- **Backend:** Render — [`render.yaml`](render.yaml), [docs/RENDER_SETUP.md](docs/RENDER_SETUP.md)
- **Frontend:** Netlify — root [`netlify.toml`](netlify.toml)
- **Runbook:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) · helper: `./deploy.sh`

## Repository layout

- `client/` — React + Vite app
- `server/` — Express API
- `docs/` — **canonical documentation**; start at [docs/README.md](docs/README.md)
- `scripts/` — dev launcher, asset tools, doc archive scripts ([scripts/README.md](scripts/README.md))
- `tests/` — Jest/Playwright; ad-hoc scripts in [tests/manual/](tests/manual/)
- **Client API:** [client/src/api/api.js](client/src/api/api.js) (canonical); see [client/src/api/README.md](client/src/api/README.md)

## License

ISC (see `package.json`).
