const mockPut = jest.fn();
const mockGetAuthToken = jest.fn();
const mockSaveGameProgress = jest.fn();
const mockGetGameProgress = jest.fn();

jest.mock("../../client/src/api/api", () => ({
  __esModule: true,
  default: {
    put: (...args) => mockPut(...args),
  },
}));

jest.mock("../../client/src/utils/authUtils", () => ({
  __esModule: true,
  getAuthToken: (...args) => mockGetAuthToken(...args),
  saveGameProgress: (...args) => mockSaveGameProgress(...args),
  getGameProgress: (...args) => mockGetGameProgress(...args),
}));

import { GameProgressService } from "../../client/src/services/GameProgressService";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("GameProgressService XP sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthToken.mockReturnValue("token");
    mockGetGameProgress.mockImplementation((_, defaultValue) => defaultValue);
    mockPut.mockResolvedValue({ data: { experience: 505, level: 6 } });
  });

  test("syncs new XP as a delta instead of a stale absolute total", async () => {
    const service = new GameProgressService();

    service.addExperience(5);
    await flushPromises();

    expect(mockPut).toHaveBeenCalledWith("/api/users/experience", {
      experience: 5,
      experienceDelta: 5,
    });
    expect(service.pendingExperienceDelta).toBe(0);
    expect(service.experience).toBe(505);
    expect(service.level).toBe(6);
  });

  test("turns offline progress above the server baseline into a delta", async () => {
    mockGetGameProgress.mockImplementation((key, defaultValue) => {
      if (key === "offlineExperience") return 510;
      if (key === "offlineLevel") return 6;
      return defaultValue;
    });
    mockPut.mockResolvedValue({ data: { experience: 510, level: 6 } });
    const service = new GameProgressService();

    service.init({ experience: 500, level: 6, inventory: [] });
    await flushPromises();

    expect(mockPut).toHaveBeenCalledWith("/api/users/experience", {
      experience: 510,
      experienceDelta: 10,
    });
    expect(service.pendingExperienceDelta).toBe(0);
    expect(service.experience).toBe(510);
  });
});
