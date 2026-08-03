import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveYosemiteReturnTransition,
  YOSEMITE_RETURN_SPAWN_TILE,
} from "../../client/src/utils/yosemiteReturnPortal.js";

const tileSize = 64;
const getMapIndexByKey = (name) => (name === "Overworld 3" ? 3 : -1);

test("returns Overworld 3 spawn in pixel coords for Yosemite tile 5", () => {
  const transition = resolveYosemiteReturnTransition({
    currentMapName: "Yosemite",
    tileType: 5,
    tileSize,
    getMapIndexByKey,
  });

  assert.deepEqual(transition, {
    destinationIndex: 3,
    destinationName: "Overworld 3",
    spawnPosition: {
      x: YOSEMITE_RETURN_SPAWN_TILE.x * tileSize,
      y: YOSEMITE_RETURN_SPAWN_TILE.y * tileSize,
    },
  });
  // Regression: previous action used raw {x:8,y:2} pixels and trapped/misplaced players
  assert.notDeepEqual(transition.spawnPosition, { x: 8, y: 2 });
});

test("ignores non-return tiles and other maps", () => {
  assert.equal(
    resolveYosemiteReturnTransition({
      currentMapName: "Yosemite",
      tileType: 6,
      tileSize,
      getMapIndexByKey,
    }),
    null,
  );

  assert.equal(
    resolveYosemiteReturnTransition({
      currentMapName: "Overworld 3",
      tileType: 5,
      tileSize,
      getMapIndexByKey,
    }),
    null,
  );
});

test("returns null when Overworld 3 is missing", () => {
  assert.equal(
    resolveYosemiteReturnTransition({
      currentMapName: "Yosemite",
      tileType: 5,
      tileSize,
      getMapIndexByKey: () => -1,
    }),
    null,
  );
});
