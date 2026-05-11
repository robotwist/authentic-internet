import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  getTerminalAdvanceAction,
  TERMINAL_ADVANCE_ACTIONS,
} from "../../client/src/components/Level3TerminalFlow.js";

describe("Level3Terminal flow decisions", () => {
  it("treats terminal exit nodes as completion even without a next node", () => {
    assert.deepEqual(
      getTerminalAdvanceAction({
        text: "Terminal session terminated.",
        next: null,
        choices: null,
        isExit: true,
      }),
      { type: TERMINAL_ADVANCE_ACTIONS.COMPLETE },
    );
  });

  it("continues linear narrative nodes", () => {
    assert.deepEqual(
      getTerminalAdvanceAction({
        text: "Keep going.",
        next: "next_scene",
        choices: null,
      }),
      { type: TERMINAL_ADVANCE_ACTIONS.NEXT, next: "next_scene" },
    );
  });

  it("pauses on choice nodes for user input", () => {
    assert.deepEqual(
      getTerminalAdvanceAction({
        text: "Choose.",
        next: null,
        choices: [{ label: "Go", next: "go" }],
      }),
      { type: TERMINAL_ADVANCE_ACTIONS.CHOICES },
    );
  });
});
