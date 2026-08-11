import assert from "node:assert/strict";
import test from "node:test";
import { canPlayerJoinWorld } from "../../server/utils/worldJoinAccess.js";

const creatorId = "507f1f77bcf86cd799439011";
const moderatorId = "507f1f77bcf86cd799439012";
const outsiderId = "507f1f77bcf86cd799439013";

function world(overrides = {}) {
  return {
    isActive: true,
    requiresInvite: false,
    maxPlayers: 50,
    creator: { toString: () => creatorId },
    // Simulate Mongoose ObjectId entries that fail Array.includes(string)
    moderators: [
      { toString: () => creatorId },
      { toString: () => moderatorId },
    ],
    activePlayers: [],
    ...overrides,
  };
}

test("public worlds allow any player under capacity", () => {
  assert.equal(canPlayerJoinWorld(world(), outsiderId), true);
});

test("invite-only worlds allow creator even when includes would fail", () => {
  assert.equal(
    canPlayerJoinWorld(world({ requiresInvite: true }), creatorId),
    true,
  );
});

test("invite-only worlds allow moderators via string identity", () => {
  assert.equal(
    canPlayerJoinWorld(world({ requiresInvite: true }), moderatorId),
    true,
  );
});

test("invite-only worlds reject outsiders", () => {
  assert.equal(
    canPlayerJoinWorld(world({ requiresInvite: true }), outsiderId),
    false,
  );
});

test("rejects when world is full or inactive", () => {
  assert.equal(
    canPlayerJoinWorld(
      world({ activePlayers: new Array(50).fill({}) }),
      outsiderId,
    ),
    false,
  );
  assert.equal(canPlayerJoinWorld(world({ isActive: false }), outsiderId), false);
});
