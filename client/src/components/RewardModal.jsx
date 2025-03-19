import React from 'react';
import './RewardModal.css';

const RewardModal = ({ visible, onClose, achievement }) => {
  if (!visible) return null;

  const nkdManExtensionURL = "https://chromewebstore.google.com/detail/penadbpfpdlcikkahaniobpnoikgjfoh?utm_source=item-share-cb";

  return (
    <div className="reward-modal-overlay">
      <div className="reward-modal">
        <div className="reward-modal-header">
          <h2>🎉 Achievement Unlocked! 🎉</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="reward-content">
          <div className="reward-icon">🏆</div>
          <h3>Level 1 Complete!</h3>
          <p>Congratulations! You've completed level 1 by traversing from the overworld to the final dungeon!</p>
          
          <div className="reward-item">
            <img 
              src="/assets/npcs/nkd-man-extension.png" 
              alt="NKD Man Chrome Extension" 
              className="reward-image" 
              onError={(e) => {
                e.target.src = '/assets/tiles/portal.webp'; // Fallback image
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
        </div>
        
        <div className="reward-footer">
          <button className="continue-button" onClick={onClose}>Continue Adventure</button>
        </div>
      </div>
    </div>
  );
};

export default RewardModal; 