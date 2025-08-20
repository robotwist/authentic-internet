import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './VictoryScreen.css';

const VictoryScreen = ({ 
  gameType, 
  score, 
  time, 
  achievements, 
  rewards, 
  onContinue, 
  onReplay,
  creator = "Aurthurneticus Interneticus"
}) => {
  const [showRewards, setShowRewards] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);
  const [animateRewards, setAnimateRewards] = useState(false);

  useEffect(() => {
    // Animate score after a short delay
    const scoreTimer = setTimeout(() => setAnimateScore(true), 500);
    const rewardsTimer = setTimeout(() => setAnimateRewards(true), 1500);
    
    return () => {
      clearTimeout(scoreTimer);
      clearTimeout(rewardsTimer);
    };
  }, []);

  const getGameTheme = () => {
    switch (gameType) {
      case 'shooter':
        return {
          title: '🎯 Arcade Victory!',
          subtitle: 'You\'ve mastered the digital battlefield',
          bgClass: 'victory-shooter',
          icon: '🎮'
        };
      case 'terminal':
        return {
          title: '💻 Terminal Mastery!',
          subtitle: 'Code conquered, knowledge gained',
          bgClass: 'victory-terminal',
          icon: '⌨️'
        };
      case 'text_adventure':
        return {
          title: '📖 Story Completed!',
          subtitle: 'Your adventure has reached its conclusion',
          bgClass: 'victory-text',
          icon: '📚'
        };
      default:
        return {
          title: '🏆 Victory Achieved!',
          subtitle: 'You\'ve completed the challenge',
          bgClass: 'victory-default',
          icon: '⭐'
        };
    }
  };

  const theme = getGameTheme();

  return (
    <div className={`victory-screen ${theme.bgClass}`}>
      <div className="victory-content">
        <div className="victory-header">
          <div className="victory-icon">{theme.icon}</div>
          <h1 className="victory-title">{theme.title}</h1>
          <p className="victory-subtitle">{theme.subtitle}</p>
        </div>

        <div className="victory-stats">
          <div className={`stat-item ${animateScore ? 'animate' : ''}`}>
            <div className="stat-label">Final Score</div>
            <div className="stat-value">{score || 0}</div>
          </div>
          
          {time && (
            <div className="stat-item">
              <div className="stat-label">Time</div>
              <div className="stat-value">{time}</div>
            </div>
          )}
        </div>

        {achievements && achievements.length > 0 && (
          <div className="achievements-section">
            <h3>🏅 Achievements Unlocked</h3>
            <div className="achievements-list">
              {achievements.map((achievement, index) => (
                <div key={index} className="achievement-item">
                  <span className="achievement-icon">🏆</span>
                  <span className="achievement-text">{achievement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {rewards && (
          <div className={`rewards-section ${animateRewards ? 'animate' : ''}`}>
            <h3>🎁 Rewards Earned</h3>
            <div className="rewards-grid">
              {rewards.experience && (
                <div className="reward-item">
                  <span className="reward-icon">⭐</span>
                  <span className="reward-label">Experience</span>
                  <span className="reward-value">+{rewards.experience} XP</span>
                </div>
              )}
              {rewards.coins && (
                <div className="reward-item">
                  <span className="reward-icon">🪙</span>
                  <span className="reward-label">Coins</span>
                  <span className="reward-value">+{rewards.coins}</span>
                </div>
              )}
              {rewards.powers && rewards.powers.length > 0 && (
                <div className="reward-item">
                  <span className="reward-icon">⚡</span>
                  <span className="reward-label">New Powers</span>
                  <span className="reward-value">{rewards.powers.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="creator-credit">
          <p>Created by <span className="creator-name">{creator}</span></p>
        </div>

        <div className="victory-actions">
          <button className="btn-replay" onClick={onReplay}>
            🔄 Play Again
          </button>
          <button className="btn-continue" onClick={onContinue}>
            ➡️ Continue Adventure
          </button>
        </div>
      </div>
    </div>
  );
};

VictoryScreen.propTypes = {
  gameType: PropTypes.oneOf(['shooter', 'terminal', 'text_adventure']).isRequired,
  score: PropTypes.number,
  time: PropTypes.string,
  achievements: PropTypes.arrayOf(PropTypes.string),
  rewards: PropTypes.shape({
    experience: PropTypes.number,
    coins: PropTypes.number,
    powers: PropTypes.arrayOf(PropTypes.string)
  }),
  onContinue: PropTypes.func.isRequired,
  onReplay: PropTypes.func.isRequired,
  creator: PropTypes.string
};

export default VictoryScreen;
