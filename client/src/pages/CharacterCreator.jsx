import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PixelGridEditor from "../components/UI/PixelGridEditor";
import API from "../api/api";
import "./CharacterCreator.css";

/**
 * Streamlined character onboarding: large pixel editor first, minimal copy.
 */
const CharacterCreator = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [characterName, setCharacterName] = useState(user?.username || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSaveFromEditor = async ({ dataURL, isBlank }) => {
    if (!dataURL) {
      setError(
        isBlank
          ? "Paint at least a few pixels before saving your character"
          : "Could not export your character. Please try again.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await API.put("/api/users/character-sprite", {
        characterSprite: dataURL,
        characterName: characterName.trim() || user?.username,
      });

      localStorage.removeItem("characterCreatorSkipped");

      if (updateUser) {
        updateUser({
          ...user,
          ...response.data?.user,
          characterSprite: dataURL,
          characterName: characterName.trim() || user?.username,
        });
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to save character:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save character. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("characterCreatorSkipped", "true");
    navigate("/dashboard");
  };

  return (
    <div className="character-creator-container character-creator-container--editor">
      <header className="creator-top-bar">
        <div>
          <h1>Create your hero</h1>
          <p className="creator-hint">
            32×32 pixel art — save when ready, or use the default character.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary btn-skip"
          onClick={handleSkip}
          disabled={saving}
        >
          Skip for now
        </button>
      </header>

      {error && <div className="error-message creator-error">{error}</div>}

      <PixelGridEditor
        onSave={handleSaveFromEditor}
        cellSize={28}
        fullscreen
        compact
        initialSprite={user?.characterSprite}
        characterName={characterName}
        onCharacterNameChange={setCharacterName}
        saving={saving}
      />
    </div>
  );
};

export default CharacterCreator;
