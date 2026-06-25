import {
  buildArtifactProgress,
  buildAutoSaveProgress,
} from "../../client/src/utils/gameProgressPayload";

describe("game progress payload builders", () => {
  test("builds auto-save progress from current game data", () => {
    const progress = buildAutoSaveProgress({
      characterPosition: { x: 128, y: 256 },
      currentMapIndex: 2,
      inventory: [{ id: "lantern" }],
      gameData: {
        levelCompletion: { level1: true },
        achievements: ["first-step"],
        viewedArtifacts: ["artifact-1"],
      },
    });

    expect(progress).toEqual({
      characterPosition: { x: 128, y: 256 },
      currentMapIndex: 2,
      inventory: [{ id: "lantern" }],
      levelCompletion: { level1: true },
      achievements: ["first-step"],
      viewedArtifacts: ["artifact-1"],
    });
  });

  test("builds artifact progress with the newly viewed artifact included", () => {
    const viewedArtifactsForSave = ["artifact-1", "artifact-2"];

    const progress = buildArtifactProgress({
      inventory: [{ id: "lantern" }],
      viewedArtifacts: viewedArtifactsForSave,
      characterPosition: { x: 64, y: 96 },
      currentMapName: "Yosemite",
    });

    expect(progress).toEqual({
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
