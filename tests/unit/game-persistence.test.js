import React from "react";
import { act, render, screen } from "@testing-library/react";
import { useGameState } from "../../client/src/hooks/useGameState";
import gameStateManager from "../../client/src/utils/gameStateManager";

let latestGameState;

const GameStateProbe = () => {
  latestGameState = useGameState();

  return (
    <div>
      <span data-testid="experience">
        {latestGameState.characterStats.experience}
      </span>
      <span data-testid="level-complete">
        {String(latestGameState.gameData.levelCompletion.level1)}
      </span>
      <span data-testid="inventory-count">
        {latestGameState.inventory.length}
      </span>
    </div>
  );
};

describe("game persistence regressions", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
    global.fetch = jest.fn();
  });

  it("applies functional updater payloads from the game state hook", () => {
    render(<GameStateProbe />);

    act(() => {
      latestGameState.setCharacterStats((prev) => ({
        ...prev,
        experience: prev.experience + 100,
      }));
      latestGameState.setGameData((prev) => ({
        ...prev,
        levelCompletion: {
          ...prev.levelCompletion,
          level1: true,
        },
      }));
      latestGameState.setInventory((prev) => [...prev, { id: "artifact-1" }]);
    });

    expect(screen.getByTestId("experience")).toHaveTextContent("100");
    expect(screen.getByTestId("level-complete")).toHaveTextContent("true");
    expect(screen.getByTestId("inventory-count")).toHaveTextContent("1");
  });

  it("treats a raw saved game state response as a successful cloud save", async () => {
    localStorage.setItem("token", "jwt-token");
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ exp: 100, currentMapIndex: 1 }),
    });

    await expect(
      gameStateManager.saveToServer({ exp: 100, currentMapIndex: 1 }),
    ).resolves.toEqual({ exp: 100, currentMapIndex: 1 });
  });
});
