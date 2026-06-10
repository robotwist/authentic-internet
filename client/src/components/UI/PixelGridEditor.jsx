import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  DEFAULT_GRID_SIZE,
  colorFromPixel,
  createEmptyGrid,
  gridHasPaintedPixels,
} from "../../utils/pixelGrid";
import "./PixelGridEditor.css";

/**
 * PixelGridEditor - A retro pixel art character creator
 * Allows users to paint on a 32x32 grid to create their custom character sprite
 */
const PixelGridEditor = ({
  onSave,
  initialSprite = null,
  cellSize = 24,
  fullscreen = false,
  compact = false,
  characterName = "",
  onCharacterNameChange,
  saving = false,
}) => {
  const GRID_SIZE = DEFAULT_GRID_SIZE;
  const CELL_SIZE = cellSize;

  // Color palette (retro NES style)
  const COLOR_PALETTE = [
    "#000000", // Black
    "#FFFFFF", // White
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#8B4513", // Brown
    "#FFD700", // Gold
    "#C0C0C0", // Silver
    "#808080", // Gray
    "#800000", // Maroon
    "#008000", // Dark Green
    "#000080", // Navy
  ];

  const canvasRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [grid, setGrid] = useState(() => {
    if (Array.isArray(initialSprite)) {
      return initialSprite;
    }
    return createEmptyGrid(GRID_SIZE);
  });
  const [tool, setTool] = useState("draw"); // 'draw' or 'erase'

  useEffect(() => {
    if (!initialSprite) return;

    if (Array.isArray(initialSprite)) {
      setGrid(initialSprite);
      return;
    }

    if (
      typeof initialSprite !== "string" ||
      !initialSprite.startsWith("data:image/")
    ) {
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;

      const importCanvas = document.createElement("canvas");
      importCanvas.width = GRID_SIZE;
      importCanvas.height = GRID_SIZE;
      const ctx = importCanvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
      ctx.drawImage(image, 0, 0, GRID_SIZE, GRID_SIZE);

      const { data } = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
      const importedGrid = createEmptyGrid(GRID_SIZE);

      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          importedGrid[y][x] = colorFromPixel(data, (y * GRID_SIZE + x) * 4);
        }
      }

      setGrid(importedGrid);
    };
    image.src = initialSprite;

    return () => {
      cancelled = true;
    };
  }, [initialSprite]);

  // Render the grid to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false; // Keep pixels crisp

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const color = grid[y][x];
        if (color !== "transparent") {
          ctx.fillStyle = color;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Draw grid lines (subtle)
    ctx.strokeStyle = "rgba(128, 128, 128, 0.2)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
  }, [grid, CELL_SIZE]);

  const handleCanvasInteraction = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
      const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        setGrid((prev) => {
          const newGrid = prev.map((row) => [...row]);
          newGrid[y][x] = tool === "draw" ? selectedColor : "transparent";
          return newGrid;
        });
      }
    },
    [selectedColor, tool],
  );

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    handleCanvasInteraction(e);
  };

  const handleMouseMove = (e) => {
    if (isDrawing) {
      handleCanvasInteraction(e);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearGrid = () => {
    if (window.confirm("Clear the entire canvas?")) {
      setGrid(createEmptyGrid(GRID_SIZE));
    }
  };

  const fillGrid = () => {
    setGrid(
      Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(selectedColor)),
    );
  };

  const exportSprite = () => {
    if (!gridHasPaintedPixels(grid)) {
      if (onSave) {
        onSave({ dataURL: null, grid, isBlank: true });
      }
      return null;
    }

    // Create a temporary canvas to export the sprite at actual size (32x32)
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = GRID_SIZE;
    exportCanvas.height = GRID_SIZE;
    const ctx = exportCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    // Draw each pixel
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const color = grid[y][x];
        if (color !== "transparent") {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Convert to data URL
    const dataURL = exportCanvas.toDataURL("image/png");

    if (onSave) {
      onSave({ dataURL, grid });
    }

    return dataURL;
  };

  const importTemplate = (template) => {
    // Pre-made templates for inspiration
    const templates = {
      knight: [
        // Simple knight silhouette (8x8 centered, scaled up)
        // You can expand this with actual pixel data
        Array(GRID_SIZE)
          .fill(null)
          .map(() => Array(GRID_SIZE).fill("transparent")),
      ],
      wizard: [
        Array(GRID_SIZE)
          .fill(null)
          .map(() => Array(GRID_SIZE).fill("transparent")),
      ],
      ranger: [
        Array(GRID_SIZE)
          .fill(null)
          .map(() => Array(GRID_SIZE).fill("transparent")),
      ],
    };

    if (templates[template]) {
      setGrid(templates[template]);
    }
  };

  const editorClass = [
    "pixel-grid-editor",
    fullscreen ? "pixel-grid-editor--fullscreen" : "",
    compact ? "pixel-grid-editor--compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={editorClass}>
      {!compact && (
        <div className="editor-header">
          <h2>🎨 Create Your Character</h2>
          <p className="editor-subtitle">
            Paint your pixel art character (32×32)
          </p>
        </div>
      )}

      <div className="editor-workspace">
        {/* Canvas area */}
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="pixel-canvas"
          />

          {/* Preview */}
          <div className="sprite-preview">
            <div className="preview-label">Preview (actual size):</div>
            <div className="preview-box">
              <canvas
                ref={(previewCanvas) => {
                  if (!previewCanvas) return;
                  const ctx = previewCanvas.getContext("2d");
                  ctx.imageSmoothingEnabled = false;
                  ctx.clearRect(0, 0, 32, 32);

                  for (let y = 0; y < GRID_SIZE; y++) {
                    for (let x = 0; x < GRID_SIZE; x++) {
                      const color = grid[y][x];
                      if (color !== "transparent") {
                        ctx.fillStyle = color;
                        ctx.fillRect(x, y, 1, 1);
                      }
                    }
                  }
                }}
                width={32}
                height={32}
                style={{
                  imageRendering: "pixelated",
                  width: "64px",
                  height: "64px",
                }}
              />
            </div>
            {!compact && (
              <button
                className="action-btn primary preview-save-btn"
                onClick={exportSprite}
                disabled={saving}
              >
                {saving ? "Saving…" : "💾 Continue to Save"}
              </button>
            )}
          </div>
        </div>

        {/* Tools sidebar */}
        <div className="tools-sidebar">
          {/* Tool selection */}
          <div className="tool-section">
            <h3>🛠️ Tools</h3>
            <div className="tool-buttons">
              <button
                className={`tool-btn ${tool === "draw" ? "active" : ""}`}
                onClick={() => setTool("draw")}
                title="Draw"
              >
                ✏️ Draw
              </button>
              <button
                className={`tool-btn ${tool === "erase" ? "active" : ""}`}
                onClick={() => setTool("erase")}
                title="Erase"
              >
                🗑️ Erase
              </button>
            </div>
          </div>

          {/* Color palette */}
          <div className="color-section">
            <h3>🎨 Colors</h3>
            <div className="color-palette">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  className={`color-btn ${selectedColor === color ? "selected" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                />
              ))}
            </div>
            <div className="selected-color-display">
              Selected:
              <span
                className="selected-color-swatch"
                style={{ backgroundColor: selectedColor }}
              />
              {selectedColor}
            </div>
          </div>

          {/* Actions */}
          <div className="action-section">
            <h3>⚡ Actions</h3>
            <button className="action-btn" onClick={clearGrid}>
              🗑️ Clear All
            </button>
            <button className="action-btn" onClick={fillGrid}>
              🖌️ Fill All
            </button>
            {!compact && (
              <button
                className="action-btn primary"
                onClick={exportSprite}
                disabled={saving}
              >
                {saving ? "Saving…" : "💾 Continue to Save"}
              </button>
            )}
          </div>
        </div>
      </div>

      {compact && (
        <div className="editor-save-bar">
          {onCharacterNameChange && (
            <label className="save-bar-name">
              <span>Name</span>
              <input
                type="text"
                value={characterName}
                onChange={(e) => onCharacterNameChange(e.target.value)}
                placeholder="Hero"
                maxLength={20}
                disabled={saving}
              />
            </label>
          )}
          <button
            type="button"
            className="action-btn primary"
            onClick={exportSprite}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save & play"}
          </button>
        </div>
      )}

      {!compact && (
        <div className="editor-tips">
          <h4>💡 Tips:</h4>
          <ul>
            <li>Start with a simple silhouette</li>
            <li>Use darker colors for outlines</li>
            <li>Keep your design recognizable at small size</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PixelGridEditor;
