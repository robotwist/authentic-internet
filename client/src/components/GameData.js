import { isValidMapSize, auditMapGrid } from "./MapConstants";
import OVERWORLD_MAP from "./gameMaps/overworldMap.js";
import { MAP_NAMES_IN_ORDER } from "./gameMaps/mapOrder.js";

export { MAP_NAMES_IN_ORDER };

/**
 * COORDINATE SYSTEM DOCUMENTATION:
 * - NPC positions: PIXEL coordinates (multiply tile coordinates by TILE_SIZE = 64)
 * - Artifact locations: TILE coordinates (x, y represent tile indices)
 * - Special portal positions: TILE coordinates (x, y represent tile indices)
 * - Patrol areas: PIXEL coordinates (startX, startY, width, height in pixels)
 */

/** Sparse until {@link loadRemainingMaps} resolves; length matches MAP_NAMES_IN_ORDER */
export const MAPS = new Array(MAP_NAMES_IN_ORDER.length).fill(null);
MAPS[0] = OVERWORLD_MAP;

/**
 * Returns a map index that has loaded grid data, or 0. Use after {@link loadRemainingMaps}
 * and when restoring session so UI never indexes into a null lazy slot.
 */
export function getSafeMapIndex(preferredIndex) {
  if (
    typeof preferredIndex !== "number" ||
    Number.isNaN(preferredIndex) ||
    preferredIndex < 0 ||
    preferredIndex >= MAPS.length
  ) {
    return 0;
  }
  const map = MAPS[preferredIndex];
  if (!map?.data) return 0;
  return preferredIndex;
}

let remainingMapsPromise = null;

function devAuditAllMaps(maps) {
  if (!import.meta.env?.DEV) return;
  maps.forEach((map, index) => {
    if (!map?.data) {
      if (map !== null) {
        console.warn(`[maps] missing data at index ${index}`);
      }
      return;
    }
    const audit = auditMapGrid(map.data, map.name || `index ${index}`);
    if (!audit.ok) {
      console.warn("[map audit]", audit.name, audit.invalidCells.slice(0, 40));
    }
  });
}

/**
 * Loads maps 1…n via dynamic import (separate chunk). Overworld stays in the main bundle.
 */
/** Fire-and-forget: starts downloading the lazy map chunk (same promise as loadRemainingMaps). */
export function prefetchRemainingMaps() {
  void loadRemainingMaps();
}

export function loadRemainingMaps() {
  if (!remainingMapsPromise) {
    remainingMapsPromise = import("./gameMaps/remainingMapsBundle.js").then(
      (mod) => {
        const rest = mod.default;
        const expected = MAP_NAMES_IN_ORDER.length - 1;
        if (!Array.isArray(rest) || rest.length !== expected) {
          console.error(
            `remainingMapsBundle: expected ${expected} maps, got`,
            rest?.length,
          );
          return;
        }
        for (let i = 0; i < rest.length; i++) {
          MAPS[i + 1] = rest[i];
        }
        if (import.meta.env?.DEV) {
          MAPS.forEach((map, index) => {
            if (!map?.data || !isValidMapSize(map.data)) {
              console.error(
                `Invalid map size or missing map at index ${index}: ${map?.name}`,
              );
            }
          });
          devAuditAllMaps(MAPS);
        }
      },
    );
  }
  return remainingMapsPromise;
}

if (import.meta.env?.DEV && MAPS[0]?.data) {
  if (!isValidMapSize(MAPS[0].data)) {
    console.error(`Invalid map size in map 0: ${MAPS[0].name}`);
  }
  devAuditAllMaps(MAPS);
}

// Dev: editing overworldMap.js hot-reloads that module, but MAPS[0] must be reassigned and React needs to re-render.
if (import.meta.hot) {
  import.meta.hot.accept("./gameMaps/overworldMap.js", (mod) => {
    MAPS[0] = mod.default;
    window.dispatchEvent(new CustomEvent("vite:maps-updated"));
  });
}

// NPCs and World Map
export const NPCs = {
  "Ernest Hemingway": {
    name: "Ernest Hemingway",
    sprite: "/assets/npcs/hemingway.png",
    apiType: "quotes",
    dialogueStyle: "direct",
    themes: ["writing", "courage", "life"],
  },
  // ... rest of NPCs ...
};

export const WORLD_MAP = {
  structure: [
    {
      id: "overworld",
      name: "Overworld",
      x: 200,
      y: 100,
      connections: ["overworld2", "dungeon1"],
    },
    {
      id: "overworld2",
      name: "Overworld 2",
      x: 350,
      y: 200,
      connections: ["overworld", "overworld3"],
    },
    {
      id: "overworld3",
      name: "Overworld 3",
      x: 500,
      y: 100,
      connections: ["overworld2", "desert1"],
    },
    {
      id: "desert1",
      name: "Desert 1",
      x: 650,
      y: 200,
      connections: ["overworld3", "desert2", "yosemite", "hemingway"],
    },
    {
      id: "desert2",
      name: "Desert 2",
      x: 800,
      y: 100,
      connections: ["desert1", "desert3"],
    },
    {
      id: "desert3",
      name: "Desert 3",
      x: 950,
      y: 200,
      connections: ["desert2"],
    },
    {
      id: "yosemite",
      name: "Yosemite",
      x: 650,
      y: 350,
      connections: ["desert1"],
    },

    // New dungeon levels
    {
      id: "dungeon1",
      name: "Dungeon Level 1",
      x: 200,
      y: 250,
      connections: ["overworld", "dungeon2"],
      type: "dungeon",
    },
    {
      id: "dungeon2",
      name: "Dungeon Level 2",
      x: 150,
      y: 350,
      connections: ["dungeon1", "dungeon3"],
      type: "dungeon",
    },
    {
      id: "dungeon3",
      name: "Dungeon Level 3",
      x: 250,
      y: 450,
      connections: ["dungeon2", "yosemite"],
      type: "dungeon",
    },

    // Hemingway's adventure
    {
      id: "hemingway",
      name: "Hemingway's Adventure",
      x: 800,
      y: 300,
      connections: ["desert1"],
      type: "special",
    },

    // Text-based adventure
    {
      id: "text_adventure",
      name: "Text Adventure",
      x: 400,
      y: 450,
      connections: ["yosemite"],
      type: "text",
    },
  ],
  mapToId: {
    Overworld: "overworld",
    "Overworld 2": "overworld2",
    "Overworld 3": "overworld3",
    "Desert 1": "desert1",
    "Desert 2": "desert2",
    "Desert 3": "desert3",
    Yosemite: "yosemite",
    "Dungeon Level 1": "dungeon1",
    "Dungeon Level 2": "dungeon2",
    "Dungeon Level 3": "dungeon3",
    "Hemingway's Battleground": "hemingway",
    "Hemingway's Adventure": "hemingway",
    "Text Adventure": "text_adventure",
  },
};

/** O(1) lookup: map display name, optional map.id, or WORLD_MAP.mapToId slug → MAPS index */
export const MAP_INDEX_BY_KEY = Object.freeze(
  (() => {
    const acc = {};
    MAP_NAMES_IN_ORDER.forEach((name, index) => {
      acc[name] = index;
    });
    Object.entries(WORLD_MAP.mapToId || {}).forEach(
      ([displayName, worldId]) => {
        const idx = acc[displayName];
        if (typeof idx === "number") acc[worldId] = idx;
      },
    );
    return acc;
  })(),
);

export function getMapIndexByKey(key) {
  if (key == null || key === "") return -1;
  const i = MAP_INDEX_BY_KEY[key];
  return typeof i === "number" ? i : -1;
}
