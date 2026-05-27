import gameStateManager from "../../client/src/utils/gameStateManager.js";

describe("gameStateManager", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  it("accepts the game-state save response contract from the server", async () => {
    const state = {
      characterPosition: { x: 12, y: 34 },
      currentMapIndex: 1,
      inventory: ["key"],
    };
    const serverResult = { success: true, gameState: state };

    localStorage.setItem("token", "test-token");
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(serverResult),
    });

    await expect(gameStateManager.saveToServer(state)).resolves.toEqual(
      serverResult,
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/game-state",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
        body: JSON.stringify(state),
      }),
    );
  });

  it("treats origin coordinates as valid saved positions", () => {
    expect(
      gameStateManager.validateState({
        characterPosition: { x: 0, y: 0 },
        currentMapIndex: 0,
        inventory: [],
        userArtifacts: [],
        modifiedArtifacts: [],
        exp: 0,
      }),
    ).toBe(true);
  });
});
