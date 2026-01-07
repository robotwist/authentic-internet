import React, { useState, useEffect } from "react";
import "./ArtifactDetails.css";
import InteractivePuzzleArtifact from "./InteractivePuzzleArtifact";

/**
 * ArtifactDetails component displays detailed information about an artifact
 *
 * @param {Object} props
 * @param {Object} props.artifact - The artifact to display details for
 * @param {Function} props.onClose - Function to call when the details should be closed
 * @param {Function} props.onCollect - Function to call when the artifact is collected (optional)
 * @param {boolean} props.isCollectible - Whether the artifact can be collected (default: true)
 * @param {boolean} props.showCloseButton - Whether to show a close button (default: true)
 */
const ArtifactDetails = ({
  artifact,
  onClose,
  onCollect,
  isCollectible = true,
  showCloseButton = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showInteractivePuzzle, setShowInteractivePuzzle] = useState(false);
  const [puzzleProgress, setPuzzleProgress] = useState(null);

  // Fetch puzzle progress for interactive artifacts
  useEffect(() => {
    const fetchPuzzleProgress = async () => {
      if (artifact?.isInteractive && user?.token) {
        try {
          const response = await fetch(
            `/api/artifacts/${artifact._id}/progress`,
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            },
          );

          if (response.ok) {
            const progress = await response.json();
            setPuzzleProgress(progress);
          }
        } catch (error) {
          console.error("Error fetching puzzle progress:", error);
        }
      }
    };

    fetchPuzzleProgress();
  }, [artifact?._id, artifact?.isInteractive, user?.token]);

  if (!artifact) return null;

  const handleCollect = () => {
    if (onCollect && artifact) {
      onCollect(artifact);
      if (onClose) onClose();
    }
  };

  // Format artifact properties for display
  const formatProperties = (properties) => {
    if (!properties || typeof properties !== "object") return null;

    return Object.entries(properties).map(([key, value]) => (
      <div key={key} className="property-item">
        <span className="property-name">{key}:</span>
        <span className="property-value">{value.toString()}</span>
      </div>
    ));
  };

  // Get artifact type display name
  const getTypeDisplay = (type) => {
    const typeMap = {
      artifact: "General Artifact",
      WEAPON: "Weapon",
      SCROLL: "Scroll/Text",
      ART: "Visual Art",
      MUSIC: "Music/Audio",
      GAME: "Game",
      PUZZLE: "Puzzle",
      STORY: "Story",
      TOOL: "Tool",
      TREASURE: "Treasure",
      PORTAL: "Portal",
      NPC: "NPC",
      ENVIRONMENT: "Environment",
    };
    return typeMap[type] || type;
  };

  // Render media content
  const renderMedia = () => {
    // Check for media array first (unified model)
    if (artifact.media && artifact.media.length > 0) {
      return (
        <div className="artifact-media-section">
          <h4>Media</h4>
          <div className="media-gallery">
            {artifact.media.map((mediaUrl, index) => {
              if (mediaUrl.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
                return (
                  <div key={index} className="media-item">
                    <img
                      src={mediaUrl}
                      alt={`${artifact.name} media ${index + 1}`}
                    />
                  </div>
                );
              } else if (mediaUrl.match(/\.(mp3|wav|ogg|m4a)$/i)) {
                return (
                  <div key={index} className="media-item">
                    <audio controls>
                      <source src={mediaUrl} />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                );
              } else if (mediaUrl.match(/\.(mp4|webm|ogg)$/i)) {
                return (
                  <div key={index} className="media-item">
                    <video controls>
                      <source src={mediaUrl} />
                      Your browser does not support the video element.
                    </video>
                  </div>
                );
              } else {
                return (
                  <div key={index} className="media-item">
                    <a
                      href={mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📎 Media File {index + 1}
                    </a>
                  </div>
                );
              }
            })}
          </div>
        </div>
      );
    }

    // Check for legacy image field
    if (artifact.image) {
      return (
        <div className="artifact-image-container">
          <img
            src={artifact.image}
            alt={artifact.name}
            className="artifact-image"
          />
        </div>
      );
    }

    return null;
  };

  const handleStartPuzzle = () => {
    setShowInteractivePuzzle(true);
  };

  const handlePuzzleComplete = (rewards) => {
    setShowInteractivePuzzle(false);
    // Refresh progress
    setPuzzleProgress((prev) => ({
      ...prev,
      completed: true,
      completedAt: new Date(),
    }));

    // Show completion notification
    if (rewards && rewards.experience) {
      // Show XP gained notification
      console.log("Puzzle completed! XP gained:", rewards.experience);
    }
  };

  return (
    <div className="artifact-details-container">
      <div className="artifact-details-card">
        {showCloseButton && (
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        )}

        <div className="artifact-header">
          <h2 className="artifact-name">
            {artifact.name || "Unknown Artifact"}
          </h2>
          {artifact.type && (
            <span className="artifact-type">
              {getTypeDisplay(artifact.type)}
            </span>
          )}
        </div>

        <div className="artifact-content">
          {renderMedia()}

          <div className="artifact-info">
            <p className="artifact-description">
              {artifact.description || "No description available."}
            </p>

            {/* Display experience reward */}
            {artifact.exp > 0 && (
              <div className="artifact-exp">
                Experience:{" "}
                <span className="exp-value">+{artifact.exp} XP</span>
              </div>
            )}

            {/* Display tags */}
            {artifact.tags && artifact.tags.length > 0 && (
              <div className="artifact-tags-section">
                <h4>Tags</h4>
                <div className="tags-list">
                  {artifact.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Display rating */}
            {artifact.rating > 0 && (
              <div className="artifact-rating">
                Rating:{" "}
                <span className="rating-value">
                  {artifact.rating.toFixed(1)} ⭐
                </span>
              </div>
            )}

            {/* Display creator */}
            {artifact.createdBy && (
              <div className="artifact-creator">
                Created by:{" "}
                <span className="creator-name">{artifact.createdBy}</span>
              </div>
            )}

            {/* Display creation date */}
            {artifact.createdAt && (
              <div className="artifact-date">
                Created:{" "}
                <span className="date-value">
                  {new Date(artifact.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {artifact.properties &&
              Object.keys(artifact.properties).length > 0 && (
                <div className="artifact-properties-section">
                  <h3
                    className="properties-header"
                    onClick={() => setExpanded(!expanded)}
                  >
                    Properties {expanded ? "▼" : "▶"}
                  </h3>

                  {expanded && (
                    <div className="properties-list">
                      {formatProperties(artifact.properties)}
                    </div>
                  )}
                </div>
              )}

            {artifact.lore && (
              <div className="artifact-lore">
                <h3>Lore</h3>
                <p>{artifact.lore}</p>
              </div>
            )}
          </div>
        </div>

        <div className="artifact-actions">
          {isCollectible && onCollect && (
            <button className="collect-button" onClick={handleCollect}>
              Add to Collection
            </button>
          )}

          {onClose && (
            <button className="details-close-button" onClick={onClose}>
              Close
            </button>
          )}
        </div>

        {/* Interactive Puzzle Section */}
        {artifact.isInteractive && (
          <div className="interactive-section">
            <h3>🧩 Interactive Puzzle</h3>
            <div className="puzzle-info">
              <div className="puzzle-stats">
                <span className="puzzle-type">
                  Type:{" "}
                  {artifact.puzzleType === "riddle"
                    ? "Riddle"
                    : artifact.puzzleType === "textAdventure"
                      ? "Text Adventure"
                      : artifact.puzzleType === "dialogChallenge"
                        ? "Dialog Challenge"
                        : artifact.puzzleType === "terminalPuzzle"
                          ? "Terminal Puzzle"
                          : artifact.puzzleType === "apiQuiz"
                            ? "API Quiz"
                            : artifact.puzzleType === "logicChallenge"
                              ? "Logic Challenge"
                              : "Unknown"}
                </span>
                <span className="puzzle-difficulty">
                  Difficulty: {artifact.gameConfig?.difficulty || "Medium"}
                </span>
                <span className="puzzle-reward">
                  Reward: {artifact.completionRewards?.experience || 10} XP
                </span>
              </div>

              {puzzleProgress && (
                <div className="puzzle-progress">
                  {puzzleProgress.completed ? (
                    <div className="completed-status">
                      ✅ Completed on{" "}
                      {new Date(
                        puzzleProgress.completedAt,
                      ).toLocaleDateString()}
                      <span className="completion-time">
                        Time: {Math.round(puzzleProgress.timeSpent / 60)}m
                      </span>
                      <span className="completion-attempts">
                        Attempts: {puzzleProgress.attempts}
                      </span>
                    </div>
                  ) : (
                    <div className="in-progress-status">
                      📊 Progress: {puzzleProgress.attempts} attempts
                      {puzzleProgress.hintsUsed > 0 && (
                        <span className="hints-used">
                          💡 {puzzleProgress.hintsUsed} hints used
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                className="start-puzzle-btn"
                onClick={handleStartPuzzle}
                disabled={puzzleProgress?.completed}
              >
                {puzzleProgress?.completed
                  ? "🏆 Completed"
                  : puzzleProgress?.attempts > 0
                    ? "🔄 Continue Puzzle"
                    : "🚀 Start Puzzle"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showInteractivePuzzle && artifact.isInteractive && (
        <InteractivePuzzleArtifact
          artifact={artifact}
          isOpen={showInteractivePuzzle}
          onClose={() => setShowInteractivePuzzle(false)}
          onComplete={handlePuzzleComplete}
        />
      )}
    </div>
  );
};

export default ArtifactDetails;
