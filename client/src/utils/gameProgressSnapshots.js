export function buildGameProgressSnapshot({
  characterPosition,
  currentMapIndex,
  inventory,
  gameData,
}) {
  return {
    characterPosition,
    currentMapIndex,
    inventory,
    levelCompletion: gameData.levelCompletion,
    achievements: gameData.achievements,
    viewedArtifacts: gameData.viewedArtifacts,
  };
}

export function buildArtifactProgressSnapshot({
  inventory,
  viewedArtifacts,
  characterPosition,
  worldId,
}) {
  return {
    inventory,
    viewedArtifacts,
    lastPosition: {
      x: characterPosition.x,
      y: characterPosition.y,
      worldId,
    },
    gameProgress: {
      currentQuest: "Artifact Exploration",
      completedQuests: [],
      discoveredLocations: [worldId],
    },
  };
}
