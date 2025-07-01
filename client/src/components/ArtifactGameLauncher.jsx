import React, { useState, useEffect, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AuthContext } from '../context/AuthContext';
import { GameStateContext } from '../context/GameStateContext';
import Level4Shooter from './Level4Shooter';
import TextAdventure from './TextAdventure';
import Level3Terminal from './Level3Terminal';
import InteractivePuzzleArtifact from './InteractivePuzzleArtifact';
import { 
  GAME_TYPES, 
  ARTIFACT_TYPES, 
  INTERACTIVE_ARTIFACT_PROPERTIES,
  PLAYER_POWERS,
  UNLOCKABLE_AREAS 
} from './GameConstants';
import { updateUserProgress, awardPlayerPowers, unlockAreas } from '../api/api';
import './ArtifactGameLauncher.css';

/**
 * Universal Game Launcher for Artifact Games
 * Converts existing game components into discoverable artifact experiences
 */
const ArtifactGameLauncher = ({ 
  artifact, 
  onComplete, 
  onExit, 
  character,
  onProgressUpdate 
}) => {
  const { user, updateUser } = useContext(AuthContext);
  const { addExperiencePoints } = useContext(GameStateContext);
  
  // Game state management
  const [gameState, setGameState] = useState('loading'); // loading, playing, paused, completed, failed
  const [gameProgress, setGameProgress] = useState(null);
  const [completionData, setCompletionData] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [error, setError] = useState(null);
  
  // Auto-save progress
  const [lastSaveTime, setLastSaveTime] = useState(Date.now());
  const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
    
    // Set up auto-save interval
    const saveInterval = setInterval(() => {
      if (gameState === 'playing' && gameProgress) {
        saveGameProgress();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      clearInterval(saveInterval);
      // Save progress on unmount
      if (gameState === 'playing' && gameProgress) {
        saveGameProgress();
      }
    };
  }, [artifact.id]);

  const initializeGame = async () => {
    try {
      setGameState('loading');
      
      // Load existing progress if available
      const existingProgress = await loadGameProgress();
      if (existingProgress) {
        setGameProgress(existingProgress);
      } else {
        // Initialize new game progress
        setGameProgress({
          artifactId: artifact.id,
          userId: user?.id,
          startTime: new Date(),
          attempts: 1,
          currentLevel: 1,
          score: 0,
          achievements: [],
          gameSpecificData: {}
        });
      }
      
      setGameState('playing');
    } catch (err) {
      console.error('Failed to initialize game:', err);
      setError('Failed to initialize game. Please try again.');
      setGameState('failed');
    }
  };

  const loadGameProgress = async () => {
    try {
      const response = await fetch(`/api/artifacts/${artifact.id}/progress`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.progress;
      }
      return null;
    } catch (err) {
      console.error('Failed to load game progress:', err);
      return null;
    }
  };

  const saveGameProgress = async () => {
    if (!gameProgress || !user) return;
    
    try {
      await fetch(`/api/artifacts/${artifact.id}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          progress: {
            ...gameProgress,
            lastSaved: new Date()
          }
        })
      });
      
      setLastSaveTime(Date.now());
    } catch (err) {
      console.error('Failed to save game progress:', err);
    }
  };

  const handleGameComplete = useCallback(async (completionData) => {
    try {
      // Calculate final score and rewards
      const finalData = {
        ...completionData,
        completedAt: new Date(),
        totalPlayTime: Date.now() - new Date(gameProgress.startTime).getTime(),
        finalScore: completionData.score || gameProgress.score
      };
      
      setCompletionData(finalData);
      setGameState('completed');
      
      // Award experience points
      const baseXP = artifact.completionRewards?.xp || 50;
      const bonusXP = Math.floor(finalData.finalScore / 100);
      const totalXP = baseXP + bonusXP;
      
      if (addExperiencePoints) {
        addExperiencePoints(totalXP, `Completed ${artifact.name}`);
      }
      
      // Award powers and unlock areas
      await awardCompletionRewards(finalData);
      
      // Update artifact completion stats
      await updateArtifactStats(finalData);
      
      // Show completion modal
      setShowCompletionModal(true);
      
    } catch (err) {
      console.error('Error handling game completion:', err);
      setError('Failed to save completion data. Please try again.');
    }
  }, [artifact, gameProgress, addExperiencePoints]);

  const awardCompletionRewards = async (completionData) => {
    if (!artifact.completionRewards || !user) return;
    
    try {
      // Award powers
      if (artifact.completionRewards.powers?.length > 0) {
        await awardPlayerPowers(user.id, artifact.completionRewards.powers);
        
        // Update user context with new powers
        const updatedUser = {
          ...user,
          unlockedPowers: [
            ...(user.unlockedPowers || []),
            ...artifact.completionRewards.powers
          ]
        };
        updateUser(updatedUser);
      }
      
      // Unlock areas
      if (artifact.completionRewards.unlockedAreas?.length > 0) {
        await unlockAreas(user.id, artifact.completionRewards.unlockedAreas);
        
        // Update user context with unlocked areas
        const updatedUser = {
          ...user,
          unlockedAreas: [
            ...(user.unlockedAreas || []),
            ...artifact.completionRewards.unlockedAreas
          ]
        };
        updateUser(updatedUser);
      }
      
    } catch (err) {
      console.error('Failed to award completion rewards:', err);
    }
  };

  const updateArtifactStats = async (completionData) => {
    try {
      await fetch(`/api/artifacts/${artifact.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          completionData,
          score: completionData.finalScore,
          playTime: completionData.totalPlayTime
        })
      });
    } catch (err) {
      console.error('Failed to update artifact stats:', err);
    }
  };

  const handleGameExit = useCallback(() => {
    // Save progress before exiting
    if (gameState === 'playing' && gameProgress) {
      saveGameProgress();
    }
    
    if (onExit) {
      onExit();
    }
  }, [gameState, gameProgress, onExit]);

  const handleProgressUpdate = useCallback((newProgress) => {
    setGameProgress(prev => ({
      ...prev,
      ...newProgress
    }));
    
    if (onProgressUpdate) {
      onProgressUpdate(newProgress);
    }
  }, [onProgressUpdate]);

  const renderGameComponent = () => {
    const gameType = artifact.gameType || inferGameTypeFromArtifact(artifact);
    
    const commonProps = {
      character,
      onComplete: handleGameComplete,
      onExit: handleGameExit,
      onProgressUpdate: handleProgressUpdate,
      initialProgress: gameProgress,
      artifact
    };

    switch (gameType) {
      case GAME_TYPES.SHOOTER:
        return <Level4Shooter {...commonProps} />;
        
      case GAME_TYPES.TEXT_ADVENTURE:
        return (
          <TextAdventure 
            {...commonProps}
            username={character?.username || 'Player'}
          />
        );
        
      case GAME_TYPES.TERMINAL:
        return (
          <Level3Terminal
            {...commonProps}
            username={character?.username || 'User'}
            inventory={character?.inventory || []}
            artifacts={[]} // Pass relevant artifacts if needed
          />
        );
        
      case GAME_TYPES.PUZZLE:
        return (
          <InteractivePuzzleArtifact
            {...commonProps}
            puzzleData={artifact.gameData}
          />
        );
        
      default:
        return (
          <div className="game-error">
            <h3>Unsupported Game Type</h3>
            <p>Game type "{gameType}" is not yet supported.</p>
            <button onClick={handleGameExit}>Exit</button>
          </div>
        );
    }
  };

  const inferGameTypeFromArtifact = (artifact) => {
    // Infer game type from artifact properties
    if (artifact.type === ARTIFACT_TYPES.SHOOTER_EXPERIENCE) return GAME_TYPES.SHOOTER;
    if (artifact.type === ARTIFACT_TYPES.TEXT_ADVENTURE_WORLD) return GAME_TYPES.TEXT_ADVENTURE;
    if (artifact.type === ARTIFACT_TYPES.TERMINAL_CHALLENGE) return GAME_TYPES.TERMINAL;
    if (artifact.type === ARTIFACT_TYPES.PUZZLE_GAME) return GAME_TYPES.PUZZLE;
    
    // Fallback based on name/description
    const name = artifact.name.toLowerCase();
    if (name.includes('shooter') || name.includes('hemingway')) return GAME_TYPES.SHOOTER;
    if (name.includes('text') || name.includes('adventure')) return GAME_TYPES.TEXT_ADVENTURE;
    if (name.includes('terminal') || name.includes('command')) return GAME_TYPES.TERMINAL;
    
    return GAME_TYPES.PUZZLE; // Default fallback
  };

  const renderCompletionModal = () => {
    if (!showCompletionModal || !completionData) return null;
    
    return (
      <div className="completion-modal-overlay">
        <div className="completion-modal">
          <div className="completion-header">
            <h2>🎉 Quest Complete!</h2>
            <h3>{artifact.name}</h3>
          </div>
          
          <div className="completion-stats">
            <div className="stat-item">
              <span className="stat-label">Final Score:</span>
              <span className="stat-value">{completionData.finalScore?.toLocaleString() || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Play Time:</span>
              <span className="stat-value">{formatPlayTime(completionData.totalPlayTime)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">XP Earned:</span>
              <span className="stat-value">+{(artifact.completionRewards?.xp || 50) + Math.floor((completionData.finalScore || 0) / 100)}</span>
            </div>
          </div>
          
          {/* Powers Unlocked */}
          {artifact.completionRewards?.powers?.length > 0 && (
            <div className="rewards-section">
              <h4>✨ Powers Unlocked</h4>
              <div className="powers-list">
                {artifact.completionRewards.powers.map(power => (
                  <div key={power} className="power-item">
                    {formatPowerName(power)}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Areas Unlocked */}
          {artifact.completionRewards?.unlockedAreas?.length > 0 && (
            <div className="rewards-section">
              <h4>🗺️ Areas Unlocked</h4>
              <div className="areas-list">
                {artifact.completionRewards.unlockedAreas.map(area => (
                  <div key={area} className="area-item">
                    {formatAreaName(area)}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="completion-actions">
            <button 
              className="play-again-btn"
              onClick={() => {
                setShowCompletionModal(false);
                initializeGame();
              }}
            >
              Play Again
            </button>
            <button 
              className="continue-btn"
              onClick={() => {
                setShowCompletionModal(false);
                if (onComplete) onComplete(completionData);
              }}
            >
              Continue Adventure
            </button>
          </div>
        </div>
      </div>
    );
  };

  const formatPlayTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatPowerName = (power) => {
    return power.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatAreaName = (area) => {
    return area.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (error) {
    return (
      <div className="game-launcher-error">
        <h3>Error Loading Game</h3>
        <p>{error}</p>
        <button onClick={handleGameExit}>Return to World</button>
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="game-launcher-loading">
        <div className="loading-spinner"></div>
        <h3>Loading {artifact.name}...</h3>
        <p>Preparing your adventure...</p>
      </div>
    );
  }

  return (
    <div className="artifact-game-launcher">
      {/* Game Info Header */}
      <div className="game-info-header">
        <div className="game-title">
          <h2>{artifact.name}</h2>
          <span className="game-type">{formatGameType(artifact.gameType)}</span>
        </div>
        <div className="game-controls">
          <button className="save-btn" onClick={saveGameProgress}>
            💾 Save
          </button>
          <button className="exit-btn" onClick={handleGameExit}>
            ↩️ Exit
          </button>
        </div>
      </div>
      
      {/* Progress Indicator */}
      {gameProgress && (
        <div className="progress-indicator">
          <span>Score: {gameProgress.score?.toLocaleString() || 0}</span>
          <span>•</span>
          <span>Level: {gameProgress.currentLevel || 1}</span>
          <span>•</span>
          <span className="save-status">
            {Date.now() - lastSaveTime < 60000 ? '✅ Saved' : '⏳ Saving...'}
          </span>
        </div>
      )}
      
      {/* Game Content */}
      <div className="game-content">
        {renderGameComponent()}
      </div>
      
      {/* Completion Modal */}
      {renderCompletionModal()}
    </div>
  );
};

const formatGameType = (gameType) => {
  if (!gameType) return 'Interactive Experience';
  return gameType.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

ArtifactGameLauncher.propTypes = {
  artifact: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    gameType: PropTypes.string,
    type: PropTypes.string,
    completionRewards: PropTypes.shape({
      xp: PropTypes.number,
      powers: PropTypes.arrayOf(PropTypes.string),
      unlockedAreas: PropTypes.arrayOf(PropTypes.string),
      achievements: PropTypes.arrayOf(PropTypes.string)
    }),
    gameData: PropTypes.object
  }).isRequired,
  onComplete: PropTypes.func,
  onExit: PropTypes.func.isRequired,
  character: PropTypes.object,
  onProgressUpdate: PropTypes.func
};

export default ArtifactGameLauncher; 