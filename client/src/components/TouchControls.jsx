import React from "react";
import "./TouchControls.css";

const TouchControls = ({ onMove, onDrop }) => {
  const handleTouchStart = (direction, e) => {
    e.preventDefault();
    onMove(direction);

    // Add active class for visual feedback
    e.currentTarget.classList.add("active");
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("active");
  };

  return (
    <div className="touch-controls">
      <div className="d-pad">
        <button
          className="d-pad-btn up"
          onTouchStart={(e) => handleTouchStart("up", e)}
          onTouchEnd={handleTouchEnd}
        >
          ▲
        </button>
        <button
          className="d-pad-btn left"
          onTouchStart={(e) => handleTouchStart("left", e)}
          onTouchEnd={handleTouchEnd}
        >
          ◀
        </button>
        <button
          className="d-pad-btn right"
          onTouchStart={(e) => handleTouchStart("right", e)}
          onTouchEnd={handleTouchEnd}
        >
          ▶
        </button>
        <button
          className="d-pad-btn down"
          onTouchStart={(e) => handleTouchStart("down", e)}
          onTouchEnd={handleTouchEnd}
        >
          ▼
        </button>
        <div className="d-pad-center"></div>
      </div>

      <button
        className="action-btn pickup-btn"
        onTouchStart={(e) => {
          e.preventDefault();
          // Dispatch a pickup event (to be handled in GameWorld)
          window.dispatchEvent(new CustomEvent("artifactPickup"));
          e.currentTarget.classList.add("active");
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("active");
        }}
      >
        Pickup
      </button>

      <button
        className="action-btn drop-btn"
        onTouchStart={(e) => {
          e.preventDefault();
          // Call the onDrop prop if provided
          if (onDrop) {
            onDrop();
          }
          e.currentTarget.classList.add("active");
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("active");
        }}
      >
        Drop
      </button>
    </div>
  );
};

export default TouchControls;
