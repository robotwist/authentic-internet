import React from "react";
import OptimizedImage from "./OptimizedImage";
import { getLevelWinConfig } from "../constants/LevelWinConditions";
import "./RewardModal.css";

const RewardModal = ({ visible, onClose, achievement, embedded = false }) => {
  if (!visible) return null;
  const isLevelVictory = ["level1", "level2", "level3"].includes(achievement);

  // Updated URL to the Chrome Web Store, this should be replaced with the actual extension URL
  const nkdManExtensionURL =
    "https://chrome.google.com/webstore/detail/nkd-man-extension/penadbpfpdlcikkahaniobpnoikgjfoh";

  // Different content based on achievement type
  let content;
  const levelConfig = ["level1", "level2", "level3"].includes(achievement)
    ? getLevelWinConfig(achievement)
    : null;
  const headerTitle =
    achievement === "level1" ? "A Mark In The Valley" : "Achievement Unlocked";
  const continueLabel =
    achievement === "level1" ? "Return To The Valley" : "Continue Adventure";

  if (achievement === "level1") {
    content = (
      <>
        <div className="reward-icon" aria-hidden="true">ARRIVAL</div>
        <h3>Yosemite Opens</h3>
        <p>
          Granite light. Blue air. The trail has carried you out of the digital
          wilderness and into the valley.
        </p>

        <div className="reward-item">
          <img
            src="/assets/npcs/nkd-man-extension.svg"
            alt="NKD Man Chrome Extension"
            className="reward-image"
            onError={(e) => {
              console.log(
                "Image failed to load: /assets/npcs/nkd-man-extension.png",
              );
              // First try a known fallback image
              e.target.src = "/assets/tiles/portal.webp";

              // Add a second error handler for the fallback image
              e.target.onerror = () => {
                console.log("Fallback image also failed, using data URI");
                // If that also fails, use a simple data URI as last resort
                e.target.src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23cccccc"/><text x="50%" y="50%" font-family="sans-serif" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="%23333333">Image</text></svg>';
                // Remove the error handler to prevent infinite loops
                e.target.onerror = null;
              };
            }}
          />
          <div className="reward-details">
            <h4>A quiet mark on the map</h4>
            <p>
              Phase 1 is complete. John Muir is nearby, and the valley portals
              are open for those who keep walking.
            </p>
            <a
              href={nkdManExtensionURL}
              target="_blank"
              rel="noopener noreferrer"
              className="download-button"
            >
              Carry the Mark
            </a>
          </div>
        </div>

        <div className="reward-instructions">
          <h4>What remains in the valley:</h4>
          <ol>
            <li>Speak with John Muir without retriggering the win.</li>
            <li>Step onto a portal sigil to try a mini-game.</li>
            <li>Return to the trail when you are ready.</li>
          </ol>
        </div>
      </>
    );
  } else if (achievement === "level2" && levelConfig) {
    content = (
      <>
        <div className="reward-icon" aria-hidden="true">LVL 2</div>
        <h3>{levelConfig.title}</h3>
        <p>{levelConfig.subtext}</p>
        <div className="reward-item">
          <div className="reward-details">
            <h4>Rewards Unlocked</h4>
            <p>
              White Sword, Heart Container, and the knowledge of the Library.
            </p>
          </div>
        </div>
      </>
    );
  } else if (achievement === "level3" && levelConfig) {
    content = (
      <>
        <div className="reward-icon" aria-hidden="true">LVL 3</div>
        <h3>{levelConfig.title}</h3>
        <p>{levelConfig.subtext}</p>
        <div className="reward-item">
          <div className="reward-details">
            <h4>Terminal Master</h4>
            <p>
              You've proven your worth in the digital shadow. New paths await.
            </p>
          </div>
        </div>
      </>
    );
  } else {
    // Default content for other achievements
    content = (
      <>
        <div className="reward-icon" aria-hidden="true">WIN</div>
        <h3>Achievement Unlocked!</h3>
        <p>{levelConfig?.subtext ?? "Congratulations on your achievement!"}</p>
      </>
    );
  }

  const inner = (
    <div
      className={
        [
          "reward-modal",
          embedded ? "reward-modal--embedded" : "",
          achievement === "level1" ? "reward-modal--yosemite" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {isLevelVictory && (
        <div className="reward-fireworks" aria-hidden="true">
          <span className="firework firework--1"></span>
          <span className="firework firework--2"></span>
          <span className="firework firework--3"></span>
          <span className="firework firework--4"></span>
          <span className="firework firework--5"></span>
          <span className="firework firework--6"></span>
        </div>
      )}
      <div className="reward-modal-header">
        <h2>{headerTitle}</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="reward-content">{content}</div>

      <div className="reward-footer">
        <button className="continue-button" onClick={onClose}>
          {continueLabel}
        </button>
      </div>
    </div>
  );

  // Level wins should take over the screen for a proper celebration.
  if (embedded && !isLevelVictory) {
    return <div className="reward-modal-embedded">{inner}</div>;
  }

  return <div className="reward-modal-overlay">{inner}</div>;
};

export default RewardModal;
