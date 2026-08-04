/**
 * Allowed pixel-art canvas sizes for character image processing.
 * Matches the client PixelCharacterCreator UI options.
 */
export const ALLOWED_CHARACTER_CANVAS_SIZES = Object.freeze([16, 32, 64]);

/**
 * Normalize client-supplied canvasSize before sharp.resize().
 * Unbounded sizes can allocate multi-GB bitmaps and OOM the process.
 *
 * @param {unknown} raw - Value from req.body.canvasSize
 * @param {number} [fallback=32]
 * @returns {number}
 */
export function normalizeCharacterCanvasSize(raw, fallback = 32) {
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (ALLOWED_CHARACTER_CANVAS_SIZES.includes(n)) {
    return n;
  }
  return fallback;
}
