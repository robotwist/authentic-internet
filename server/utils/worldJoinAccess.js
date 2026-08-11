/**
 * Whether a player may join a world instance (invite / capacity checks).
 * Compares ObjectIds via string form — Array.includes fails for ObjectId vs string.
 */
export function canPlayerJoinWorld(world, userId) {
  if (!world || !world.isActive) return false;

  const uid = userId?.toString?.() ?? String(userId);

  if (world.requiresInvite) {
    const isCreator = world.creator?.toString?.() === uid;
    const isModerator = Array.isArray(world.moderators)
      && world.moderators.some((mod) => mod?.toString?.() === uid);
    if (!isCreator && !isModerator) return false;
  }

  const activeCount = Array.isArray(world.activePlayers) ? world.activePlayers.length : 0;
  const maxPlayers = world.maxPlayers ?? 50;
  if (activeCount >= maxPlayers) return false;

  return true;
}
