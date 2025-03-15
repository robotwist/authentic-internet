import React, { useState, useEffect } from "react";

const TILE_SIZE = 64; // Each tile is 64x64 pixels

const Character = ({ position }) => {
  const [characterPosition, setCharacterPosition] = useState(position);

  useEffect(() => {
    setCharacterPosition(position);
  }, [position]);

  return (
    <div
      style={{
        position: "absolute",
        left: `${characterPosition.x}px`,
        top: `${characterPosition.y}px`,
        width: `${TILE_SIZE}px`,
        height: `${TILE_SIZE}px`,
        backgroundImage: "url('../assets/character.png')",
        backgroundSize: "cover",
      }}
    />
  );
};

export default Character;
