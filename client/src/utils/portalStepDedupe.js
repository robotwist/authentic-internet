export function getStepPortalCollision({
  characterPosition,
  currentMapIndex,
  mapData,
  tileSize,
  portalTileTypes,
  previousStepKey = "",
  includeTileTypeInKey = true,
}) {
  if (!characterPosition || !Array.isArray(mapData) || !mapData.length) {
    return {
      shouldDispatch: false,
      nextStepKey: previousStepKey,
      detail: null,
    };
  }

  const tileX = Math.floor(characterPosition.x / tileSize);
  const tileY = Math.floor(characterPosition.y / tileSize);
  const row = mapData[tileY];

  if (!row || tileX < 0 || tileX >= row.length) {
    return {
      shouldDispatch: false,
      nextStepKey: "",
      detail: null,
    };
  }

  const tileType = row[tileX];
  if (!portalTileTypes.includes(tileType)) {
    return {
      shouldDispatch: false,
      nextStepKey: "",
      detail: null,
    };
  }

  const stepKey = includeTileTypeInKey
    ? `${currentMapIndex}:${tileX}:${tileY}:${tileType}`
    : `${currentMapIndex}:${tileX}:${tileY}`;

  if (previousStepKey === stepKey) {
    return {
      shouldDispatch: false,
      nextStepKey: stepKey,
      detail: { tileX, tileY, tileType },
    };
  }

  return {
    shouldDispatch: true,
    nextStepKey: stepKey,
    detail: { tileX, tileY, tileType },
  };
}
