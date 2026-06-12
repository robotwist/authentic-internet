const mockApiClient = {
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  defaults: { headers: { common: {} } },
  post: jest.fn(),
  put: jest.fn(),
};

jest.mock("axios", () => ({
  create: jest.fn(() => mockApiClient),
  get: jest.fn(),
}), { virtual: true });

import {
  awardUserExperience,
  updateUserExperience,
} from "../../client/src/api/api";

describe("experience API helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("awards incremental XP through the progress endpoint", async () => {
    mockApiClient.post.mockResolvedValue({
      data: { success: true, newExperience: 150 },
    });

    await expect(
      awardUserExperience(100, "Level 1 Complete!"),
    ).resolves.toEqual({ success: true, newExperience: 150 });

    expect(mockApiClient.post).toHaveBeenCalledWith("/api/progress/experience", {
      amount: 100,
      reason: "Level 1 Complete!",
    });
  });

  test("updates absolute XP through the authenticated users endpoint", async () => {
    mockApiClient.put.mockResolvedValue({
      data: { username: "player", experience: 250, level: 3 },
    });

    await expect(updateUserExperience(250)).resolves.toEqual({
      username: "player",
      experience: 250,
      level: 3,
    });

    expect(mockApiClient.put).toHaveBeenCalledWith("/api/users/experience", {
      experience: 250,
    });
  });
});
