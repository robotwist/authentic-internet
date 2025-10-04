import React from 'react';
import './ControlsGuide.css';

/**
 * ControlsGuide - Comprehensive keyboard controls reference
 * Shows all keyboard shortcuts and game controls
 */
const ControlsGuide = ({ onClose }) => {
  
  const controlSections = [
    {
      title: "Movement",
      icon: "🎮",
      controls: [
        { keys: ["↑", "W"], action: "Move Up" },
        { keys: ["↓", "S"], action: "Move Down" },
        { keys: ["←", "A"], action: "Move Left" },
        { keys: ["→", "D"], action: "Move Right" }
      ]
    },
    {
      title: "Combat",
      icon: "⚔️",
      controls: [
        { keys: ["Z"], action: "Sword Attack" },
        { keys: ["Z"], action: "Sword Beam (at full health)", secondary: true }
      ]
    },
    {
      title: "Interactions",
      icon: "💬",
      controls: [
        { keys: ["T"], action: "Talk to NPCs" },
        { keys: ["E", "P"], action: "Pick Up Artifact" },
        { keys: ["Space"], action: "Activate Portal" }
      ]
    },
    {
      title: "Menus & UI",
      icon: "📋",
      controls: [
        { keys: ["I"], action: "Open Inventory" },
        { keys: ["M"], action: "Open World Map" },
        { keys: ["Q"], action: "Open Saved Quotes" },
        { keys: ["F"], action: "Open Feedback Form" },
        { keys: ["Esc"], action: "Close Menu / Back" }
      ]
    },
    {
      title: "Accessibility",
      icon: "♿",
      controls: [
        { keys: ["H"], action: "Toggle High Contrast Mode" },
        { keys: ["R"], action: "Toggle Reduced Motion" },
        { keys: ["S"], action: "Toggle Screen Reader Mode" }
      ]
    },
    {
      title: "Shooter Mini-Game",
      icon: "🎯",
      controls: [
        { keys: ["Space", "↑", "W"], action: "Jump" },
        { keys: ["←", "→", "A", "D"], action: "Move Left/Right" },
        { keys: ["Esc"], action: "Exit Game" }
      ]
    }
  ];

  return (
    <div className="controls-guide-overlay" onClick={onClose}>
      <div className="controls-guide-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="controls-guide-header">
          <h2>⌨️ Keyboard Controls</h2>
          <button 
            className="controls-close-btn" 
            onClick={onClose}
            aria-label="Close controls guide"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="controls-guide-content">
          {controlSections.map((section, index) => (
            <div key={index} className="control-section">
              <h3 className="control-section-title">
                <span className="control-section-icon">{section.icon}</span>
                {section.title}
              </h3>
              <div className="control-list">
                {section.controls.map((control, ctrlIndex) => (
                  <div 
                    key={ctrlIndex} 
                    className={`control-item ${control.secondary ? 'control-item-secondary' : ''}`}
                  >
                    <div className="control-keys">
                      {control.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <kbd className="key-badge">{key}</kbd>
                          {keyIndex < control.keys.length - 1 && (
                            <span className="key-separator">or</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="control-action">{control.action}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="controls-guide-footer">
          <p className="controls-hint">
            💡 Tip: Most actions have alternative keys for convenience
          </p>
          <button 
            className="controls-close-btn-footer" 
            onClick={onClose}
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlsGuide;

