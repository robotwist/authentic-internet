import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { createArtifact, getCreationStatus } from "../api/api";
import SoundManager from "./utils/SoundManager";
import { getRandomQuote, getCategoryQuote } from "../utils/quoteSystem.js";
import "./ArtifactCreation.css";
import { useAuth } from "../context/AuthContext";
import ArtifactForm from "./ArtifactForm";
import { useSoundUtils } from "../hooks/useSound";
import PuzzleArtifactCreator from "./PuzzleArtifactCreator";

const ARTIFACT_THEMES = [
  { value: "wisdom", label: "Wisdom & Philosophy" },
  { value: "inspiration", label: "Inspiration & Motivation" },
  { value: "nature", label: "Nature & Exploration" },
  { value: "literature", label: "Literature & Poetry" },
  { value: "history", label: "History & Legacy" },
  { value: "personal", label: "Personal Reflection" },
];

const ArtifactCreation = ({
  position,
  onClose,
  onSuccess,
  refreshArtifacts,
  isFirstArtifact = false,
  onCancel,
  currentArea,
}) => {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [soundManager, setSoundManager] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
  });
  const { playSuccess, playError } = useSoundUtils();
  const [showPuzzleCreator, setShowPuzzleCreator] = useState(false);
  const [creationStatus, setCreationStatus] = useState(null);

  // Initialize sound manager
  useEffect(() => {
    const initSoundManager = async () => {
      const manager = SoundManager.getInstance();
      await manager.initialize();
      setSoundManager(manager);
    };
    initSoundManager();
  }, []);

  // Fetch creation status (2nd-artifact token gating)
  useEffect(() => {
    if (!user) {
      setCreationStatus(null);
      return;
    }
    getCreationStatus()
      .then((data) => data && setCreationStatus(data))
      .catch(() => setCreationStatus(null));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to create artifacts");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Get a random quote for inspiration if content is empty
      if (!formData.content.trim()) {
        const quote = getRandomQuote();
        formData.content = quote.text;
      }

      // Get an inspirational quote for the artifact
      let quote;
      try {
        quote =
          formData.type === "wisdom"
            ? getCategoryQuote("wisdom")
            : getRandomQuote();
      } catch (err) {
        console.error("Failed to fetch quote:", err);
        quote = {
          text: "The journey of a thousand miles begins with a single step.",
          author: "Lao Tzu",
          type: "wisdom",
        };
      }

      // Prepare artifact data
      const artifactData = {
        ...formData,
        creator: user.id,
        area: formData.area || currentArea,
        location: {
          x: position.x,
          y: position.y,
          area: currentArea,
        },
        quote: quote.text,
        quoteAuthor: quote.author,
        createdAt: new Date().toISOString(),
      };

      // Create the artifact
      const response = await createArtifact(artifactData);
      const artifact = response?.artifact ?? response;

      if (artifact?.id ?? artifact?._id) {
        if (soundManager) soundManager.playSound("artifact_create");
        onSuccess?.(artifact);
        getCreationStatus().then((d) => d && setCreationStatus(d)).catch(() => {});
        onClose?.();
        playSuccess();
      } else {
        setError(response?.message ?? "Failed to create artifact");
        if (soundManager) soundManager.playSound("error");
        playError();
      }
    } catch (err) {
      console.error("Error creating artifact:", err);
      setError(
        err?.code === "CREATION_TOKEN_REQUIRED"
          ? err.message
          : "Failed to create artifact. Please try again."
      );
      if (soundManager) soundManager.playSound("error");
      playError();
      if (err?.code === "CREATION_TOKEN_REQUIRED" && creationStatus) {
        setCreationStatus((s) => (s ? { ...s, canCreate: false, creationTokens: 0 } : s));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (soundManager) soundManager.playSound("bump");
    onCancel?.();
    onClose?.();
  };

  const handlePuzzleArtifactSubmit = async (puzzleData) => {
    try {
      const response = await fetch("/api/artifacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(puzzleData),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          response.status === 403 && result?.code === "CREATION_TOKEN_REQUIRED"
            ? result?.message ?? "You need a creation token to create another artifact. Complete an artifact you didn't create to earn one."
            : result?.message ?? "Failed to create puzzle artifact";
        throw new Error(msg);
      }

      const artifact = result?.artifact ?? result;
      if (artifact?.id ?? artifact?._id) {
        setShowPuzzleCreator(false);
        onClose?.();
        if (typeof window !== "undefined" && window.refreshArtifacts) {
          window.refreshArtifacts();
        }
      }
    } catch (err) {
      console.error("Error creating puzzle artifact:", err);
      throw err;
    }
  };

  return (
    <>
      <div className="artifact-creation-overlay">
        <div className="artifact-creation-modal">
          <div className="modal-header">
            <h2>Create New Artifact</h2>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>

          {creationStatus && !creationStatus.canCreate && (
            <div className="creation-token-notice" role="status">
              <strong>Creation token required.</strong>{" "}
              {creationStatus.message ?? "Complete an artifact you didn't create to earn a creation token for your next artifact."}
            </div>
          )}

          <div className="creation-options">
            <button
              className="creation-option-btn"
              onClick={() => setShowForm(true)}
            >
              <div className="option-icon">📜</div>
              <h3>Standard Artifact</h3>
              <p>Create a traditional artifact with text, images, or files</p>
            </button>

            <button
              className="creation-option-btn puzzle-option"
              onClick={() => setShowPuzzleCreator(true)}
            >
              <div className="option-icon">🧩</div>
              <h3>Interactive Puzzle</h3>
              <p>
                Create an interactive puzzle or game for other players to solve
              </p>
              <span className="new-badge">NEW!</span>
            </button>
          </div>

          {showForm && (
            <div className="artifact-form">
              {error && <div className="error-message">{error}</div>}
              <ArtifactForm
                onSubmit={handleSubmit}
                onClose={handleCancel}
                currentArea={currentArea}
                isFirstArtifact={isFirstArtifact}
                loading={isSubmitting}
                formData={formData}
                setFormData={setFormData}
              />
            </div>
          )}
        </div>
      </div>

      {showPuzzleCreator && (
        <PuzzleArtifactCreator
          onSubmit={handlePuzzleArtifactSubmit}
          onClose={() => setShowPuzzleCreator(false)}
          currentArea={currentArea}
        />
      )}
    </>
  );
};

ArtifactCreation.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  refreshArtifacts: PropTypes.func,
  isFirstArtifact: PropTypes.bool,
  onCancel: PropTypes.func,
  currentArea: PropTypes.string,
};

export default ArtifactCreation;
