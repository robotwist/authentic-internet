import gameStateManager from "../../client/src/utils/gameStateManager";

describe("gameStateManager cloud saves", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("token", "test-token");
    global.fetch = jest.fn();
  });

  test("accepts game-state endpoints that return the saved state directly", async () => {
    const savedState = {
      characterPosition: { x: 128, y: 256 },
      currentMapIndex: 1,
      inventory: [],
      viewedArtifacts: ["artifact-1"],
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(savedState),
    });

    await expect(gameStateManager.saveToServer(savedState)).resolves.toEqual(
      savedState,
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/game-state",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
        body: JSON.stringify(savedState),
      }),
    );
  });

  test("still rejects explicit unsuccessful responses", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: false,
        message: "Save rejected",
      }),
    });

    await expect(
      gameStateManager.saveToServer({ inventory: [] }),
    ).rejects.toThrow("Save rejected");
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
