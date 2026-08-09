import assert from "node:assert/strict";
import test from "node:test";
import { clampChatHistoryLimit } from "../../server/utils/chatHistoryLimit.js";

test("defaults when limit is missing or non-numeric", () => {
  assert.equal(clampChatHistoryLimit(undefined), 50);
  assert.equal(clampChatHistoryLimit("abc"), 50);
  assert.equal(clampChatHistoryLimit(null), 50);
});

test("treats limit=0 and negatives as default (Mongo unbounded)", () => {
  assert.equal(clampChatHistoryLimit(0), 50);
  assert.equal(clampChatHistoryLimit("0"), 50);
  assert.equal(clampChatHistoryLimit(-5), 50);
});

test("clamps oversized limits", () => {
  assert.equal(clampChatHistoryLimit(1000), 100);
  assert.equal(clampChatHistoryLimit("500"), 100);
});

test("preserves valid positive limits under the max", () => {
  assert.equal(clampChatHistoryLimit(25), 25);
  assert.equal(clampChatHistoryLimit("100"), 100);
});
