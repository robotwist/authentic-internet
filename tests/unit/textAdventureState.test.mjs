import assert from "node:assert/strict";
import test from "node:test";
import { getStableGameWorld } from "../../client/src/components/textAdventureState.js";

test("getStableGameWorld preserves mutations across simulated re-renders", () => {
  const ref = { current: null };
  const createWorld = () => ({
    hallway: {
      completedInteractions: [],
      playerKnowledge: [],
      revealedExits: [],
      lockedExits: {
        door: { password: "Iceberg Theory" },
      },
    },
  });

  const firstRender = getStableGameWorld(ref, createWorld);
  firstRender.hallway.completedInteractions.push("examine portraits");
  firstRender.hallway.revealedExits.push("secret");
  delete firstRender.hallway.lockedExits.door;

  const secondRender = getStableGameWorld(ref, createWorld);

  assert.equal(secondRender, firstRender);
  assert.deepEqual(secondRender.hallway.completedInteractions, [
    "examine portraits",
  ]);
  assert.deepEqual(secondRender.hallway.revealedExits, ["secret"]);
  assert.equal(secondRender.hallway.lockedExits.door, undefined);
});

test("getStableGameWorld does not call createWorld again after init", () => {
  const ref = { current: null };
  let creates = 0;
  const createWorld = () => {
    creates += 1;
    return { start: { items: [] } };
  };

  getStableGameWorld(ref, createWorld);
  getStableGameWorld(ref, createWorld);
  getStableGameWorld(ref, createWorld);

  assert.equal(creates, 1);
});
