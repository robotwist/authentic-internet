import React from "react";
import "./TitleArea.css";

const TitleArea = ({ showLogo = true, showTitle = true, size = "medium" }) => {
  return (
    <div className={`title-area ${size}`}>
      {showLogo && (
        <div className="logo-container">
          <img
            src="/favicon.png"
            alt="Authentic Internet Logo"
            className="logo-image"
          />
        </div>
      )}
      {showTitle && (
        <div className="title-container">
          <h1 className="app-title">AUTHENTIC INTERNET</h1>
        </div>
      )}
    </div>
  );
};

export default TitleArea;
