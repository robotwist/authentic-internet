import { act, renderHook } from "@testing-library/react";
import { useGameState } from "../../client/src/hooks/useGameState";

describe("useGameState", () => {
  it("supports functional updates for reducer-backed setters", () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.setInventory((prev) => [...prev, { id: "artifact-1" }]);
      result.current.setCurrentMapIndex((prev) => prev + 2);
      result.current.setCharacterState((prev) => ({
        ...prev,
        direction: "left",
      }));
      result.current.setPortalState((prev) => ({
        ...prev,
        isTransitioning: true,
      }));
      result.current.setGameData((prev) => ({
        ...prev,
        achievements: [{ id: "level-1" }],
      }));
      result.current.setMobileState((prev) => ({
        ...prev,
        highContrastMode: true,
      }));
    });

    expect(result.current.inventory).toEqual([{ id: "artifact-1" }]);
    expect(result.current.currentMapIndex).toBe(2);
    expect(result.current.characterState.direction).toBe("left");
    expect(result.current.characterState.style.left).toBe(64);
    expect(result.current.portalState.isTransitioning).toBe(true);
    expect(result.current.gameData.achievements).toEqual([{ id: "level-1" }]);
    expect(result.current.gameData.levelCompletion.level1).toBe(false);
    expect(result.current.mobileState.highContrastMode).toBe(true);
  });
});
