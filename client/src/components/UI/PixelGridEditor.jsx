import React, { useState, useRef, useEffect, useCallback } from "react";
import "./PixelGridEditor.css";

/**
 * PixelGridEditor - A retro pixel art character creator
 * Allows users to paint on a 32x32 grid to create their custom character sprite
 */
const PixelGridEditor = ({ onSave, initialSprite = null }) => {
  const GRID_SIZE = 32; // 32x32 pixel grid
  const CELL_SIZE = 12; // Display size of each pixel

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
    // Initialize grid with transparent pixels
    if (initialSprite) {
      return initialSprite;
    }
    return Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill("transparent"));
  });
  const [tool, setTool] = useState("draw"); // 'draw' or 'erase'

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
  }, [grid]);

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
      setGrid(
        Array(GRID_SIZE)
          .fill(null)
          .map(() => Array(GRID_SIZE).fill("transparent")),
      );
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

  return (
    <div className="pixel-grid-editor">
      <div className="editor-header">
        <h2>🎨 Create Your Character</h2>
        <p className="editor-subtitle">
          Paint your pixel art character (32x32)
        </p>
      </div>

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
            <button className="action-btn primary" onClick={exportSprite}>
              💾 Save Character
            </button>
          </div>
        </div>
      </div>

      <div className="editor-tips">
        <h4>💡 Tips:</h4>
        <ul>
          <li>Start with a simple silhouette</li>
          <li>Use darker colors for outlines</li>
          <li>Keep your design recognizable at small size</li>
          <li>Test how it looks in the preview window</li>
        </ul>
      </div>
    </div>
  );
};

export default PixelGridEditor;
