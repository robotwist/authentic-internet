import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./PixelCharacterCreator.css";

const PixelCharacterCreator = ({ onCharacterCreated, onClose }) => {
  const { user, updateUser } = useAuth();
  const [mode, setMode] = useState("create"); // 'create' or 'import'
  const [canvasSize, setCanvasSize] = useState(32);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [pixels, setPixels] = useState({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Color palette for pixel art
  const colorPalette = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
    "#800000",
    "#808080",
    "#C0C0C0",
    "#FFC0CB",
    "#A52A2A",
    "#FFD700",
    "#32CD32",
  ];

  // Initialize canvas
  useEffect(() => {
    initializeCanvas();
  }, [canvasSize]);

  const initializeCanvas = () => {
    const newPixels = {};
    for (let x = 0; x < canvasSize; x++) {
      for (let y = 0; y < canvasSize; y++) {
        newPixels[`${x},${y}`] = "#FFFFFF";
      }
    }
    setPixels(newPixels);
  };

  // Handle pixel drawing
  const handlePixelClick = (x, y) => {
    const key = `${x},${y}`;
    setPixels((prev) => ({
      ...prev,
      [key]: selectedColor,
    }));
  };

  const handleMouseDown = (x, y) => {
    setIsDrawing(true);
    handlePixelClick(x, y);
  };

  const handleMouseEnter = (x, y) => {
    if (isDrawing) {
      handlePixelClick(x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Handle file import
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Import Piskel file
  const importPiskelFile = async () => {
    if (!importFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("piskelFile", importFile);
      formData.append("characterName", characterName);

      const response = await fetch("/api/characters/import-piskel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onCharacterCreated(result.character);
        updateUser({ ...user, character: result.character });
      } else {
        throw new Error("Failed to import character");
      }
    } catch (error) {
      console.error("Error importing character:", error);
      alert("Failed to import character. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save created character
  const saveCharacter = async () => {
    if (!characterName.trim()) {
      alert("Please enter a character name");
      return;
    }

    setIsLoading(true);
    try {
      // Convert pixels to image data
      const canvas = document.createElement("canvas");
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext("2d");

      // Draw pixels
      for (let x = 0; x < canvasSize; x++) {
        for (let y = 0; y < canvasSize; y++) {
          const color = pixels[`${x},${y}`];
          if (color !== "#FFFFFF") {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // Convert to blob
      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("characterImage", blob, "character.png");
        formData.append("characterName", characterName);
        formData.append("pixelData", JSON.stringify(pixels));

        const response = await fetch("/api/characters/create", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          onCharacterCreated(result.character);
          updateUser({ ...user, character: result.character });
        } else {
          throw new Error("Failed to save character");
        }
      }, "image/png");
    } catch (error) {
      console.error("Error saving character:", error);
      alert("Failed to save character. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    initializeCanvas();
  };

  // Fill canvas with color
  const fillCanvas = () => {
    const newPixels = {};
    for (let x = 0; x < canvasSize; x++) {
      for (let y = 0; y < canvasSize; y++) {
        newPixels[`${x},${y}`] = selectedColor;
      }
    }
    setPixels(newPixels);
  };

  return (
    <div
      className="pixel-character-creator"
      role="dialog"
      aria-labelledby="character-creator-title"
    >
      <div className="creator-container">
        <div className="creator-header">
          <h2 id="character-creator-title">Create Your Pixel Character</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close character creator"
          >
            ×
          </button>
        </div>

        {/* Mode Selection */}
        <div className="mode-selector">
          <button
            className={`mode-button ${mode === "create" ? "active" : ""}`}
            onClick={() => setMode("create")}
            aria-pressed={mode === "create"}
          >
            Create Character
          </button>
          <button
            className={`mode-button ${mode === "import" ? "active" : ""}`}
            onClick={() => setMode("import")}
            aria-pressed={mode === "import"}
          >
            Import Piskel
          </button>
        </div>

        {mode === "create" ? (
          <div className="create-mode">
            {/* Character Name */}
            <div className="input-group">
              <label htmlFor="character-name">Character Name:</label>
              <input
                id="character-name"
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Enter character name"
                maxLength={20}
              />
            </div>

            {/* Canvas Size Selector */}
            <div className="canvas-controls">
              <label htmlFor="canvas-size">Canvas Size:</label>
              <select
                id="canvas-size"
                value={canvasSize}
                onChange={(e) => setCanvasSize(Number(e.target.value))}
              >
                <option value={16}>16x16</option>
                <option value={32}>32x32</option>
                <option value={64}>64x64</option>
              </select>
            </div>

            {/* Color Palette */}
            <div className="color-palette">
              <label>Color Palette:</label>
              <div className="color-grid">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    className={`color-swatch ${selectedColor === color ? "selected" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select color ${color}`}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Custom Color Picker */}
            <div className="custom-color">
              <label htmlFor="custom-color">Custom Color:</label>
              <input
                id="custom-color"
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                aria-label="Choose custom color"
              />
            </div>

            {/* Canvas */}
            <div className="canvas-container">
              <div
                className="pixel-canvas"
                style={{
                  gridTemplateColumns: `repeat(${canvasSize}, 1px)`,
                  gridTemplateRows: `repeat(${canvasSize}, 1px)`,
                }}
                onMouseLeave={handleMouseUp}
              >
                {Array.from({ length: canvasSize * canvasSize }, (_, index) => {
                  const x = index % canvasSize;
                  const y = Math.floor(index / canvasSize);
                  const key = `${x},${y}`;
                  const color = pixels[key] || "#FFFFFF";

                  return (
                    <div
                      key={key}
                      className="pixel"
                      style={{ backgroundColor: color }}
                      onMouseDown={() => handleMouseDown(x, y)}
                      onMouseEnter={() => handleMouseEnter(x, y)}
                      onMouseUp={handleMouseUp}
                      aria-label={`Pixel at position ${x}, ${y}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Canvas Controls */}
            <div className="canvas-actions">
              <button onClick={clearCanvas} className="action-button">
                Clear Canvas
              </button>
              <button onClick={fillCanvas} className="action-button">
                Fill Canvas
              </button>
            </div>

            {/* Save Button */}
            <div className="save-section">
              <button
                onClick={saveCharacter}
                disabled={isLoading || !characterName.trim()}
                className="save-button"
              >
                {isLoading ? "Saving..." : "Save Character"}
              </button>
            </div>
          </div>
        ) : (
          <div className="import-mode">
            {/* Import Instructions */}
            <div className="import-instructions">
              <h3>Import Piskel Character</h3>
              <p>
                Upload a Piskel (.piskel) file or an image file (PNG, JPG) to
                import your character. The image will be automatically resized
                to fit the game's pixel art style.
              </p>
            </div>

            {/* File Upload */}
            <div className="file-upload">
              <label htmlFor="character-file" className="file-upload-label">
                <div className="upload-area">
                  <span className="upload-icon">📁</span>
                  <span>Click to select file or drag and drop</span>
                  <span className="file-types">
                    Supports: .piskel, .png, .jpg, .jpeg
                  </span>
                </div>
              </label>
              <input
                id="character-file"
                ref={fileInputRef}
                type="file"
                accept=".piskel,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="file-input"
              />
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="preview-section">
                <h4>Preview:</h4>
                <div className="preview-container">
                  <img
                    src={previewUrl}
                    alt="Character preview"
                    className="character-preview"
                  />
                </div>
              </div>
            )}

            {/* Character Name for Import */}
            <div className="input-group">
              <label htmlFor="import-character-name">Character Name:</label>
              <input
                id="import-character-name"
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Enter character name"
                maxLength={20}
              />
            </div>

            {/* Import Button */}
            <div className="import-actions">
              <button
                onClick={importPiskelFile}
                disabled={isLoading || !importFile || !characterName.trim()}
                className="import-button"
              >
                {isLoading ? "Importing..." : "Import Character"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PixelCharacterCreator;
