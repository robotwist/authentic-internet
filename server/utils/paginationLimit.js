/**
 * Clamp a MongoDB query limit so limit(0) cannot mean "unbounded".
 * MongoDB treats .limit(0) as no limit.
 */
export function clampPaginationLimit(value, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultLimit;
  }
  return Math.min(parsed, maxLimit);
}
