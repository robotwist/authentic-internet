import React from "react";
import Character from "./Character";

const GameWorld = () => {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "green", position: "relative" }}>
      <Character />
    </div>
  );
};

export default GameWorld;
