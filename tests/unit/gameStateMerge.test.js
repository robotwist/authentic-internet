import { mergeGameState } from "../../server/utils/gameStateMerge.js";

describe("mergeGameState", () => {
  it("preserves omitted nested progress while applying incoming fields", () => {
    const existingState = {
      inventory: ["lantern"],
      achievements: ["first-step"],
      gameProgress: {
        currentQuest: "find-the-gate",
        completedQuests: ["tutorial"],
        discoveredLocations: ["spawn"],
      },
      textAdventureProgress: {
        currentRoom: "library",
        knownPasswords: ["rosebud"],
      },
    };

    const incomingState = {
      inventory: ["lantern", "key"],
      gameProgress: {
        currentQuest: "open-the-gate",
      },
    };

    expect(mergeGameState(existingState, incomingState)).toEqual({
      inventory: ["lantern", "key"],
      achievements: ["first-step"],
      gameProgress: {
        currentQuest: "open-the-gate",
        completedQuests: ["tutorial"],
        discoveredLocations: ["spawn"],
      },
      textAdventureProgress: {
        currentRoom: "library",
        knownPasswords: ["rosebud"],
      },
    });
  });
});
