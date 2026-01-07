import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./shared/Button";
import "./PuzzleArtifactCreator.css";

const PuzzleArtifactCreator = ({
  onSubmit,
  onClose,
  currentArea = "overworld",
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [puzzleData, setPuzzleData] = useState({
    // Basic Info
    name: "",
    description: "",
    puzzleType: "riddle",
    difficulty: "medium",

    // Game Configuration
    gameConfig: {
      allowedAttempts: -1,
      timeLimit: null,
      hintsEnabled: true,
      collaborative: false,
    },

    // Completion Rewards
    completionRewards: {
      experience: 25,
      items: [],
      achievements: [],
      unlockArtifacts: [],
    },

    // Puzzle-specific data
    riddle: "",
    unlockAnswer: "",

    // Text Adventure
    rooms: [],
    startRoom: "",
    winCondition: {},

    // Dialog Challenge
    dialogTree: [],
    startDialog: "",

    // Terminal Puzzle
    terminalCommands: {},
    terminalFiles: {},
    terminalWinCondition: {},

    // API Quiz
    apiSource: "quotes",
    questions: [],

    // Logic Challenge
    logicType: "math",
    challengeData: {},
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const puzzleTypes = [
    {
      value: "riddle",
      label: "Simple Riddle",
      description: "A question with a text answer",
    },
    {
      value: "textAdventure",
      label: "Text Adventure",
      description: "Multi-room interactive story",
    },
    {
      value: "dialogChallenge",
      label: "Dialog Challenge",
      description: "Conversation-based puzzle",
    },
    {
      value: "terminalPuzzle",
      label: "Terminal Puzzle",
      description: "Command-line interface challenge",
    },
    {
      value: "apiQuiz",
      label: "API Quiz",
      description: "Quiz using real-time data",
    },
    {
      value: "logicChallenge",
      label: "Logic Challenge",
      description: "Math or pattern puzzle",
    },
  ];

  const difficultyLevels = [
    { value: "easy", label: "Easy", exp: 15, color: "#2ecc71" },
    { value: "medium", label: "Medium", exp: 25, color: "#f39c12" },
    { value: "hard", label: "Hard", exp: 40, color: "#e74c3c" },
    { value: "expert", label: "Expert", exp: 60, color: "#9b59b6" },
  ];

  // Update experience based on difficulty
  useEffect(() => {
    const difficulty = difficultyLevels.find(
      (d) => d.value === puzzleData.difficulty,
    );
    if (difficulty) {
      setPuzzleData((prev) => ({
        ...prev,
        completionRewards: {
          ...prev.completionRewards,
          experience: difficulty.exp,
        },
      }));
    }
  }, [puzzleData.difficulty]);

  const handleBasicInfoChange = (field, value) => {
    setPuzzleData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGameConfigChange = (field, value) => {
    setPuzzleData((prev) => ({
      ...prev,
      gameConfig: {
        ...prev.gameConfig,
        [field]: value,
      },
    }));
  };

  const validatePuzzle = () => {
    if (!puzzleData.name.trim()) {
      setError("Puzzle name is required");
      return false;
    }

    if (!puzzleData.description.trim()) {
      setError("Puzzle description is required");
      return false;
    }

    switch (puzzleData.puzzleType) {
      case "riddle":
        if (!puzzleData.riddle.trim() || !puzzleData.unlockAnswer.trim()) {
          setError("Riddle and answer are required");
          return false;
        }
        break;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validatePuzzle()) return;

    setLoading(true);
    setError("");

    try {
      const artifactData = {
        name: puzzleData.name,
        description: puzzleData.description,
        area: currentArea,
        creator: user.id,
        isInteractive: true,
        puzzleType: puzzleData.puzzleType,
        gameConfig: puzzleData.gameConfig,
        completionRewards: puzzleData.completionRewards,
        riddle: puzzleData.riddle,
        unlockAnswer: puzzleData.unlockAnswer,
      };

      await onSubmit(artifactData);
    } catch (err) {
      setError(err.message || "Failed to create puzzle artifact");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderPuzzleConfig();
      case 3:
        return renderPreview();
      default:
        return renderBasicInfo();
    }
  };

  const renderBasicInfo = () => (
    <div className="creator-step">
      <h3>Basic Information</h3>

      <div className="form-group">
        <label>Puzzle Name</label>
        <input
          type="text"
          value={puzzleData.name}
          onChange={(e) => handleBasicInfoChange("name", e.target.value)}
          placeholder="Enter a catchy name for your puzzle"
          maxLength={50}
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={puzzleData.description}
          onChange={(e) => handleBasicInfoChange("description", e.target.value)}
          placeholder="Describe what players will experience"
          maxLength={200}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Puzzle Type</label>
        <div className="puzzle-type-grid">
          {puzzleTypes.map((type) => (
            <div
              key={type.value}
              className={`puzzle-type-card ${puzzleData.puzzleType === type.value ? "selected" : ""}`}
              onClick={() => handleBasicInfoChange("puzzleType", type.value)}
            >
              <h4>{type.label}</h4>
              <p>{type.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Difficulty Level</label>
        <div className="difficulty-selector">
          {difficultyLevels.map((level) => (
            <button
              key={level.value}
              type="button"
              className={`difficulty-btn ${puzzleData.difficulty === level.value ? "selected" : ""}`}
              style={{ borderColor: level.color }}
              onClick={() => handleBasicInfoChange("difficulty", level.value)}
            >
              <span className="level-name">{level.label}</span>
              <span className="level-exp">{level.exp} XP</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPuzzleConfig = () => {
    if (puzzleData.puzzleType === "riddle") {
      return (
        <div className="creator-step">
          <h3>Riddle Configuration</h3>

          <div className="form-group">
            <label>Riddle Question</label>
            <textarea
              value={puzzleData.riddle}
              onChange={(e) => handleBasicInfoChange("riddle", e.target.value)}
              placeholder="What walks on four legs in the morning..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Answer</label>
            <input
              type="text"
              value={puzzleData.unlockAnswer}
              onChange={(e) =>
                handleBasicInfoChange("unlockAnswer", e.target.value)
              }
              placeholder="Enter the correct answer"
            />
          </div>

          <div className="riddle-preview">
            <h4>Preview</h4>
            <div className="riddle-display">
              <p>{puzzleData.riddle || "Your riddle will appear here..."}</p>
              <input
                type="text"
                placeholder="Player will type answer here"
                disabled
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="creator-step">
        <h3>Configuration</h3>
        <p>Advanced puzzle configuration coming soon...</p>
      </div>
    );
  };

  const renderPreview = () => (
    <div className="creator-step">
      <h3>Preview & Finalize</h3>

      <div className="puzzle-summary">
        <h4>{puzzleData.name}</h4>
        <p>{puzzleData.description}</p>

        <div className="summary-stats">
          <div className="stat">
            <span className="label">Type:</span>
            <span className="value">
              {
                puzzleTypes.find((t) => t.value === puzzleData.puzzleType)
                  ?.label
              }
            </span>
          </div>
          <div className="stat">
            <span className="label">Difficulty:</span>
            <span className="value">{puzzleData.difficulty}</span>
          </div>
          <div className="stat">
            <span className="label">Experience:</span>
            <span className="value">
              {puzzleData.completionRewards.experience} XP
            </span>
          </div>
        </div>

        {puzzleData.puzzleType === "riddle" && (
          <div className="riddle-preview">
            <h5>Riddle:</h5>
            <p>"{puzzleData.riddle}"</p>
            <p>
              <strong>Answer:</strong> {puzzleData.unlockAnswer}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="puzzle-artifact-creator">
      <div className="creator-header">
        <h2>Create Interactive Puzzle Artifact</h2>
        <div className="step-indicator">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`step ${currentStep === step ? "active" : ""} ${currentStep > step ? "completed" : ""}`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="creator-content">
        {error && <div className="error-message">{error}</div>}
        {renderStep()}
      </div>

      <div className="creator-actions">
        {currentStep > 1 && (
          <Button
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className="secondary"
          >
            Previous
          </Button>
        )}

        {currentStep < 3 ? (
          <Button
            onClick={() => setCurrentStep((prev) => prev + 1)}
            className="primary"
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="primary">
            {loading ? "Creating..." : "Create Puzzle Artifact"}
          </Button>
        )}

        <Button onClick={onClose} className="secondary">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default PuzzleArtifactCreator;
