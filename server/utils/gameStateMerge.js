export const mergeGameState = (currentGameState, gameStateUpdate) => ({
  ...(currentGameState && typeof currentGameState === 'object' && !Array.isArray(currentGameState)
    ? currentGameState
    : {}),
  ...gameStateUpdate,
});
