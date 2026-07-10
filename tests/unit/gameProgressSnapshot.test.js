import { buildGameProgressSnapshot } from "../../client/src/utils/gameProgressSnapshot";

describe("buildGameProgressSnapshot", () => {
  test("builds the auto-save payload from current game state", () => {
    const characterPosition = { x: 128, y: 64 };
    const currentMapIndex = 2;
    const inventory = [{ id: "key", name: "Small Key" }];
    const gameData = {
      artifacts: [{ id: "artifact-1" }],
      levelCompletion: { level1: true, level2: false },
      achievements: ["cartographer"],
      viewedArtifacts: ["artifact-1"],
      databaseNPCs: [{ id: "npc-1" }],
    };

    expect(
      buildGameProgressSnapshot({
        characterPosition,
        currentMapIndex,
        inventory,
        gameData,
      }),
    ).toEqual({
      characterPosition,
      currentMapIndex,
      inventory,
      levelCompletion: gameData.levelCompletion,
      achievements: gameData.achievements,
      viewedArtifacts: gameData.viewedArtifacts,
    });
  });
});
