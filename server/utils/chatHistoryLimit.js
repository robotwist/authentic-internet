/**
 * Clamp chat history limit for Mongo queries.
 * MongoDB treats limit(0) as "no limit", which can load an entire collection.
 */
export function clampChatHistoryLimit(
  raw,
  { defaultLimit = 50, maxLimit = 100 } = {},
) {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultLimit;
  }
  return Math.min(parsed, maxLimit);
}
