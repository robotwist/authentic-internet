export const PASSWORD_RESET_MAX_ATTEMPTS = 3;
export const PASSWORD_RESET_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Evaluate whether a password-reset request should be allowed and return the
 * updated attempt record. Resets the window when it has expired so limits renew.
 *
 * @param {object|null|undefined} existingRecord
 * @param {number} now
 * @returns {{ allowed: boolean, record: { count: number, firstAttempt: number, lastAttempt: number }, retryAfterSeconds: number }}
 */
export const evaluatePasswordResetAttempt = (existingRecord, now = Date.now()) => {
  let record = existingRecord;

  if (!record || now - record.firstAttempt >= PASSWORD_RESET_WINDOW_MS) {
    record = {
      count: 0,
      firstAttempt: now,
      lastAttempt: now,
    };
  }

  if (record.count >= PASSWORD_RESET_MAX_ATTEMPTS) {
    return {
      allowed: false,
      record,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((record.firstAttempt + PASSWORD_RESET_WINDOW_MS - now) / 1000)
      ),
    };
  }

  const updated = {
    ...record,
    count: record.count + 1,
    lastAttempt: now,
  };

  return {
    allowed: true,
    record: updated,
    retryAfterSeconds: 0,
  };
};
