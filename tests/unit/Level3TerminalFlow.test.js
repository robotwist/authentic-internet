import {
  getTerminalAdvanceAction,
  TERMINAL_ADVANCE_ACTIONS,
} from "../../client/src/components/Level3TerminalFlow";

describe("Level3Terminal flow decisions", () => {
  test("treats terminal exit nodes as completion even without a next node", () => {
    expect(
      getTerminalAdvanceAction({
        text: "Terminal session terminated.",
        next: null,
        choices: null,
        isExit: true,
      }),
    ).toEqual({ type: TERMINAL_ADVANCE_ACTIONS.COMPLETE });
  });

  test("continues linear narrative nodes", () => {
    expect(
      getTerminalAdvanceAction({
        text: "Keep going.",
        next: "next_scene",
        choices: null,
      }),
    ).toEqual({ type: TERMINAL_ADVANCE_ACTIONS.NEXT, next: "next_scene" });
  });

  test("pauses on choice nodes for user input", () => {
    expect(
      getTerminalAdvanceAction({
        text: "Choose.",
        next: null,
        choices: [{ label: "Go", next: "go" }],
      }),
    ).toEqual({ type: TERMINAL_ADVANCE_ACTIONS.CHOICES });
  });
});
