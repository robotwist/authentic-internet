import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSmtpPassword } from "../../server/utils/smtpAuth.js";

describe("resolveSmtpPassword", () => {
  it("prefers EMAIL_PASS used by render.yaml and docs", () => {
    assert.equal(
      resolveSmtpPassword({ EMAIL_PASS: "from-render", EMAIL_PASSWORD: "legacy" }),
      "from-render"
    );
  });

  it("falls back to EMAIL_PASSWORD when EMAIL_PASS is unset", () => {
    assert.equal(
      resolveSmtpPassword({ EMAIL_PASSWORD: "legacy-only" }),
      "legacy-only"
    );
  });

  it("returns undefined when neither production email secret is set", () => {
    assert.equal(resolveSmtpPassword({}), undefined);
  });
});
