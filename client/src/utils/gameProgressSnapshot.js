export const buildGameProgressSnapshot = ({
  characterPosition,
  currentMapIndex,
  inventory,
  gameData,
  characterStats,
}) => ({
  characterPosition,
  currentMapIndex,
  inventory,
  levelCompletion: gameData?.levelCompletion || {},
  achievements: gameData?.achievements || [],
  viewedArtifacts: gameData?.viewedArtifacts || [],
  exp: characterStats?.experience || 0,
  level: characterStats?.level || 1,
});
