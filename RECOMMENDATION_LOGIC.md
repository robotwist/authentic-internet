# Recommendation Logic

**Purpose:** Document how "smart" recommendations work and what signals drive them.  
**Code:** `server/routes/recommendations.js`, `client/src/api/recommendations.js`, `client/src/components/RecommendationEngine.jsx`

---

## Overview

The recommendation engine uses **in-memory user behavior** (no DB tables). It supports multiple algorithms and combines them in a **hybrid** mode. Recommendations are personalized by **preferences** (types, areas, creators, tags), **interactions** (view, select, feedback, complete), and **context** (time, session).

---

## Algorithms

| Algorithm | Description | Main signals |
|-----------|-------------|--------------|
| **Collaborative** | "Users like you liked this." | Similar users’ positive interactions; preference overlap (types, areas, creators). |
| **Content-based** | "Similar to what you liked." | User preferences (types, areas, creators, tags); artifact rating, reviews, media; **completion history** (same type/area/tags as completed). |
| **Contextual** | "Right for this moment." | Time of day (morning vs evening), session length (short vs long), artifact recency. |
| **Serendipity** | "Unexpected but relevant." | Avoid viewed types/creators/artifacts; reward unseen types/creators; quality + lower popularity. |
| **Hybrid** | Combined scoring. | Weighted mix: collaborative 30%, content-based 40%, contextual 20%, serendipity 10%. |

---

## Signals

### 1. **Preferences** (from interactions)

- **Types:** e.g. `story`, `game`, `puzzle`, `music`. Updated when user gives **positive** or **negative** feedback (or **completes** an artifact).
- **Areas:** e.g. `overworld`, `desert`, `yosemite`. Same source.
- **Creators:** `createdBy` ids. Same source.
- **Tags:** Artifact tags. Same source.

Positive feedback adds weight; negative reduces it. **Completion counts as positive** for preference updates.

### 2. **Interaction history**

- **view** – User viewed an artifact.
- **select** – User chose it from recommendations.
- **feedback** – `positive` | `negative` (e.g. thumbs up/down).
- **complete** – User completed the artifact (game, puzzle, etc.).

Completions are used for:

- Updating preferences (as positive signal).
- **Completion history** signal: content-based scoring boosts artifacts that match **type**, **area**, or **tags** of completed artifacts. Already-completed artifacts are **excluded** from recommendations.

### 3. **Tags**

- Stored in preferences per tag (from feedback/completion).
- Content-based scoring uses `artifact.tags` × `preferences.tags`.
- Completion-based boost also uses tags of completed artifacts.

### 4. **Context**

- **Time of day:** Morning → story/puzzle; evening → game/music.
- **Session length:** Long session → lower `exp` (shorter) content; short → higher-rated.
- **Recency:** Newer artifacts get a recency bonus.

---

## Data flow

1. **Track:** `POST /api/recommendations/interaction` stores `{ artifactId, type, feedback?, algorithm? }`.  
   `updateUserPreferences` runs for each interaction; **completions** are treated as positive.
2. **Recommend:** `GET /api/recommendations?algorithm=hybrid&limit=12&diversity=0.5&novelty=0.3`  
   fetches visible artifacts, runs the chosen algorithm(s), then applies **diversity** (type/creator mix) and **novelty** (prefer unseen).
3. **Profile / insights:** `GET /api/recommendations/profile` and `GET /api/recommendations/insights` expose preferences, behavior (e.g. completion rate), and trends.

---

## Client usage

- **RecommendationEngine** loads user data (e.g. from localStorage), calls `getRecommendations`, and can tweak `algorithm`, `diversity`, `novelty`.
- **Tracking:** `trackInteraction`, `trackArtifactView`, `trackArtifactCompletion`, etc. in `client/src/api/recommendations.js` send data to `POST /api/recommendations/interaction`.

**Completion tracking:** `ArtifactGameLauncher` calls `trackArtifactCompletion(artifact.id)` when a user completes a game (after stats/rewards). Other completion flows (e.g. terminal, puzzle) can call it too so **completion history** is used as a signal.

---

## Limitations

- **In-memory store:** `userBehaviorStore` is a `Map` in the server process. Restart clears it; not shared across instances.
- **Auth:** Recommendations and tracking use `req.user.id` (JWT). Unauthenticated users get no personalization.
- **Cold start:** Few or no interactions → collaborative and content-based contribute less; contextual and serendipity still apply.

---

## Summary

| Signal | Used in | Notes |
|--------|---------|--------|
| Preferences (types, areas, creators, tags) | Collaborative, content-based | From feedback + **completion** |
| Completion history | Content-based | Boost same type/area/tags; exclude completed |
| Tags | Content-based, preferences | Explicit tag weights |
| View / select / feedback | All | Drives preferences and filters |
| Time, session, recency | Contextual | Context-only |
