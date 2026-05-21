const mockPut = jest.fn();
const mockInterceptors = {
  request: { use: jest.fn() },
  response: { use: jest.fn() },
};

jest.mock("axios", () => ({
  create: jest.fn(() => ({
    put: mockPut,
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    interceptors: mockInterceptors,
    defaults: { headers: { common: {} } },
  })),
}));

jest.mock("../../client/src/components/Constants", () => ({
  NPC_TYPES: {},
}));

import { updateUserExperience } from "../../client/src/api/api";

describe("updateUserExperience", () => {
  beforeEach(() => {
    mockPut.mockReset();
  });

  test("persists a numeric experience total through the configured API client", async () => {
    mockPut.mockResolvedValueOnce({ data: { experience: 150 } });

    await expect(updateUserExperience(150)).resolves.toEqual({
      experience: 150,
    });

    expect(mockPut).toHaveBeenCalledWith("/api/users/experience", {
      experience: 150,
    });
  });

  test("rejects non-numeric experience before sending an API request", async () => {
    await expect(updateUserExperience("user-id")).rejects.toThrow(
      "Experience must be a finite number",
    );

    expect(mockPut).not.toHaveBeenCalled();
  });
});
