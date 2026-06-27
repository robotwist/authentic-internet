import {
  buildArtifactProgressSnapshot,
  buildGameProgressSnapshot,
} from "../../client/src/utils/gameProgressSnapshots";

describe("game progress snapshot builders", () => {
  test("builds autosave payload from game state without shadowing it", () => {
    const gameData = {
      levelCompletion: { level1: true, level2: false },
      achievements: ["first-step"],
      viewedArtifacts: ["artifact-1"],
    };

    expect(
      buildGameProgressSnapshot({
        characterPosition: { x: 128, y: 192 },
        currentMapIndex: 2,
        inventory: [{ id: "compass" }],
        gameData,
      }),
    ).toEqual({
      characterPosition: { x: 128, y: 192 },
      currentMapIndex: 2,
      inventory: [{ id: "compass" }],
      levelCompletion: { level1: true, level2: false },
      achievements: ["first-step"],
      viewedArtifacts: ["artifact-1"],
    });
  });

  test("builds artifact pickup payload with the current viewed artifact list", () => {
    expect(
      buildArtifactProgressSnapshot({
        inventory: [{ id: "lantern" }],
        viewedArtifacts: ["artifact-1", "artifact-2"],
        characterPosition: { x: 64, y: 96 },
        worldId: "Yosemite",
      }),
    ).toEqual({
      inventory: [{ id: "lantern" }],
      viewedArtifacts: ["artifact-1", "artifact-2"],
      lastPosition: {
        x: 64,
        y: 96,
        worldId: "Yosemite",
      },
      gameProgress: {
        currentQuest: "Artifact Exploration",
        completedQuests: [],
        discoveredLocations: ["Yosemite"],
      },
    });
  });
});
