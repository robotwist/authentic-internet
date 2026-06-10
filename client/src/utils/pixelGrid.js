export const DEFAULT_GRID_SIZE = 32;

export const createEmptyGrid = (size = DEFAULT_GRID_SIZE) =>
  Array(size)
    .fill(null)
    .map(() => Array(size).fill("transparent"));

export const gridHasPaintedPixels = (grid) =>
  Array.isArray(grid) &&
  grid.some(
    (row) =>
      Array.isArray(row) &&
      row.some((color) => color && color !== "transparent"),
  );

export const colorFromPixel = (data, index) => {
  const alpha = data[index + 3];
  if (alpha === 0) return "transparent";

  const [red, green, blue] = [data[index], data[index + 1], data[index + 2]];
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
};
