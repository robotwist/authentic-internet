import {
  resolveYosemiteReturnTransition,
  YOSEMITE_RETURN_SPAWN_TILE,
} from "../../client/src/utils/yosemiteReturnPortal.js";

describe("resolveYosemiteReturnTransition", () => {
  const tileSize = 64;
  const getMapIndexByKey = (name) => (name === "Overworld 3" ? 3 : -1);

  test("returns Overworld 3 spawn in pixel coords for Yosemite tile 5", () => {
    const transition = resolveYosemiteReturnTransition({
      currentMapName: "Yosemite",
      tileType: 5,
      tileSize,
      getMapIndexByKey,
    });

    expect(transition).toEqual({
      destinationIndex: 3,
      destinationName: "Overworld 3",
      spawnPosition: {
        x: YOSEMITE_RETURN_SPAWN_TILE.x * tileSize,
        y: YOSEMITE_RETURN_SPAWN_TILE.y * tileSize,
      },
    });
    // Regression: previous action used raw {x:8,y:2} pixels and trapped/misplaced players
    expect(transition.spawnPosition).not.toEqual({ x: 8, y: 2 });
  });

  test("ignores non-return tiles and other maps", () => {
    expect(
      resolveYosemiteReturnTransition({
        currentMapName: "Yosemite",
        tileType: 6,
        tileSize,
        getMapIndexByKey,
      }),
    ).toBeNull();

    expect(
      resolveYosemiteReturnTransition({
        currentMapName: "Overworld 3",
        tileType: 5,
        tileSize,
        getMapIndexByKey,
      }),
    ).toBeNull();
  });

  test("returns null when Overworld 3 is missing", () => {
    expect(
      resolveYosemiteReturnTransition({
        currentMapName: "Yosemite",
        tileType: 5,
        tileSize,
        getMapIndexByKey: () => -1,
      }),
    ).toBeNull();
  });
});
