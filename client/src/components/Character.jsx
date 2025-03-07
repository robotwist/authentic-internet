import React, { useState, useEffect } from "react";

const Character = () => {
  const [position, setPosition] = useState({ x: 100, y: 100 });

  const handleKeyDown = (event) => {
    const speed = 8;
    setPosition((prev) => {
      let newX = prev.x;
      let newY = prev.y;

      switch (event.key) {
        case "ArrowUp":
        case "w":
          newY = Math.max(prev.y - speed, 0);
          break;
        case "ArrowDown":
        case "s":
          newY = Math.min(prev.y + speed, 736); // Adjust to map size
          break;
        case "ArrowLeft":
        case "a":
          newX = Math.max(prev.x - speed, 0);
          break;
        case "ArrowRight":
        case "d":
          newX = Math.min(prev.x + speed, 992); // Adjust to map size
          break;
        default:
          break;
      }
      return { x: newX, y: newY };
    });
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <img
      src="/assets/nkdman_frame_0.png"
      alt="Character"
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        width: "32px",
        height: "32px",
        transition: "top 0.1s, left 0.1s",
      }}
    />
  );
};

export default Character;