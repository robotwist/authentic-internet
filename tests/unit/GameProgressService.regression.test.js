import API from "../../client/src/api/api";
import gameProgressService from "../../client/src/services/GameProgressService";
import { getAuthToken, getGameProgress, saveGameProgress } from "../../client/src/utils/authUtils";

jest.mock("../../client/src/api/api", () => ({
  __esModule: true,
  default: {
    put: jest.fn(),
  },
}));

jest.mock("../../client/src/utils/authUtils", () => ({
  getAuthToken: jest.fn(),
  getGameProgress: jest.fn((_, defaultValue) => defaultValue),
  saveGameProgress: jest.fn(),
}));

describe("GameProgressService regression coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAuthToken.mockReturnValue("token");
    getGameProgress.mockImplementation((_, defaultValue) => defaultValue);
    saveGameProgress.mockReturnValue(true);

    gameProgressService.syncInProgress = false;
    gameProgressService.userData = null;
    gameProgressService.inventory = [];
    gameProgressService.experience = 5;
    gameProgressService.level = 1;
    gameProgressService.pendingUpdates = {
      inventory: false,
      experience: false,
      achievements: false,
    };
  });

  it("adopts the server XP total after a stale sync attempt", async () => {
    API.put.mockResolvedValue({
      data: {
        experience: 500,
        level: 5,
      },
    });

    await expect(gameProgressService.syncWithServer()).resolves.toBe(true);

    expect(API.put).toHaveBeenCalledWith("/api/users/experience", {
      experience: 5,
    });
    expect(gameProgressService.experience).toBe(500);
    expect(gameProgressService.level).toBe(5);
  });
});
