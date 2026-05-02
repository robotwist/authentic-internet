/**
 * Double map width and height (used by bundled map definitions).
 * Each source cell becomes a 2×2 block of the same tile ID — including portals,
 * trees, etc. Portal coordinates in gameplay checks (e.g. Tile.jsx) use this doubled grid.
 */
export function doubleMapSize(mapData) {
  const doubled = [];
  for (const row of mapData) {
    const doubledRow = [];
    for (const cell of row) {
      doubledRow.push(cell, cell);
    }
    doubled.push(doubledRow, [...doubledRow]);
  }
  return doubled;
}
