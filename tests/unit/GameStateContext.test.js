import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import {
  GameStateProvider,
  useGameState,
} from "../../client/src/context/GameStateContext";

const StateProbe = () => {
  const gameState = useGameState();

  return (
    <div>
      <span data-testid="experience">{gameState.experience}</span>
      <span data-testid="inventory-count">{gameState.inventory.length}</span>
    </div>
  );
};

describe("GameStateProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not overwrite saved progress before hydration completes", async () => {
    const savedState = {
      experience: 900,
      inventory: [{ id: "artifact-1", name: "Saved Artifact" }],
      equippedItem: { id: "sword-1" },
      powers: [{ id: "dash" }],
      achievements: ["first-find"],
      quests: ["intro"],
      currentWorld: "athens",
      gameProgress: { currentQuest: "Find Socrates" },
    };

    localStorage.setItem("gameState", JSON.stringify(savedState));

    render(
      <GameStateProvider>
        <StateProbe />
      </GameStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("experience")).toHaveTextContent("900");
    });

    expect(screen.getByTestId("inventory-count")).toHaveTextContent("1");
    expect(JSON.parse(localStorage.getItem("gameState"))).toMatchObject(
      savedState,
    );
  });
});
