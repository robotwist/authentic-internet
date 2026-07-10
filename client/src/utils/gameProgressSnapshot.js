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
