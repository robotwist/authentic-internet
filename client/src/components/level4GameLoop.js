/**
 * Animation loop that always runs the latest step.
 *
 * The scheduler is started once (often from a mount effect). Later renders
 * replace `stepRef.current` so physics and input see current React state
 * instead of the state captured when the loop was first scheduled.
 */
export function createFreshFrameLoop(requestFrame, cancelFrame) {
  const stepRef = { current: () => {} };
  let frameId = null;
  let running = false;

  const tick = (timestamp) => {
    frameId = null;
    if (!running) return;

    try {
      stepRef.current(timestamp);
    } catch (error) {
      console.error("Error in game loop:", error);
    }

    if (!running || frameId != null) return;
    frameId = requestFrame(tick);
  };

  return {
    stepRef,
    start() {
      if (frameId != null) {
        cancelFrame(frameId);
        frameId = null;
      }
      running = true;
      frameId = requestFrame(tick);
    },
    stop() {
      running = false;
      if (frameId != null) {
        cancelFrame(frameId);
        frameId = null;
      }
    },
  };
}
