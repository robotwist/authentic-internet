import {
  ACTIONS,
  gameStateReducer,
  initialState,
} from "../../client/src/hooks/useGameState";

describe("gameStateReducer", () => {
  test("applies functional character state updates", () => {
    const nextState = gameStateReducer(initialState, {
      type: ACTIONS.SET_CHARACTER_STATE,
      payload: (prev) => ({ ...prev, direction: "left" }),
    });

    expect(nextState.characterState).toEqual({
      ...initialState.characterState,
      direction: "left",
    });
  });

  test("merges functional game data updates", () => {
    const nextState = gameStateReducer(initialState, {
      type: ACTIONS.SET_GAME_DATA,
      payload: (prev) => ({
        ...prev,
        achievements: ["first-save"],
      }),
    });

    expect(nextState.gameData).toEqual({
      ...initialState.gameData,
      achievements: ["first-save"],
    });
  });

  test("merges functional portal state updates", () => {
    const nextState = gameStateReducer(initialState, {
      type: ACTIONS.SET_PORTAL_STATE,
      payload: (prev) => ({
        ...prev,
        isTransitioning: true,
      }),
    });

    expect(nextState.portalState).toEqual({
      ...initialState.portalState,
      isTransitioning: true,
    });
  });
});
