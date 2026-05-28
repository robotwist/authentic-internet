import gameStateManager from "../../client/src/utils/gameStateManager";

describe("gameStateManager", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    global.fetch = jest.fn();
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key) => (key === "token" ? "test-token" : null),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("accepts raw saved game state from the user game-state endpoint", async () => {
    const savedState = {
      characterPosition: { x: 64, y: 64 },
      currentMapIndex: 0,
      inventory: [],
      achievements: [],
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => savedState,
    });

    await expect(gameStateManager.saveToServer(savedState)).resolves.toEqual(
      savedState,
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/game-state",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(savedState),
      }),
    );
  });
});
