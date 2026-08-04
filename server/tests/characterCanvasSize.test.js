import {
  ALLOWED_CHARACTER_CANVAS_SIZES,
  normalizeCharacterCanvasSize,
} from "../utils/characterCanvasSize.js";

describe("normalizeCharacterCanvasSize", () => {
  test("accepts UI-allowed canvas sizes", () => {
    for (const size of ALLOWED_CHARACTER_CANVAS_SIZES) {
      expect(normalizeCharacterCanvasSize(size)).toBe(size);
      expect(normalizeCharacterCanvasSize(String(size))).toBe(size);
    }
  });

  test("rejects huge sizes that would OOM sharp.resize", () => {
    expect(normalizeCharacterCanvasSize(50000)).toBe(32);
    expect(normalizeCharacterCanvasSize("100000")).toBe(32);
    expect(normalizeCharacterCanvasSize("999999999")).toBe(32);
  });

  test("rejects invalid / missing values with fallback", () => {
    expect(normalizeCharacterCanvasSize(undefined)).toBe(32);
    expect(normalizeCharacterCanvasSize(null)).toBe(32);
    expect(normalizeCharacterCanvasSize("")).toBe(32);
    expect(normalizeCharacterCanvasSize("abc")).toBe(32);
    expect(normalizeCharacterCanvasSize(0)).toBe(32);
    expect(normalizeCharacterCanvasSize(-1)).toBe(32);
    expect(normalizeCharacterCanvasSize(8)).toBe(32);
    expect(normalizeCharacterCanvasSize(128)).toBe(32);
  });

  test("supports custom fallback", () => {
    expect(normalizeCharacterCanvasSize("nope", 16)).toBe(16);
  });
});
