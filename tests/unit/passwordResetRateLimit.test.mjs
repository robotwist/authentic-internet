import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluatePasswordResetAttempt,
  PASSWORD_RESET_MAX_ATTEMPTS,
  PASSWORD_RESET_WINDOW_MS,
} from "../../server/utils/passwordResetRateLimit.js";

describe("evaluatePasswordResetAttempt", () => {
  it("allows the first three attempts within a window", () => {
    const t0 = 1_700_000_000_000;
    let record = null;

    for (let i = 1; i <= PASSWORD_RESET_MAX_ATTEMPTS; i += 1) {
      const result = evaluatePasswordResetAttempt(record, t0 + i);
      assert.equal(result.allowed, true);
      assert.equal(result.record.count, i);
      record = result.record;
    }
  });

  it("blocks the fourth attempt inside the same hour window", () => {
    const t0 = 1_700_000_000_000;
    let record = null;

    for (let i = 0; i < PASSWORD_RESET_MAX_ATTEMPTS; i += 1) {
      record = evaluatePasswordResetAttempt(record, t0 + i).record;
    }

    const blocked = evaluatePasswordResetAttempt(record, t0 + 1_000);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSeconds > 0);
    assert.equal(blocked.record.count, PASSWORD_RESET_MAX_ATTEMPTS);
  });

  it("renews the window after expiry instead of permanently bypassing the limit", () => {
    const t0 = 1_700_000_000_000;
    let record = null;

    for (let i = 0; i < PASSWORD_RESET_MAX_ATTEMPTS; i += 1) {
      record = evaluatePasswordResetAttempt(record, t0 + i).record;
    }

    // Pre-fix bug: once the hour elapsed, count kept growing and every
    // subsequent request was allowed forever. The window must reset.
    const afterWindow = evaluatePasswordResetAttempt(
      record,
      t0 + PASSWORD_RESET_WINDOW_MS + 1
    );
    assert.equal(afterWindow.allowed, true);
    assert.equal(afterWindow.record.count, 1);
    assert.equal(afterWindow.record.firstAttempt, t0 + PASSWORD_RESET_WINDOW_MS + 1);

    // And the new window can still be exhausted.
    record = afterWindow.record;
    record = evaluatePasswordResetAttempt(record, t0 + PASSWORD_RESET_WINDOW_MS + 2).record;
    record = evaluatePasswordResetAttempt(record, t0 + PASSWORD_RESET_WINDOW_MS + 3).record;
    const blockedAgain = evaluatePasswordResetAttempt(
      record,
      t0 + PASSWORD_RESET_WINDOW_MS + 4
    );
    assert.equal(blockedAgain.allowed, false);
  });
});
