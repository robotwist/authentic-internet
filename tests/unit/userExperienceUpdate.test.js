import {
  buildExperienceUpdatePipeline,
  updateUserExperience,
  validateExperienceUpdatePayload,
} from "../../server/utils/experienceUpdate";

describe("user experience updates", () => {
  test("legacy absolute totals cannot lower stored experience", () => {
    expect(buildExperienceUpdatePipeline({ experience: 5 })).toEqual([
      {
        $set: {
          experience: {
            $max: [{ $ifNull: ["$experience", 0] }, 5],
          },
        },
      },
      {
        $set: {
          level: {
            $add: [
              { $floor: { $divide: ["$experience", 100] } },
              1,
            ],
          },
        },
      },
    ]);
  });

  test("delta sync preserves new gains and offline absolute totals", () => {
    expect(
      buildExperienceUpdatePipeline({ experience: 510, experienceDelta: 5 }),
    ).toEqual([
      {
        $set: {
          experience: {
            $max: [
              { $ifNull: ["$experience", 0] },
              510,
              { $add: [{ $ifNull: ["$experience", 0] }, 5] },
            ],
          },
        },
      },
      {
        $set: {
          level: {
            $add: [
              { $floor: { $divide: ["$experience", 100] } },
              1,
            ],
          },
        },
      },
    ]);
  });

  test("rejects invalid experience payloads", () => {
    expect(validateExperienceUpdatePayload({})).toBe(
      "Experience must be a number",
    );
    expect(validateExperienceUpdatePayload({ experience: -1 })).toBe(
      "Experience must be a non-negative number",
    );
    expect(validateExperienceUpdatePayload({ experienceDelta: Infinity })).toBe(
      "Experience delta must be a non-negative number",
    );
  });

  test("updates users with the monotonic pipeline and selected fields", async () => {
    const selectedUser = {
      username: "testuser",
      email: "test@example.com",
      experience: 505,
      level: 6,
    };
    const select = jest.fn().mockResolvedValue(selectedUser);
    const UserModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ select }),
    };

    await expect(
      updateUserExperience(UserModel, "user-1", {
        experience: 5,
        experienceDelta: 5,
      }),
    ).resolves.toBe(selectedUser);

    expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user-1",
      buildExperienceUpdatePipeline({ experience: 5, experienceDelta: 5 }),
      { new: true },
    );
    expect(select).toHaveBeenCalledWith("username email experience level");
  });
});
