import assert from "node:assert/strict";
import test from "node:test";
import { xssProtection } from "../../server/middleware/validation.js";

function runMiddleware(body) {
  const req = { body };
  const headers = {};
  const res = {
    setHeader(name, value) {
      headers[name] = value;
    },
  };
  let nextCalled = false;
  xssProtection(req, res, () => {
    nextCalled = true;
  });
  return { req, headers, nextCalled };
}

test("xssProtection does not HTML-encode request body strings", () => {
  const body = {
    name: "Bob's Artifact",
    unlockAnswer: "don't look / <script>",
    nested: { url: "https://example.com/path" },
  };
  const snapshot = structuredClone(body);

  const { req, nextCalled, headers } = runMiddleware(body);

  assert.equal(nextCalled, true);
  assert.deepEqual(req.body, snapshot);
  assert.equal(req.body.unlockAnswer, "don't look / <script>");
  assert.equal(req.body.nested.url, "https://example.com/path");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
});

test("xssProtection leaves data URLs untouched and still calls next", () => {
  const sprite = "data:image/png;base64,abc/def+==";
  const { req, nextCalled } = runMiddleware({ characterSprite: sprite });
  assert.equal(nextCalled, true);
  assert.equal(req.body.characterSprite, sprite);
});
