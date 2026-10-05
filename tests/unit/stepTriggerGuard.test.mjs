import assert from "node:assert/strict";
import test from "node:test";
import {
  consumedKeyAfterDismiss,
  dungeonStepKey,
  isYosemiteSigilTile,
  resolveStepTrigger,
  stepKeyFromPixel,
  yosemiteSigilStepKey,
} from "../../client/src/utils/stepTriggerGuard.js";

const TILE = 64;
const LIBRARY_TILE = { mapIndex: 0, tileX: 16, tileY: 30 };
const libraryKey = dungeonStepKey(
  LIBRARY_TILE.mapIndex,
  LIBRARY_TILE.tileX,
  LIBRARY_TILE.tileY,
);

test("stepping onto the Library portal fires once", () => {
  const first = resolveStepTrigger("", libraryKey, { onTriggerTile: true });
  assert.equal(first.fire, true);
  assert.equal(first.consumedKey, libraryKey);

  const stillStanding = resolveStepTrigger(first.consumedKey, libraryKey, {
    onTriggerTile: true,
  });
  assert.equal(stillStanding.fire, false);
});

test("leaving the Library west door does not re-enter while still on the portal", () => {
  const entered = resolveStepTrigger("", libraryKey, { onTriggerTile: true });
  const entryPixel = { x: 16 * TILE, y: 30 * TILE };
  const occupying = stepKeyFromPixel(0, entryPixel.x, entryPixel.y, TILE);

  const afterExit = consumedKeyAfterDismiss(entered.consumedKey, occupying);
  const backOnOverworld = resolveStepTrigger(afterExit, libraryKey, {
    blocked: false,
    onTriggerTile: true,
  });

  assert.equal(afterExit, libraryKey);
  assert.equal(backOnOverworld.fire, false);

  const clearedOnExit = consumedKeyAfterDismiss(entered.consumedKey, "");
  const bug = resolveStepTrigger("", libraryKey, { onTriggerTile: true });
  assert.equal(clearedOnExit, libraryKey);
  assert.equal(bug.fire, true);
});

test("walking off the portal and back on enters again", () => {
  let key = consumedKeyAfterDismiss(libraryKey, libraryKey);
  const walkedOff = resolveStepTrigger(key, libraryKey, {
    onTriggerTile: false,
  });
  assert.equal(walkedOff.fire, false);
  assert.equal(walkedOff.consumedKey, "");

  const steppedBack = resolveStepTrigger(walkedOff.consumedKey, libraryKey, {
    onTriggerTile: true,
  });
  assert.equal(steppedBack.fire, true);
});

test("closing a Yosemite sigil does not reopen it on the next step that stays on the tile", () => {
  const sigilKey = yosemiteSigilStepKey(4, 9, 14, 6);
  assert.equal(isYosemiteSigilTile(6), true);
  assert.equal(isYosemiteSigilTile(5), false);

  const opened = resolveStepTrigger("", sigilKey, { onTriggerTile: true });
  assert.equal(opened.fire, true);

  const whileInside = resolveStepTrigger(opened.consumedKey, sigilKey, {
    blocked: true,
    onTriggerTile: true,
  });
  assert.equal(whileInside.fire, false);

  const afterClose = consumedKeyAfterDismiss(whileInside.consumedKey, sigilKey);
  const halfTileStep = resolveStepTrigger(afterClose, sigilKey, {
    blocked: false,
    onTriggerTile: true,
  });
  assert.equal(halfTileStep.fire, false);

  const wipedOnClose = "";
  const reopened = resolveStepTrigger(wipedOnClose, sigilKey, {
    onTriggerTile: true,
  });
  assert.equal(reopened.fire, true);
});

test("leaving the sigil tile clears the guard so a later visit can enter", () => {
  const sigilKey = yosemiteSigilStepKey(4, 9, 14, 6);
  const armed = consumedKeyAfterDismiss(sigilKey, sigilKey);
  const left = resolveStepTrigger(armed, sigilKey, { onTriggerTile: false });
  assert.equal(left.consumedKey, "");
  const again = resolveStepTrigger(left.consumedKey, sigilKey, {
    onTriggerTile: true,
  });
  assert.equal(again.fire, true);
});
