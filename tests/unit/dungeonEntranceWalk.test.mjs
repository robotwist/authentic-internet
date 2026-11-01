import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import overworldMap from "../../client/src/components/gameMaps/overworldMap.js";
import { TILE_SIZE, isWalkable } from "../../client/src/components/MapConstants.js";
import { propsForDungeonEnemy } from "../../client/src/components/Dungeons/dungeonEnemyProps.js";

const STEP = TILE_SIZE / 2;

/** Same four-corner occupancy check used by character movement. */
function hitboxCanOccupy(x, y, mapData) {
  return (
    isWalkable(x, y, mapData) &&
    isWalkable(x + TILE_SIZE - 1, y, mapData) &&
    isWalkable(x, y + TILE_SIZE - 1, mapData) &&
    isWalkable(x + TILE_SIZE - 1, y + TILE_SIZE - 1, mapData)
  );
}

test("Library of Alexandria door is a walkable type-9 portal", () => {
  const portal = overworldMap.specialPortals.find(
    (entry) => entry.destination === "Library of Alexandria",
  );
  assert.ok(portal, "overworld special portal missing");
  assert.equal(portal.tileType, 9);

  const { x: tileX, y: tileY } = portal.position;
  assert.equal(overworldMap.data[tileY][tileX], 9);

  const doorX = tileX * TILE_SIZE;
  const doorY = tileY * TILE_SIZE;
  assert.equal(hitboxCanOccupy(doorX, doorY, overworldMap.data), true);

  // Approach from the grass tile immediately west of the door.
  const approachX = (tileX - 1) * TILE_SIZE;
  assert.equal(overworldMap.data[tileY][tileX - 1], 0);
  assert.equal(hitboxCanOccupy(approachX, doorY, overworldMap.data), true);
  assert.equal(
    hitboxCanOccupy(approachX + STEP, doorY, overworldMap.data),
    true,
    "a half-tile step onto the door must not be blocked",
  );

  // The wall at the doubled source cell (0, 2) stays blocked.
  assert.equal(isWalkable(0, 4 * TILE_SIZE, overworldMap.data), false);
  assert.equal(overworldMap.data[4][0], 1);
});

test("entrance keese are given a pixel position Enemy can render", () => {
  assert.deepEqual(
    propsForDungeonEnemy({
      type: "keese_dungeon",
      position: { x: 3, y: 3 },
      health: 1,
    }),
    {
      type: "keese_dungeon",
      position: { x: 192, y: 192 },
      health: 1,
    },
  );

  const source = fs.readFileSync(
    new URL("../../client/src/components/Dungeons/Dungeon.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /propsForDungeonEnemy\(enemy\)/);
  assert.doesNotMatch(source, /initialPosition=\{enemy\.position\}/);
});
