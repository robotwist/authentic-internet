import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ACTIONS,
  gameStateReducer,
  initialState,
} from "../../client/src/hooks/useGameState.js";
import { buildGameProgressSnapshot } from "../../client/src/utils/gameProgressSnapshot.js";

describe("game state regression fixes", () => {
  it("applies functional character state updates", () => {
    const nextState = gameStateReducer(initialState, {
      type: ACTIONS.SET_CHARACTER_STATE,
      payload: (prev) => ({ ...prev, direction: "left" }),
    });

    assert.deepEqual(nextState.characterState, {
      ...initialState.characterState,
      direction: "left",
    });
  });

  it("merges functional game data updates", () => {
    const nextState = gameStateReducer(initialState, {
      type: ACTIONS.SET_GAME_DATA,
      payload: (prev) => ({
        ...prev,
        achievements: ["first-save"],
      }),
    });

    assert.deepEqual(nextState.gameData, {
      ...initialState.gameData,
      achievements: ["first-save"],
    });
  });

  it("merges functional portal state updates", () => {
    const nextState = gameStateReducer(initialState, {
      type: ACTIONS.SET_PORTAL_STATE,
      payload: (prev) => ({
        ...prev,
        isTransitioning: true,
      }),
    });

    assert.deepEqual(nextState.portalState, {
      ...initialState.portalState,
      isTransitioning: true,
    });
  });

  it("builds the auto-save payload from current game state", () => {
    const characterPosition = { x: 128, y: 64 };
    const currentMapIndex = 2;
    const inventory = [{ id: "key", name: "Small Key" }];
    const gameData = {
      artifacts: [{ id: "artifact-1" }],
      levelCompletion: { level1: true, level2: false },
      achievements: ["cartographer"],
      viewedArtifacts: ["artifact-1"],
      databaseNPCs: [{ id: "npc-1" }],
    };

    assert.deepEqual(
      buildGameProgressSnapshot({
        characterPosition,
        currentMapIndex,
        inventory,
        gameData,
      }),
      {
        characterPosition,
        currentMapIndex,
        inventory,
        levelCompletion: gameData.levelCompletion,
        achievements: gameData.achievements,
        viewedArtifacts: gameData.viewedArtifacts,
      },
    );
  });
});
