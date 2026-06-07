import { waitFor } from "@testing-library/react";
import API from "../../client/src/api/api";
import gameProgressService from "../../client/src/services/GameProgressService";

var mockToken;
var mockProgressStore;

const getMockProgressStore = () => {
  if (!mockProgressStore) mockProgressStore = {};
  return mockProgressStore;
};

jest.mock("../../client/src/api/api", () => ({
  __esModule: true,
  default: {
    put: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock("../../client/src/utils/authUtils", () => ({
  __esModule: true,
  getAuthToken: jest.fn(() => mockToken || "token"),
  saveGameProgress: jest.fn((key, data) => {
    getMockProgressStore()[key] = data;
    return true;
  }),
  getGameProgress: jest.fn((key, defaultValue) =>
    Object.prototype.hasOwnProperty.call(getMockProgressStore(), key)
      ? getMockProgressStore()[key]
      : defaultValue,
  ),
}));

const resetService = () => {
  mockProgressStore = {};
  mockToken = "token";

  API.put.mockReset();
  API.put.mockResolvedValue({ data: { experience: 0, level: 1 } });
  API.post.mockReset();
  API.post.mockResolvedValue({ data: { success: true } });

  gameProgressService.initialized = false;
  gameProgressService.syncInProgress = false;
  gameProgressService.userData = null;
  gameProgressService.inventory = [];
  gameProgressService.experience = 0;
  gameProgressService.level = 1;
  gameProgressService.pendingUpdates = {
    inventory: false,
    experience: false,
    achievements: false,
  };
};

describe("GameProgressService", () => {
  beforeEach(() => {
    resetService();
  });

  test("initializes inventory from persisted game state before legacy inventory", () => {
    gameProgressService.init({
      id: "user-1",
      inventory: ["legacy-artifact-id"],
      gameState: {
        inventory: [{ id: "reward-1", name: "Reward" }],
      },
    });

    expect(gameProgressService.getInventory()).toEqual([
      { id: "reward-1", name: "Reward" },
    ]);
  });

  test("syncs authenticated inventory rewards to persisted game state", async () => {
    const reward = { id: "reward-1", name: "Reward" };

    gameProgressService.init({ id: "user-1", gameState: { inventory: [] } });
    expect(gameProgressService.addToInventory(reward)).toBe(true);

    await expect(
      waitFor(() =>
        expect(API.post).toHaveBeenCalledWith("/api/progress/save", {
          gameState: { inventory: [reward] },
        }),
      ),
    ).resolves.toBeUndefined();
  });

  test("does not drop inventory updates queued during an in-flight XP sync", async () => {
    let resolveExperienceSync;
    const reward = { id: "reward-2", name: "Queued Reward" };

    API.put.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveExperienceSync = resolve;
        }),
    );

    gameProgressService.init({ id: "user-1", gameState: { inventory: [] } });
    gameProgressService.addExperience(10);

    expect(API.put).toHaveBeenCalledWith("/api/users/experience", {
      experience: 10,
    });

    gameProgressService.addToInventory(reward);
    expect(API.post).not.toHaveBeenCalled();

    resolveExperienceSync({ data: { experience: 10, level: 1 } });

    await expect(
      waitFor(() =>
        expect(API.post).toHaveBeenCalledWith("/api/progress/save", {
          gameState: { inventory: [reward] },
        }),
      ),
    ).resolves.toBeUndefined();
  });
});
