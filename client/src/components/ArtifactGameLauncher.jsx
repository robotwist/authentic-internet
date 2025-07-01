import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Level4Shooter from './Level4Shooter';
import TextAdventure from './TextAdventure';
import Terminal from './Terminal';
import InteractivePuzzleArtifact from './InteractivePuzzleArtifact';
import './ArtifactGameLauncher.css';

/**
 * Universal Game Launcher for Artifact Games
 * Converts existing game components into discoverable artifact experiences
 */
const ArtifactGameLauncher = ({ 
  artifact, 
  onComplete, 
  onExit, 
  onProgressUpdate,
  isOpen = false 
}) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState('loading');
  const [progress, setProgress] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [error, setError] = useState(null);
  const [startTime] = useState(Date.now());
  const progressIntervalRef = useRef(null);

  // Game states: 'loading', 'ready', 'playing', 'paused', 'completed', 'failed'

  useEffect(() => {
    if (isOpen && artifact) {
      initializeGame();
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isOpen, artifact]);

  const initializeGame = async () => {
    setGameState('loading');
    setError(null);

    try {
      // Load existing progress if available
      await loadProgress();
      
      // Initialize auto-save
      startProgressTracking();
      
      setGameState('ready');
    } catch (err) {
      console.error('Error initializing game:', err);
      setError('Failed to initialize game');
      setGameState('failed');
    }
  };

  const loadProgress = async () => {
    if (!artifact.isInteractive || !user?.token) return;

    try {
      const response = await fetch(`/api/artifacts/${artifact._id}/progress`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const progressData = await response.json();
        setProgress(progressData);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async (progressData, completed = false) => {
    if (!artifact.isInteractive || !user?.token) return;

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      const response = await fetch(`/api/artifacts/${artifact._id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          currentState: progressData,
          completed,
          timeSpent,
          attempts: (progress?.attempts || 0) + (completed ? 1 : 0)
        })
      });

      if (response.ok) {
        const result = await response.json();
        setProgress(result.progress);
        
        if (completed && result.rewards) {
          setRewards(result.rewards);
          handleGameComplete(result.rewards);
        }
        
        if (onProgressUpdate) {
          onProgressUpdate(result.progress);
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const startProgressTracking = () => {
    // Auto-save every 30 seconds
    progressIntervalRef.current = setInterval(() => {
      if (gameState === 'playing') {
        const currentProgress = getCurrentGameState();
        if (currentProgress) {
          saveProgress(currentProgress, false);
        }
      }
    }, 30000);
  };

  const getCurrentGameState = () => {
    // Get current state from the active game component
    // This would be implemented differently for each game type
    switch (artifact.gameConfig?.gameType || artifact.contentType) {
      case 'shooter':
        return getShooterState();
      case 'textAdventure':
        return getTextAdventureState();
      case 'terminal':
        return getTerminalState();
      default:
        return { timestamp: Date.now() };
    }
  };

  const getShooterState = () => {
    // Extract state from Level4Shooter component
    return {
      level: 1, // Would get from game component
      score: 0,
      health: 100,
      timestamp: Date.now()
    };
  };

  const getTextAdventureState = () => {
    // Extract state from TextAdventure component
    return {
      currentRoom: 'start',
      inventory: [],
      gameHistory: [],
      timestamp: Date.now()
    };
  };

  const getTerminalState = () => {
    // Extract state from Terminal component
    return {
      currentDirectory: '/',
      completedCommands: [],
      timestamp: Date.now()
    };
  };

  const handleGameStart = () => {
    setGameState('playing');
  };

  const handleGamePause = () => {
    setGameState('paused');
    const currentProgress = getCurrentGameState();
    if (currentProgress) {
      saveProgress(currentProgress, false);
    }
  };

  const handleGameResume = () => {
    setGameState('playing');
  };

  const handleGameComplete = (gameRewards = null) => {
    setGameState('completed');
    
    // Save final progress
    const finalProgress = getCurrentGameState();
    saveProgress(finalProgress, true);
    
    // Process rewards and power unlocks
    if (artifact.completionRewards) {
      processRewards(artifact.completionRewards);
    }
    
    if (onComplete) {
      onComplete({
        artifact,
        rewards: gameRewards || artifact.completionRewards,
        finalState: finalProgress
      });
    }
  };

  const handleGameFail = () => {
    setGameState('failed');
    const finalProgress = getCurrentGameState();
    saveProgress(finalProgress, false);
  };

  const handleGameExit = () => {
    // Save progress before exiting
    if (gameState === 'playing') {
      const currentProgress = getCurrentGameState();
      if (currentProgress) {
        saveProgress(currentProgress, false);
      }
    }
    
    if (onExit) {
      onExit();
    }
  };

  const processRewards = async (rewardData) => {
    if (!user?.token || !rewardData) return;

    try {
      // Grant experience
      if (rewardData.experience) {
        // This would update the user's experience
        console.log(`Granted ${rewardData.experience} experience`);
      }

      // Unlock powers
      if (rewardData.powers && rewardData.powers.length > 0) {
        for (const power of rewardData.powers) {
          // This would unlock the power for the user
          console.log(`Unlocked power: ${power}`);
        }
      }

      // Unlock areas
      if (rewardData.areas && rewardData.areas.length > 0) {
        for (const area of rewardData.areas) {
          // This would unlock the area for the user
          console.log(`Unlocked area: ${area}`);
        }
      }

      // Grant achievements
      if (rewardData.achievements && rewardData.achievements.length > 0) {
        for (const achievement of rewardData.achievements) {
          // This would grant the achievement
          console.log(`Unlocked achievement: ${achievement}`);
        }
      }
    } catch (error) {
      console.error('Error processing rewards:', error);
    }
  };

  const renderGameContent = () => {
    if (!artifact || gameState === 'loading') {
      return (
        <div className="game-loading">
          <div className="loading-spinner"></div>
          <p>Loading {artifact?.name || 'game'}...</p>
        </div>
      );
    }

    if (gameState === 'failed' || error) {
      return (
        <div className="game-error">
          <h3>⚠️ Game Error</h3>
          <p>{error || 'Failed to load game'}</p>
          <button onClick={handleGameExit} className="exit-btn">Exit</button>
        </div>
      );
    }

    if (gameState === 'completed') {
      return (
        <div className="game-completed">
          <div className="completion-celebration">
            <h2>🎉 Congratulations!</h2>
            <p>You've completed <strong>{artifact.name}</strong></p>
            
            {rewards && (
              <div className="rewards-display">
                <h3>Rewards Earned:</h3>
                {rewards.experience && (
                  <div className="reward-item">
                    ⭐ {rewards.experience} Experience Points
                  </div>
                )}
                {rewards.powers && rewards.powers.map(power => (
                  <div key={power} className="reward-item">
                    ⚡ Unlocked Power: {power}
                  </div>
                ))}
                {rewards.areas && rewards.areas.map(area => (
                  <div key={area} className="reward-item">
                    🗺️ Unlocked Area: {area}
                  </div>
                ))}
                {rewards.achievements && rewards.achievements.map(achievement => (
                  <div key={achievement} className="reward-item">
                    🏆 Achievement: {achievement}
                  </div>
                ))}
              </div>
            )}
            
            <button onClick={handleGameExit} className="continue-btn">
              Continue Exploring
            </button>
          </div>
        </div>
      );
    }

    // Render the appropriate game component
    switch (artifact.gameConfig?.gameType || artifact.contentType) {
      case 'shooter':
        return (
          <Level4Shooter
            onComplete={handleGameComplete}
            onExit={handleGameExit}
            character={user}
            initialState={progress?.currentState}
            artifactMode={true}
          />
        );

      case 'textAdventure':
        return (
          <TextAdventure
            onComplete={handleGameComplete}
            onExit={handleGameExit}
            username={user?.username || 'player'}
            initialState={progress?.currentState}
            artifactMode={true}
          />
        );

      case 'terminal':
        return (
          <Terminal
            onComplete={handleGameComplete}
            onExit={handleGameExit}
            character={user}
            initialState={progress?.currentState}
            artifactMode={true}
          />
        );

      case 'puzzle':
        return (
          <InteractivePuzzleArtifact
            artifact={artifact}
            onComplete={handleGameComplete}
            onClose={handleGameExit}
            isOpen={true}
          />
        );

      default:
        return (
          <div className="unsupported-game">
            <h3>🚧 Game Type Not Supported</h3>
            <p>Game type: {artifact.gameConfig?.gameType || artifact.contentType}</p>
            <button onClick={handleGameExit} className="exit-btn">Exit</button>
          </div>
        );
    }
  };

  const renderGameHUD = () => {
    if (!isOpen || gameState === 'loading' || gameState === 'failed') return null;

    return (
      <div className="game-hud">
        <div className="hud-left">
          <div className="game-title">{artifact.name}</div>
          <div className="game-info">
            {artifact.gameConfig?.difficulty && (
              <span className="difficulty">Difficulty: {artifact.gameConfig.difficulty}</span>
            )}
            {artifact.gameConfig?.estimatedPlayTime && (
              <span className="playtime">~{artifact.gameConfig.estimatedPlayTime}min</span>
            )}
          </div>
        </div>
        
        <div className="hud-right">
          {gameState === 'playing' && (
            <button onClick={handleGamePause} className="hud-btn pause-btn">
              ⏸️ Pause
            </button>
          )}
          {gameState === 'paused' && (
            <button onClick={handleGameResume} className="hud-btn resume-btn">
              ▶️ Resume
            </button>
          )}
          <button onClick={handleGameExit} className="hud-btn exit-btn">
            🚪 Exit
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="artifact-game-launcher">
      <div className="game-container">
        {renderGameHUD()}
        <div className="game-viewport">
          {renderGameContent()}
        </div>
      </div>
      
      {gameState === 'ready' && (
        <div className="game-start-overlay">
          <div className="start-screen">
            <h2>{artifact.name}</h2>
            <p>{artifact.description}</p>
            
            {artifact.gameConfig?.difficulty && (
              <div className="game-details">
                <div className="detail-item">
                  <span className="label">Difficulty:</span>
                  <span className="value">{artifact.gameConfig.difficulty}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Estimated Time:</span>
                  <span className="value">{artifact.gameConfig?.estimatedPlayTime || 10} minutes</span>
                </div>
                {artifact.completionRewards?.experience && (
                  <div className="detail-item">
                    <span className="label">Reward:</span>
                    <span className="value">{artifact.completionRewards.experience} XP</span>
                  </div>
                )}
              </div>
            )}
            
            {progress?.completed ? (
              <div className="completed-notice">
                ✅ You've already completed this artifact!
                <p>You can replay it to improve your score.</p>
              </div>
            ) : progress?.attempts > 0 ? (
              <div className="progress-notice">
                📊 Continue your progress (Attempt #{progress.attempts + 1})
              </div>
            ) : (
              <div className="first-time-notice">
                🌟 First time playing this artifact!
              </div>
            )}
            
            <div className="start-actions">
              <button onClick={handleGameStart} className="start-btn">
                {progress?.attempts > 0 ? '🔄 Continue' : '🚀 Start Game'}
              </button>
              <button onClick={handleGameExit} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactGameLauncher; 