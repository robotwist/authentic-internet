import { act, renderHook } from "@testing-library/react";
import { useGameState } from "../../client/src/hooks/useGameState";

describe("useGameState", () => {
  test("applies functional updates to merged state slices", () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.setCharacterStats((prev) => ({
        ...prev,
        experience: prev.experience + 25,
      }));
      result.current.setGameData((prev) => ({
        ...prev,
        levelCompletion: {
          ...prev.levelCompletion,
          level1: true,
        },
      }));
      result.current.setPortalState((prev) => ({
        ...prev,
        isTransitioning: true,
      }));
    });

    expect(result.current.characterStats.experience).toBe(25);
    expect(result.current.gameData.levelCompletion.level1).toBe(true);
    expect(result.current.portalState.isTransitioning).toBe(true);
  });

  test("applies functional updates to direct value setters", () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.setRupees((prev) => prev + 5);
      result.current.setKeys((prev) => prev + 1);
      result.current.setCharacterState((prev) => ({
        ...prev,
        isHit: true,
      }));
    });

    expect(result.current.rupees).toBe(5);
    expect(result.current.keys).toBe(1);
    expect(result.current.characterState).toEqual(
      expect.objectContaining({
        direction: "down",
        isHit: true,
      }),
    );
  });
});
