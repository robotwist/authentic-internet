import React from 'react';
import './RewardModal.css';

const RewardModal = ({ visible, onClose, achievement }) => {
  if (!visible) return null;

  // Updated URL to the Chrome Web Store, this should be replaced with the actual extension URL
  const nkdManExtensionURL = "https://chrome.google.com/webstore/detail/nkd-man-extension/penadbpfpdlcikkahaniobpnoikgjfoh";

  // Different content based on achievement type
  let content;
  
  if (achievement === 'level1') {
    content = (
      <>
        <div className="reward-icon">🏆</div>
        <h3>Level 1 Complete!</h3>
        <p>Congratulations! You've completed level 1 by exploring the Digital Wilderness!</p>
        
        <div className="reward-item">
          <img 
            src="/assets/npcs/nkd-man-extension.png" 
            alt="NKD Man Chrome Extension" 
            className="reward-image" 
            onError={(e) => {
              console.log("Image failed to load: /assets/npcs/nkd-man-extension.png");
              // First try a known fallback image
              e.target.src = '/assets/tiles/portal.webp';
              
              // Add a second error handler for the fallback image
              e.target.onerror = () => {
                console.log("Fallback image also failed, using data URI");
                // If that also fails, use a simple data URI as last resort
                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23cccccc"/><text x="50%" y="50%" font-family="sans-serif" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="%23333333">Image</text></svg>';
                // Remove the error handler to prevent infinite loops
                e.target.onerror = null;
              };
            }}
          />
          <div className="reward-details">
            <h4>Your Reward: Summon NKD Man Chrome Extension</h4>
            <p>This exclusive $1000 value extension is now available for you to download for FREE!</p>
            <a 
              href={nkdManExtensionURL}
              target="_blank"
              rel="noopener noreferrer"
              className="download-button"
            >
              Download Extension
            </a>
          </div>
        </div>
        
        <div className="reward-instructions">
          <h4>How to use your reward:</h4>
          <ol>
            <li>Click the "Download Extension" button</li>
            <li>Install the extension from the Chrome Web Store</li>
            <li>Use the extension to summon NKD Man in your browser</li>
          </ol>
        </div>
      </>
    );
  } else {
    // Default content for other achievements
    content = (
      <>
        <div className="reward-icon">🎉</div>
        <h3>Achievement Unlocked!</h3>
        <p>Congratulations on your achievement!</p>
      </>
    );
  }

  return (
    <div className="reward-modal-overlay">
      <div className="reward-modal">
        <div className="reward-modal-header">
          <h2>🎉 Achievement Unlocked! 🎉</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="reward-content">
          {content}
        </div>
        
        <div className="reward-footer">
          <button className="continue-button" onClick={onClose}>Continue Adventure</button>
        </div>
      </div>
    </div>
  );
};

export default RewardModal; 