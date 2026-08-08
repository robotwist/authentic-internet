import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  userForLocalStorage,
  hasLegacyHeavyUserFields,
} from "../../client/src/utils/authStorage.js";

describe("userForLocalStorage", () => {
  it("strips characterSprite, inventory, messages, and friends", () => {
    const user = {
      id: "u1",
      username: "traveler",
      experience: 120,
      characterSprite: "data:image/png;base64,AAAA",
      inventory: [{ id: "a1", content: "huge artifact body".repeat(50) }],
      messages: [{ id: "m1", text: "hello" }],
      friends: [{ id: "f1", username: "pal" }],
      characterName: "Hero",
    };

    const stored = userForLocalStorage(user);
    assert.equal(stored.id, "u1");
    assert.equal(stored.username, "traveler");
    assert.equal(stored.experience, 120);
    assert.equal(stored.characterName, "Hero");
    assert.equal(Object.hasOwn(stored, "characterSprite"), false);
    assert.equal(Object.hasOwn(stored, "inventory"), false);
    assert.equal(Object.hasOwn(stored, "messages"), false);
    assert.equal(Object.hasOwn(stored, "friends"), false);
    // Original must remain intact for in-memory React state
    assert.equal(user.characterSprite.startsWith("data:image"), true);
    assert.equal(user.inventory.length, 1);
  });

  it("passes through nullish and non-objects", () => {
    assert.equal(userForLocalStorage(null), null);
    assert.equal(userForLocalStorage(undefined), undefined);
    assert.equal(userForLocalStorage("x"), "x");
  });
});

describe("hasLegacyHeavyUserFields", () => {
  it("detects legacy bloated stored users", () => {
    assert.equal(hasLegacyHeavyUserFields({ id: "1", username: "a" }), false);
    assert.equal(
      hasLegacyHeavyUserFields({ id: "1", characterSprite: "data:..." }),
      true,
    );
    assert.equal(
      hasLegacyHeavyUserFields({ id: "1", inventory: [] }),
      true,
    );
  });
});
