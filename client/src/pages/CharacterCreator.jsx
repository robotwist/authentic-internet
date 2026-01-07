import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PixelGridEditor from "../components/UI/PixelGridEditor";
import API from "../api/api";
import "./CharacterCreator.css";

/**
 * CharacterCreator - Onboarding flow for new users to create their character
 * Shows after registration before entering the game
 */
const CharacterCreator = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1); // 1: Welcome, 2: Editor, 3: Confirm
  const [characterData, setCharacterData] = useState(null);
  const [characterName, setCharacterName] = useState(user?.username || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSaveFromEditor = ({ dataURL, grid }) => {
    setCharacterData({ dataURL, grid });
    setStep(3); // Move to confirmation step
  };

  const handleConfirmCharacter = async () => {
    if (!characterData) {
      setError("Please create a character first");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Save character sprite to backend
      const response = await API.put("/api/users/character-sprite", {
        characterSprite: characterData.dataURL,
        characterName: characterName || user?.username,
      });

      console.log("✅ Character saved:", response.data);

      // Update auth context with new character data
      if (updateUser) {
        updateUser({
          ...user,
          characterSprite: characterData.dataURL,
          characterName: characterName || user?.username,
        });
      }

      // Navigate to dashboard or game
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to save character:", err);
      setError(
        err.response?.data?.message ||
          "Failed to save character. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Use default character sprite
    navigate("/dashboard");
  };

  // Step 1: Welcome screen
  if (step === 1) {
    return (
      <div className="character-creator-container">
        <div className="welcome-screen">
          <div className="welcome-content">
            <h1>🎮 Welcome to the Authentic Internet!</h1>
            <p className="welcome-subtitle">Let's create your character</p>

            <div className="welcome-info">
              <div className="info-card">
                <span className="info-icon">🎨</span>
                <h3>Design Your Hero</h3>
                <p>Use our pixel art editor to create a unique 32x32 sprite</p>
              </div>

              <div className="info-card">
                <span className="info-icon">⚔️</span>
                <h3>Explore the World</h3>
                <p>
                  Adventure through dungeons, meet NPCs, and collect artifacts
                </p>
              </div>

              <div className="info-card">
                <span className="info-icon">📈</span>
                <h3>Level Up</h3>
                <p>Gain XP, unlock abilities, and become a legend</p>
              </div>
            </div>

            <div className="welcome-actions">
              <button className="btn-primary" onClick={() => setStep(2)}>
                Create My Character
              </button>
              <button className="btn-secondary" onClick={handleSkip}>
                Use Default Character
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Pixel editor
  if (step === 2) {
    return (
      <div className="character-creator-container">
        <div className="editor-screen">
          <button className="back-btn" onClick={() => setStep(1)}>
            ← Back
          </button>

          <PixelGridEditor onSave={handleSaveFromEditor} />
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  if (step === 3) {
    return (
      <div className="character-creator-container">
        <div className="confirm-screen">
          <div className="confirm-content">
            <h2>🎉 Your Character is Ready!</h2>

            <div className="character-preview-large">
              {characterData?.dataURL && (
                <img
                  src={characterData.dataURL}
                  alt="Your character"
                  style={{
                    imageRendering: "pixelated",
                    width: "128px",
                    height: "128px",
                  }}
                />
              )}
            </div>

            <div className="character-name-input">
              <label htmlFor="character-name">Character Name:</label>
              <input
                id="character-name"
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder={user?.username || "Hero"}
                maxLength={20}
              />
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}

            <div className="confirm-actions">
              <button
                className="btn-primary"
                onClick={handleConfirmCharacter}
                disabled={saving}
              >
                {saving ? "Saving..." : "Start Adventure! 🚀"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setStep(2)}
                disabled={saving}
              >
                Edit Character
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CharacterCreator;
