import { getStepPortalCollision } from "../../client/src/utils/portalStepDedupe";

describe("getStepPortalCollision", () => {
  const mapData = [
    [0, 9],
    [0, 0],
  ];
  const baseArgs = {
    currentMapIndex: 3,
    mapData,
    tileSize: 64,
    portalTileTypes: [9],
    includeTileTypeInKey: false,
  };

  it("does not dispatch again while still standing on the same dungeon portal", () => {
    const firstStep = getStepPortalCollision({
      ...baseArgs,
      characterPosition: { x: 64, y: 0 },
    });

    expect(firstStep).toMatchObject({
      shouldDispatch: true,
      nextStepKey: "3:1:0",
      detail: { tileX: 1, tileY: 0, tileType: 9 },
    });

    const afterDungeonExit = getStepPortalCollision({
      ...baseArgs,
      characterPosition: { x: 64, y: 0 },
      previousStepKey: firstStep.nextStepKey,
    });

    expect(afterDungeonExit).toMatchObject({
      shouldDispatch: false,
      nextStepKey: firstStep.nextStepKey,
      detail: { tileX: 1, tileY: 0, tileType: 9 },
    });
  });

  it("allows dispatching again after the player steps off and back onto the portal", () => {
    const previousStepKey = "3:1:0";
    const steppedAway = getStepPortalCollision({
      ...baseArgs,
      characterPosition: { x: 0, y: 0 },
      previousStepKey,
    });

    expect(steppedAway).toMatchObject({
      shouldDispatch: false,
      nextStepKey: "",
      detail: null,
    });

    const steppedBack = getStepPortalCollision({
      ...baseArgs,
      characterPosition: { x: 64, y: 0 },
      previousStepKey: steppedAway.nextStepKey,
    });

    expect(steppedBack.shouldDispatch).toBe(true);
  });
});
