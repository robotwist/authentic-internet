import API from "../../client/src/api/api";
import gameProgressService from "../../client/src/services/GameProgressService";

jest.mock("../../client/src/api/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

describe("GameProgressService", () => {
  const resetService = () => {
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

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    resetService();
    API.put.mockResolvedValue({ data: { experience: 0, level: 1 } });
  });

  test("initializes from server progress before syncing earned XP", () => {
    localStorage.setItem("token", "token");
    API.put.mockResolvedValue({ data: { experience: 505, level: 6 } });

    gameProgressService.init({ id: "user-1", experience: 500, level: 6 });
    gameProgressService.addExperience(5);

    expect(API.put).toHaveBeenCalledWith("/api/users/experience", {
      experience: 505,
    });
  });

  test("does not sync a stale zero-based total before auth hydration", async () => {
    localStorage.setItem("token", "token");

    gameProgressService.addExperience(5);
    await Promise.resolve();

    expect(API.put).not.toHaveBeenCalled();
    expect(gameProgressService.pendingUpdates.experience).toBe(true);
    expect(localStorage.getItem("offlineExperience")).toBe("5");
  });

  test("keeps higher offline progress when server data arrives", () => {
    localStorage.setItem("offlineExperience", "850");
    localStorage.setItem("offlineLevel", "9");

    gameProgressService.init({ id: "user-1", experience: 500, level: 6 });

    expect(gameProgressService.experience).toBe(850);
    expect(gameProgressService.level).toBe(9);
    expect(gameProgressService.pendingUpdates.experience).toBe(true);
  });

  test("prefers hydrated profile XP over stale locally stored XP", () => {
    gameProgressService.init({
      id: "user-1",
      experience: 100,
      exp: 500,
      level: 6,
    });

    expect(gameProgressService.experience).toBe(500);
  });
});
