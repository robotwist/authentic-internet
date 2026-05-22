import { waitFor } from "@testing-library/react";
import API from "../../client/src/api/api";
import gameProgressService from "../../client/src/services/GameProgressService";
import {
  getAuthToken,
  getGameProgress,
  saveGameProgress,
} from "../../client/src/utils/authUtils";

jest.mock("../../client/src/api/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock("../../client/src/utils/authUtils", () => ({
  __esModule: true,
  getAuthToken: jest.fn(() => null),
  saveGameProgress: jest.fn(),
  getGameProgress: jest.fn((key, defaultValue) => defaultValue),
}));

const resetService = () => {
  gameProgressService.initialized = false;
  gameProgressService.syncInProgress = false;
  gameProgressService.userData = null;
  gameProgressService.inventory = [];
  gameProgressService.experience = 0;
  gameProgressService.level = 1;
  gameProgressService.pendingExperienceDelta = 0;
  gameProgressService.pendingUpdates = {
    inventory: false,
    experience: false,
    achievements: false,
  };
};

describe("GameProgressService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAuthToken.mockReturnValue("token");
    getGameProgress.mockImplementation((key, defaultValue) => defaultValue);
    resetService();
  });

  test("hydrates before syncing an XP delta so server progress is not overwritten", async () => {
    API.get.mockResolvedValue({
      data: { id: "user-1", exp: 500, level: 6, inventory: [] },
    });
    API.post.mockResolvedValue({
      data: { success: true, newExperience: 505, newLevel: 6 },
    });

    gameProgressService.addExperience(5);

    await waitFor(() => expect(API.post).toHaveBeenCalledTimes(1));

    expect(API.get).toHaveBeenCalledWith("/api/users/me");
    expect(API.post).toHaveBeenCalledWith("/api/progress/experience", {
      amount: 5,
      reason: "game-progress-service",
    });
    expect(API.put).not.toHaveBeenCalledWith(
      "/api/users/experience",
      expect.anything(),
    );
    expect(gameProgressService.experience).toBe(505);
    expect(gameProgressService.level).toBe(6);
    expect(gameProgressService.pendingUpdates.experience).toBe(false);
    expect(saveGameProgress).toHaveBeenCalledWith("offlineExperience", 505);
  });

  test("does not write stale XP when an authenticated inventory update syncs", () => {
    gameProgressService.addToInventory({ id: "guide-token", name: "Guide Token" });

    expect(API.put).not.toHaveBeenCalledWith(
      "/api/users/experience",
      expect.anything(),
    );
    expect(API.post).not.toHaveBeenCalledWith(
      "/api/progress/experience",
      expect.anything(),
    );
  });

  test("normalizes /me profile experience before local progress is used", () => {
    gameProgressService.init({
      id: "user-1",
      exp: 250,
      level: 3,
      inventory: [],
    });

    expect(gameProgressService.experience).toBe(250);
    expect(gameProgressService.level).toBe(3);
    expect(gameProgressService.userData.experience).toBe(250);
  });
});
