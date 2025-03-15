import React from "react";
import { TILE_SIZE, TILE_TYPES } from "./Constants";

const Map = ({ mapData, viewport }) => {
  return (
    <>
      {mapData
        .slice(viewport.y / TILE_SIZE, (viewport.y + 12 * TILE_SIZE) / TILE_SIZE)
        .map((row, rowIndex) =>
          row
            .slice(viewport.x / TILE_SIZE, (viewport.x + 16 * TILE_SIZE) / TILE_SIZE)
            .map((tile, colIndex) => (
              <div
                key={`tile-${rowIndex}-${colIndex}`}
                className={`tile ${TILE_TYPES[tile]}`}
                style={{
                  position: "absolute",
                  top: (rowIndex + viewport.y / TILE_SIZE) * TILE_SIZE - viewport.y,
                  left: (colIndex + viewport.x / TILE_SIZE) * TILE_SIZE - viewport.x,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
              />
            ))
        )}
    </>
  );
};

export default Map;