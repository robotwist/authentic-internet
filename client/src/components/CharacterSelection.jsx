import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import PixelCharacterCreator from "./PixelCharacterCreator";
import "./CharacterSelection.css";

const CharacterSelection = ({ onCharacterSelected, onSkip }) => {
  const { user, updateUser } = useAuth();
  const [showCreator, setShowCreator] = useState(false);
  const [userCharacters, setUserCharacters] = useState([]);
  const [publicCharacters, setPublicCharacters] = useState([]);
  const [trendingCharacters, setTrendingCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-characters");

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setIsLoading(true);

      // Load user's characters
      const userResponse = await fetch("/api/characters/my-characters", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserCharacters(userData.characters);
      }

      // Load public characters
      const publicResponse = await fetch("/api/characters/public?limit=12");
      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        setPublicCharacters(publicData.characters);
      }

      // Load trending characters
      const trendingResponse = await fetch("/api/characters/trending?limit=8");
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        setTrendingCharacters(trendingData.characters);
      }
    } catch (error) {
      console.error("Error loading characters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterCreated = (character) => {
    setUserCharacters((prev) => [character, ...prev]);
    setSelectedCharacter(character);
    setShowCreator(false);
  };

  const handleCharacterSelected = (character) => {
    setSelectedCharacter(character);
  };

  const handleConfirmSelection = async () => {
    if (!selectedCharacter) {
      alert("Please select a character first");
      return;
    }

    try {
      // Update user with selected character
      const response = await fetch("/api/users/me/character", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          characterId: selectedCharacter._id,
        }),
      });

      if (response.ok) {
        const updatedUser = { ...user, character: selectedCharacter };
        updateUser(updatedUser);
        onCharacterSelected(selectedCharacter);
      } else {
        throw new Error("Failed to update character");
      }
    } catch (error) {
      console.error("Error updating character:", error);
      alert("Failed to select character. Please try again.");
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const CharacterCard = ({ character, isSelected, onClick }) => (
    <div
      className={`character-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`Select character ${character.name}`}
    >
      <div className="character-image">
        <img
          src={character.imageUrl}
          alt={character.name}
          onError={(e) => {
            e.target.src = "/default-avatar.png";
          }}
        />
      </div>
      <div className="character-info">
        <h3>{character.name}</h3>
        {character.creator && (
          <p className="creator">by {character.creator.username}</p>
        )}
        <div className="character-stats">
          <span>❤️ {character.likes?.length || 0}</span>
          <span>👁️ {character.views || 0}</span>
          <span>⬇️ {character.downloads || 0}</span>
        </div>
      </div>
    </div>
  );

  if (showCreator) {
    return (
      <PixelCharacterCreator
        onCharacterCreated={handleCharacterCreated}
        onClose={() => setShowCreator(false)}
      />
    );
  }

  return (
    <div
      className="character-selection"
      role="dialog"
      aria-labelledby="character-selection-title"
    >
      <div className="selection-container">
        <div className="selection-header">
          <h2 id="character-selection-title">Choose Your Character</h2>
          <p>
            Select a character to represent you in the game, or create your own!
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "my-characters" ? "active" : ""}`}
            onClick={() => setActiveTab("my-characters")}
            aria-pressed={activeTab === "my-characters"}
          >
            My Characters ({userCharacters.length})
          </button>
          <button
            className={`tab-button ${activeTab === "public" ? "active" : ""}`}
            onClick={() => setActiveTab("public")}
            aria-pressed={activeTab === "public"}
          >
            Public Characters
          </button>
          <button
            className={`tab-button ${activeTab === "trending" ? "active" : ""}`}
            onClick={() => setActiveTab("trending")}
            aria-pressed={activeTab === "trending"}
          >
            Trending
          </button>
        </div>

        {/* Character Grid */}
        <div className="character-grid-container">
          {isLoading ? (
            <div className="loading">Loading characters...</div>
          ) : (
            <>
              {/* Create Character Card */}
              <div
                className="character-card create-card"
                onClick={() => setShowCreator(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setShowCreator(true)}
                aria-label="Create new character"
              >
                <div className="create-icon">+</div>
                <h3>Create New</h3>
                <p>Design your own pixel character</p>
              </div>

              {/* Character Cards */}
              {activeTab === "my-characters" &&
                (userCharacters.length > 0 ? (
                  userCharacters.map((character) => (
                    <CharacterCard
                      key={character._id}
                      character={character}
                      isSelected={selectedCharacter?._id === character._id}
                      onClick={() => handleCharacterSelected(character)}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <p>You haven't created any characters yet.</p>
                    <button
                      className="create-button"
                      onClick={() => setShowCreator(true)}
                    >
                      Create Your First Character
                    </button>
                  </div>
                ))}

              {activeTab === "public" &&
                publicCharacters.map((character) => (
                  <CharacterCard
                    key={character._id}
                    character={character}
                    isSelected={selectedCharacter?._id === character._id}
                    onClick={() => handleCharacterSelected(character)}
                  />
                ))}

              {activeTab === "trending" &&
                trendingCharacters.map((character) => (
                  <CharacterCard
                    key={character._id}
                    character={character}
                    isSelected={selectedCharacter?._id === character._id}
                    onClick={() => handleCharacterSelected(character)}
                  />
                ))}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="skip-button"
            onClick={handleSkip}
            aria-label="Skip character selection"
          >
            Skip for Now
          </button>
          <button
            className="confirm-button"
            onClick={handleConfirmSelection}
            disabled={!selectedCharacter}
            aria-label="Confirm character selection"
          >
            {selectedCharacter
              ? `Play as ${selectedCharacter.name}`
              : "Select a Character"}
          </button>
        </div>

        {/* Selected Character Preview */}
        {selectedCharacter && (
          <div className="selected-character-preview">
            <h3>Selected Character:</h3>
            <div className="preview-card">
              <img
                src={selectedCharacter.imageUrl}
                alt={selectedCharacter.name}
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                }}
              />
              <div className="preview-info">
                <h4>{selectedCharacter.name}</h4>
                {selectedCharacter.description && (
                  <p>{selectedCharacter.description}</p>
                )}
                {selectedCharacter.tags &&
                  selectedCharacter.tags.length > 0 && (
                    <div className="tags">
                      {selectedCharacter.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterSelection;
