import { buildGameProgressSnapshot } from "../../client/src/utils/gameProgressSnapshot";
import { persistUserExperience } from "../../client/src/api/userProgressApi";
import { mergeGameState } from "../../server/utils/gameStateMerge";

describe("progress persistence regressions", () => {
  test("builds an autosave snapshot from the current game state", () => {
    const snapshot = buildGameProgressSnapshot({
      characterPosition: { x: 32, y: 64 },
      currentMapIndex: 2,
      inventory: [{ id: "artifact-1" }],
      gameData: {
        levelCompletion: { level1: true },
        achievements: ["first-win"],
        viewedArtifacts: ["artifact-1"],
      },
      characterStats: {
        experience: 150,
        level: 2,
      },
    });

    expect(snapshot).toEqual({
      characterPosition: { x: 32, y: 64 },
      currentMapIndex: 2,
      inventory: [{ id: "artifact-1" }],
      levelCompletion: { level1: true },
      achievements: ["first-win"],
      viewedArtifacts: ["artifact-1"],
      exp: 150,
      level: 2,
    });
  });

  test("persists the numeric XP total to the authenticated user's endpoint", async () => {
    const apiClient = {
      put: jest.fn().mockResolvedValue({
        data: { experience: 250, level: 3 },
      }),
    };

    await expect(
      persistUserExperience({
        apiClient,
        getToken: () => "jwt-token",
        experience: 250,
      }),
    ).resolves.toEqual({ experience: 250, level: 3 });

    expect(apiClient.put).toHaveBeenCalledWith("/api/users/experience", {
      experience: 250,
    });
  });

  test("requires auth before attempting to persist XP", async () => {
    const apiClient = {
      put: jest.fn(),
    };

    await expect(
      persistUserExperience({
        apiClient,
        getToken: () => null,
        experience: 250,
      }),
    ).rejects.toThrow("Authentication required");

    expect(apiClient.put).not.toHaveBeenCalled();
  });

  test("merges game-state updates without dropping unrelated progress", () => {
    const currentGameState = {
      gameProgress: {
        currentQuest: "Artifact Exploration",
        completedQuests: ["intro"],
      },
      textAdventureProgress: {
        currentRoom: "dock",
      },
      inventory: ["old-artifact"],
    };

    const merged = mergeGameState(currentGameState, {
      characterPosition: { x: 96, y: 128 },
      currentMapIndex: 1,
      inventory: ["new-artifact"],
    });

    expect(merged).toEqual({
      gameProgress: {
        currentQuest: "Artifact Exploration",
        completedQuests: ["intro"],
      },
      textAdventureProgress: {
        currentRoom: "dock",
      },
      characterPosition: { x: 96, y: 128 },
      currentMapIndex: 1,
      inventory: ["new-artifact"],
    });
  });
});
