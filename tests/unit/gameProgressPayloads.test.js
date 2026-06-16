import {
  buildArtifactProgressPayload,
  buildGameProgressSnapshot,
} from "../../client/src/utils/gameProgressPayloads";

describe("game progress payload helpers", () => {
  test("builds autosave snapshots without shadowing game state", () => {
    const snapshot = buildGameProgressSnapshot({
      characterPosition: { x: 64, y: 128 },
      currentMapIndex: 2,
      inventory: [{ id: "key" }],
      gameData: {
        levelCompletion: { 1: true },
        achievements: ["first-step"],
        viewedArtifacts: ["artifact-1"],
      },
    });

    expect(snapshot).toEqual({
      characterPosition: { x: 64, y: 128 },
      currentMapIndex: 2,
      inventory: [{ id: "key" }],
      levelCompletion: { 1: true },
      achievements: ["first-step"],
      viewedArtifacts: ["artifact-1"],
    });
  });

  test("builds artifact persistence payload from the next viewed artifact list", () => {
    const payload = buildArtifactProgressPayload({
      inventory: [{ id: "lens" }],
      viewedArtifacts: ["artifact-1", "artifact-2"],
      characterPosition: { x: 192, y: 256 },
      currentMapName: "Yosemite",
    });

    expect(payload).toEqual({
      inventory: [{ id: "lens" }],
      viewedArtifacts: ["artifact-1", "artifact-2"],
      lastPosition: {
        x: 192,
        y: 256,
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
