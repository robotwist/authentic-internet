export const getSafeGameData = (gameData = {}) => ({
  levelCompletion: gameData.levelCompletion || {},
  achievements: Array.isArray(gameData.achievements)
    ? gameData.achievements
    : [],
  viewedArtifacts: Array.isArray(gameData.viewedArtifacts)
    ? gameData.viewedArtifacts
    : [],
});

export const buildAutoSaveProgress = ({
  characterPosition,
  currentMapIndex,
  inventory,
  gameData,
}) => {
  const safeGameData = getSafeGameData(gameData);

  return {
    characterPosition,
    currentMapIndex,
    inventory,
    levelCompletion: safeGameData.levelCompletion,
    achievements: safeGameData.achievements,
    viewedArtifacts: safeGameData.viewedArtifacts,
  };
};

export const buildArtifactProgress = ({
  inventory,
  viewedArtifacts,
  characterPosition,
  currentMapName,
}) => ({
  inventory,
  viewedArtifacts: Array.isArray(viewedArtifacts) ? viewedArtifacts : [],
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
