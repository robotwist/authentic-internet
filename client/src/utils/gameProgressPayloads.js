export const buildGameProgressSnapshot = ({
  characterPosition,
  currentMapIndex,
  inventory,
  gameData,
}) => ({
  characterPosition,
  currentMapIndex,
  inventory,
  levelCompletion: gameData.levelCompletion,
  achievements: gameData.achievements,
  viewedArtifacts: gameData.viewedArtifacts,
});

export const buildArtifactProgressPayload = ({
  inventory,
  viewedArtifacts,
  characterPosition,
  currentMapName,
}) => ({
  inventory,
  viewedArtifacts,
  lastPosition: {
    x: characterPosition.x,
    y: characterPosition.y,
    worldId: currentMapName,
  },
  gameProgress: {
    currentQuest: "Artifact Exploration",
    completedQuests: [],
    discoveredLocations: [currentMapName],
  },
});
