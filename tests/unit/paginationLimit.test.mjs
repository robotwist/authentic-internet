import assert from "node:assert/strict";
import test from "node:test";
import { clampPaginationLimit } from "../../server/utils/paginationLimit.js";

test("defaults when limit is missing or non-numeric", () => {
  assert.equal(clampPaginationLimit(undefined), 20);
  assert.equal(clampPaginationLimit("abc"), 20);
  assert.equal(clampPaginationLimit(null), 20);
});

test("treats limit=0 and negatives as default (Mongo unbounded)", () => {
  assert.equal(clampPaginationLimit(0), 20);
  assert.equal(clampPaginationLimit("0"), 20);
  assert.equal(clampPaginationLimit(-5), 20);
});

test("clamps oversized limits", () => {
  assert.equal(clampPaginationLimit(1000), 100);
  assert.equal(clampPaginationLimit("500"), 100);
});

test("preserves valid positive limits under the max", () => {
  assert.equal(clampPaginationLimit(25), 25);
  assert.equal(clampPaginationLimit("100"), 100);
});
