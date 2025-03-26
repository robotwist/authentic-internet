import React, { useState, useEffect } from 'react';
import './RewardDisplay.css';

/**
 * RewardDisplay component for showing rewards earned during gameplay
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether the reward display is visible
 * @param {string} props.type - Type of reward ('experience', 'item', 'achievement', etc.)
 * @param {Object} props.reward - The reward data (experience points, item object, etc.)
 * @param {function} props.onClose - Function to call when the display is closed
 * @param {number} props.autoCloseTime - Time in ms before auto-closing (default: 5000)
 */
const RewardDisplay = ({ 
  visible = false, 
  type = 'experience', 
  reward = {}, 
  onClose,
  autoCloseTime = 5000
}) => {
  const [animation, setAnimation] = useState('');
  
  useEffect(() => {
    // Apply entrance animation when becoming visible
    if (visible) {
      setAnimation('reward-enter');
      
      // Set up auto-close timer if specified
      if (autoCloseTime > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [visible, autoCloseTime]);
  
  // Handle closing the reward display with exit animation
  const handleClose = () => {
    setAnimation('reward-exit');
    
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      if (onClose) onClose();
    }, 500); // Match this with the CSS animation duration
  };
  
  // Don't render anything if not visible
  if (!visible) return null;
  
  // Render different content based on reward type
  const renderRewardContent = () => {
    switch (type) {
      case 'experience':
        return (
          <div className="reward-experience">
            <div className="experience-icon">✨</div>
            <div className="experience-amount">+{reward.amount || 0} XP</div>
            {reward.levelUp && (
              <div className="level-up">
                <span className="level-up-text">LEVEL UP!</span>
                <span className="new-level">Level {reward.newLevel}</span>
              </div>
            )}
          </div>
        );
        
      case 'item':
        return (
          <div className="reward-item">
            <div className="item-icon">
              {reward.icon || '🎁'}
            </div>
            <div className="item-details">
              <h3 className="item-name">{reward.name || 'Mystery Item'}</h3>
              <p className="item-description">{reward.description || 'A mysterious reward'}</p>
            </div>
          </div>
        );
        
      case 'achievement':
        return (
          <div className="reward-achievement">
            <div className="achievement-icon">🏆</div>
            <div className="achievement-details">
              <h3 className="achievement-name">{reward.name || 'Achievement Unlocked!'}</h3>
              <p className="achievement-description">{reward.description || 'You accomplished something special'}</p>
            </div>
          </div>
        );
        
      case 'quote':
        return (
          <div className="reward-quote">
            <div className="quote-icon">📜</div>
            <div className="quote-details">
              <p className="quote-text">"{reward.text || 'A quote has been added to your collection'}"</p>
              <p className="quote-source">— {reward.source || 'Unknown'}</p>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="reward-generic">
            <div className="generic-icon">🎉</div>
            <div className="generic-text">{reward.message || 'You earned a reward!'}</div>
          </div>
        );
    }
  };
  
  return (
    <div className={`reward-display-container ${animation}`} onClick={handleClose}>
      <div className="reward-display" onClick={(e) => e.stopPropagation()}>
        <button className="close-reward" onClick={handleClose}>×</button>
        <div className="reward-header">
          <h2 className="reward-title">
            {type === 'experience' ? 'Experience Gained!' : 
             type === 'item' ? 'Item Acquired!' :
             type === 'achievement' ? 'Achievement Unlocked!' :
             type === 'quote' ? 'Quote Saved!' :
             'Reward!'}
          </h2>
        </div>
        <div className="reward-content">
          {renderRewardContent()}
        </div>
      </div>
    </div>
  );
};

export default RewardDisplay; 