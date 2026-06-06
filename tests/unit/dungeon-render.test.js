import { readFileSync } from "fs";
import path from "path";

describe("Dungeon", () => {
  test("initializes door callbacks before the movement effect reads them", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "client/src/components/Dungeons/Dungeon.jsx",
      ),
      "utf8",
    );

    const transitionCallback = source.indexOf(
      "const transitionToRoom = useCallback",
    );
    const doorCallback = source.indexOf(
      "const checkDoorInteraction = useCallback",
    );
    const movementEffect = source.indexOf(
      "// Check for door interaction when player moves",
    );

    expect(transitionCallback).toBeGreaterThanOrEqual(0);
    expect(doorCallback).toBeGreaterThan(transitionCallback);
    expect(movementEffect).toBeGreaterThan(doorCallback);
  });
});
