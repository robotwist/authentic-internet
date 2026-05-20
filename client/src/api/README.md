# Client API layer

## Use this (canonical)

**[`api.js`](api.js)** — all app features should import from here:

```js
import { loginUser, fetchArtifacts, trackArtifactInteraction } from "../api/api";
```

Uses `getApi()` with the configured base URL, token handling, and caching.

## Legacy (avoid for new code)

| File | Role |
|------|------|
| [`legacyAxiosClient.js`](legacyAxiosClient.js) | Old axios instance + port scanning |
| [`authService.js`](authService.js), [`*Service.js`](.) | Thin wrappers over legacy client |
| [`index.js`](index.js) | Re-exports legacy services (manual tests only) |

## External APIs (weather, quotes)

**[`../utils/externalApiConfig.js`](../utils/externalApiConfig.js)** — third-party URLs and keys (not the Authentic Internet backend).

## Manual / dev tests

Browser and Node smoke tests: [`../../../tests/manual/client/dev/`](../../../tests/manual/client/dev/)
