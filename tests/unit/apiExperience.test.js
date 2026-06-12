import {
  awardUserExperienceWithClient,
  updateUserExperienceWithClient,
} from "../../client/src/api/experienceApi";

describe("experience API helpers", () => {
  let apiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient = {
      post: jest.fn(),
      put: jest.fn(),
    };
  });

  test("awards incremental XP through the progress endpoint", async () => {
    apiClient.post.mockResolvedValue({
      data: { success: true, newExperience: 150 },
    });

    await expect(
      awardUserExperienceWithClient(apiClient, 100, "Level 1 Complete!"),
    ).resolves.toEqual({ success: true, newExperience: 150 });

    expect(apiClient.post).toHaveBeenCalledWith("/api/progress/experience", {
      amount: 100,
      reason: "Level 1 Complete!",
    });
  });

  test("updates absolute XP through the authenticated users endpoint", async () => {
    apiClient.put.mockResolvedValue({
      data: { username: "player", experience: 250, level: 3 },
    });

    await expect(
      updateUserExperienceWithClient(apiClient, 250),
    ).resolves.toEqual({
      username: "player",
      experience: 250,
      level: 3,
    });

    expect(apiClient.put).toHaveBeenCalledWith("/api/users/experience", {
      experience: 250,
    });
  });
});
