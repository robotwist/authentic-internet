/**
 * Auth localStorage helpers.
 * Keep large / hydrated collections out of localStorage — they block the main
 * thread on JSON.parse and can throw QuotaExceededError after /api/users/me hydrate.
 */

const LARGE_USER_FIELDS = [
  "characterSprite",
  "inventory",
  "messages",
  "friends",
];

/**
 * Return a shallow copy of user safe to persist in localStorage.
 * @param {object|null|undefined} user
 * @returns {object|null|undefined}
 */
export function userForLocalStorage(user) {
  if (!user || typeof user !== "object") return user;
  const sanitized = { ...user };
  for (const key of LARGE_USER_FIELDS) {
    delete sanitized[key];
  }
  return sanitized;
}

/**
 * True when a stored user object still contains fields that should not be persisted.
 * @param {object|null|undefined} user
 * @returns {boolean}
 */
export function hasLegacyHeavyUserFields(user) {
  if (!user || typeof user !== "object") return false;
  return LARGE_USER_FIELDS.some((key) =>
    Object.prototype.hasOwnProperty.call(user, key),
  );
}

export { LARGE_USER_FIELDS };
