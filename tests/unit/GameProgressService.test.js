import { waitFor } from "@testing-library/react";
import API from "../../client/src/api/api";
import { GameProgressService } from "../../client/src/services/GameProgressService";

jest.mock("../../client/src/api/api", () => ({
  __esModule: true,
  default: {
    put: jest.fn(),
  },
}));

describe("GameProgressService", () => {
  beforeEach(() => {
    localStorage.clear();
    API.put.mockReset();
    API.put.mockResolvedValue({
      data: {
        experience: 250,
        level: 3,
        inventory: ["artifact-1"],
      },
    });
  });

  test("syncs NPC inventory rewards without overwriting experience", async () => {
    localStorage.setItem("token", "token");
    const service = new GameProgressService();
    service.init({
      id: "user-1",
      experience: 250,
      level: 3,
      inventory: [],
    });

    expect(service.addToInventory({ id: "artifact-1", name: "Lantern" })).toBe(
      true,
    );

    await waitFor(() => expect(API.put).toHaveBeenCalledTimes(1));

    expect(API.put).toHaveBeenCalledWith("/api/users/experience", {
      inventory: ["artifact-1"],
    });
  });

  test("syncs experience changes without sending unchanged inventory", async () => {
    localStorage.setItem("token", "token");
    const service = new GameProgressService();
    service.init({
      id: "user-1",
      experience: 250,
      level: 3,
      inventory: [{ id: "artifact-1", name: "Lantern" }],
    });

    service.addExperience(25);

    await waitFor(() => expect(API.put).toHaveBeenCalledTimes(1));

    expect(API.put).toHaveBeenCalledWith("/api/users/experience", {
      experience: 275,
      level: 3,
    });
  });
});
