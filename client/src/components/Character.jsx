import React, { useState, useEffect } from "react";

const Character = () => {
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const handleKeyDown = (event) => {
    const speed = 10;
    setPosition((prev) => {
      switch (event.key) {
        case "ArrowUp":
        case "w":
          return { ...prev, y: Math.max(prev.y - speed, 0) };
        case "ArrowDown":
        case "s":
          return { ...prev, y: Math.min(prev.y + speed, 300) };
        case "ArrowLeft":
        case "a":
          return { ...prev, x: Math.max(prev.x - speed, 0) };
        case "ArrowRight":
        case "d":
          return { ...prev, x: Math.min(prev.x + speed, 300) };
        default:
          return prev;
      }
    });
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        width: "32px",
        height: "32px",
        backgroundColor: "#90caf9",
        boxShadow: "0 4px 10px rgba(144, 202, 249, 0.3)",
        transition: "top 0.1s, left 0.1s",
      }}
    />
  );
};

export default Character;
