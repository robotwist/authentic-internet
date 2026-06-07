import { waitFor } from "@testing-library/react";

const loadGameProgressService = async ({ token = "token" } = {}) => {
  jest.resetModules();

  const mockProgressStore = {};
  const mockApi = {
    put: jest.fn().mockResolvedValue({ data: { experience: 0, level: 1 } }),
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
  };

  jest.doMock("../../client/src/api/api", () => ({
    __esModule: true,
    default: mockApi,
  }));

  jest.doMock("../../client/src/utils/authUtils", () => ({
    __esModule: true,
    getAuthToken: jest.fn(() => token),
    saveGameProgress: jest.fn((key, data) => {
      mockProgressStore[key] = data;
      return true;
    }),
    getGameProgress: jest.fn((key, defaultValue) =>
      Object.prototype.hasOwnProperty.call(mockProgressStore, key)
        ? mockProgressStore[key]
        : defaultValue,
    ),
  }));

  const module = await import("../../client/src/services/GameProgressService");
  return { gameProgressService: module.default, mockApi, mockProgressStore };
};

describe("GameProgressService", () => {
  test("initializes inventory from persisted game state before legacy inventory", async () => {
    const { gameProgressService } = await loadGameProgressService();

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
    const { gameProgressService, mockApi } = await loadGameProgressService();
    const reward = { id: "reward-1", name: "Reward" };

    gameProgressService.init({ id: "user-1", gameState: { inventory: [] } });
    expect(gameProgressService.addToInventory(reward)).toBe(true);

    await expect(
      waitFor(() =>
        expect(mockApi.post).toHaveBeenCalledWith("/api/progress/save", {
          gameState: { inventory: [reward] },
        }),
      ),
    ).resolves.toBeUndefined();
  });

  test("does not drop inventory updates queued during an in-flight XP sync", async () => {
    let resolveExperienceSync;
    const { gameProgressService, mockApi } = await loadGameProgressService();
    const reward = { id: "reward-2", name: "Queued Reward" };

    mockApi.put.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveExperienceSync = resolve;
        }),
    );

    gameProgressService.init({ id: "user-1", gameState: { inventory: [] } });
    gameProgressService.addExperience(10);

    expect(mockApi.put).toHaveBeenCalledWith("/api/users/experience", {
      experience: 10,
    });

    gameProgressService.addToInventory(reward);
    expect(mockApi.post).not.toHaveBeenCalled();

    resolveExperienceSync({ data: { experience: 10, level: 1 } });

    await expect(
      waitFor(() =>
        expect(mockApi.post).toHaveBeenCalledWith("/api/progress/save", {
          gameState: { inventory: [reward] },
        }),
      ),
    ).resolves.toBeUndefined();
  });
});
