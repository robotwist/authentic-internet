import assert from "node:assert/strict";
import test from "node:test";
import { createFreshFrameLoop } from "../../client/src/components/level4GameLoop.js";

function fakeScheduler() {
  const queue = [];
  let nextId = 1;
  const requestFrame = (callback) => {
    const id = nextId++;
    queue.push({ id, callback });
    return id;
  };
  const cancelFrame = (id) => {
    const index = queue.findIndex((item) => item.id === id);
    if (index >= 0) queue.splice(index, 1);
  };
  return { queue, requestFrame, cancelFrame };
}

test("frame loop runs the step installed after start, not the one from start", () => {
  const { queue, requestFrame, cancelFrame } = fakeScheduler();
  const loop = createFreshFrameLoop(requestFrame, cancelFrame);
  const seen = [];

  loop.stepRef.current = () => seen.push("stale");
  loop.start();
  loop.stepRef.current = (timestamp) => seen.push(`fresh:${timestamp}`);

  const frame = queue.shift();
  frame.callback(32);

  assert.deepEqual(seen, ["fresh:32"]);
  assert.equal(queue.length, 1);
});

test("stop cancels the pending frame and does not schedule another", () => {
  const { queue, requestFrame, cancelFrame } = fakeScheduler();
  const loop = createFreshFrameLoop(requestFrame, cancelFrame);
  let calls = 0;
  loop.stepRef.current = () => {
    calls += 1;
  };

  loop.start();
  assert.equal(queue.length, 1);
  loop.stop();
  assert.equal(queue.length, 0);

  loop.stepRef.current(0);
  assert.equal(calls, 1);
  assert.equal(queue.length, 0);
});

test("a step that stops the loop does not schedule the next frame", () => {
  const { queue, requestFrame, cancelFrame } = fakeScheduler();
  const loop = createFreshFrameLoop(requestFrame, cancelFrame);
  loop.stepRef.current = () => loop.stop();

  loop.start();
  const frame = queue.shift();
  frame.callback(16);

  assert.equal(queue.length, 0);
});
