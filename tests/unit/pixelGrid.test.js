import {
  colorFromPixel,
  createEmptyGrid,
  gridHasPaintedPixels,
} from "../../client/src/utils/pixelGrid";

describe("pixel grid helpers", () => {
  it("treats a new transparent grid as blank", () => {
    expect(gridHasPaintedPixels(createEmptyGrid())).toBe(false);
  });

  it("detects a painted pixel", () => {
    const grid = createEmptyGrid();
    grid[0][0] = "#000000";

    expect(gridHasPaintedPixels(grid)).toBe(true);
  });

  it("preserves transparent image pixels while importing saved sprites", () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0]);

    expect(colorFromPixel(data, 0)).toBe("#FF0000");
    expect(colorFromPixel(data, 4)).toBe("transparent");
  });
});
