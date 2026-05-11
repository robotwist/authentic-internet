export const TERMINAL_ADVANCE_ACTIONS = {
  CHOICES: "choices",
  COMPLETE: "complete",
  NEXT: "next",
  NONE: "none",
};

export function getTerminalAdvanceAction(narrative) {
  if (!narrative) {
    return { type: TERMINAL_ADVANCE_ACTIONS.NONE };
  }

  if (narrative.isExit) {
    return { type: TERMINAL_ADVANCE_ACTIONS.COMPLETE };
  }

  if (narrative.choices) {
    return { type: TERMINAL_ADVANCE_ACTIONS.CHOICES };
  }

  if (narrative.next) {
    return { type: TERMINAL_ADVANCE_ACTIONS.NEXT, next: narrative.next };
  }

  return { type: TERMINAL_ADVANCE_ACTIONS.NONE };
}
