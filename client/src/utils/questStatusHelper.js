/**
 * Helper functions to determine quest status for NPCs
 */

/**
 * Get quest status for an NPC
 * @param {string} npcId - The NPC's ID
 * @param {Array} availableQuests - Quests available from this NPC
 * @param {Array} activeQuests - Currently active quests
 * @param {Array} completedQuests - Completed quests
 * @returns {Object} Quest status object with type and count
 */
export const getNPCQuestStatus = (
  npcId,
  availableQuests = [],
  activeQuests = [],
  completedQuests = [],
) => {
  // Check if NPC has any available quests
  const hasAvailableQuests = availableQuests.some(
    (quest) =>
      quest.npcId === npcId || quest.npcId?.toString() === npcId?.toString(),
  );

  // Check if NPC has any active quests
  const npcActiveQuests = activeQuests.filter(
    (quest) =>
      quest.npcId === npcId || quest.npcId?.toString() === npcId?.toString(),
  );

  // Check if NPC has any completed quests
  const npcCompletedQuests = completedQuests.filter(
    (quest) =>
      quest.npcId === npcId || quest.npcId?.toString() === npcId?.toString(),
  );

  // Determine status priority: available > active > completed
  if (hasAvailableQuests) {
    return {
      status: "available",
      count: availableQuests.filter(
        (q) => q.npcId === npcId || q.npcId?.toString() === npcId?.toString(),
      ).length,
      icon: "!",
      color: "#f39c12", // Orange for available
      title: "Has available quests!",
    };
  } else if (npcActiveQuests.length > 0) {
    return {
      status: "active",
      count: npcActiveQuests.length,
      icon: "?",
      color: "#3498db", // Blue for active
      title: "Has active quests",
    };
  } else if (npcCompletedQuests.length > 0) {
    return {
      status: "completed",
      count: npcCompletedQuests.length,
      icon: "✓",
      color: "#27ae60", // Green for completed
      title: "Quest completed",
    };
  }

  return {
    status: "none",
    count: 0,
    icon: null,
    color: null,
    title: null,
  };
};

/**
 * Create a quest status map for all NPCs
 * @param {Array} npcs - Array of NPCs
 * @param {Array} availableQuests - Available quests
 * @param {Array} activeQuests - Active quests
 * @param {Array} completedQuests - Completed quests
 * @returns {Map} Map of NPC ID to quest status
 */
export const createQuestStatusMap = (
  npcs,
  availableQuests = [],
  activeQuests = [],
  completedQuests = [],
) => {
  const statusMap = new Map();

  npcs.forEach((npc) => {
    const npcId = npc._id || npc.id;
    if (npcId) {
      statusMap.set(
        npcId,
        getNPCQuestStatus(
          npcId,
          availableQuests,
          activeQuests,
          completedQuests,
        ),
      );
    }
  });

  return statusMap;
};
