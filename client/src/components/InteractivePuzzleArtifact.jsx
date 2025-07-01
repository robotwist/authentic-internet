import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import TextAdventure from './TextAdventure';
import NPCDialog from './NPCDialog';
import Terminal from './Terminal';
import './InteractivePuzzleArtifact.css';

/**
 * Interactive Puzzle Artifact Component
 * Handles different types of interactive puzzles embedded in artifacts
 */
const InteractivePuzzleArtifact = ({ 
  artifact, 
  onClose, 
  onComplete,
  isOpen = false 
}) => {
  const { user } = useAuth();
  const [playerProgress, setPlayerProgress] = useState(null);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [gameState, setGameState] = useState({});
  const [showHints, setShowHints] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize puzzle when opened
  useEffect(() => {
    if (isOpen && artifact && user) {
      initializePuzzle();
    }
  }, [isOpen, artifact, user]);

  const initializePuzzle = async () => {
    setLoading(true);
    setStartTime(Date.now());
    
    try {
      // Fetch player's existing progress
      const response = await fetch(`/api/artifacts/${artifact._id}/progress`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const progress = await response.json();
        setPlayerProgress(progress);
        setCurrentAttempt(progress.attempts || 0);
        setCompleted(progress.completed || false);
        
        // Restore game state if exists
        if (progress.currentState) {
          setGameState(progress.currentState);
        }
      } else {
        // First time playing this puzzle
        setPlayerProgress({
          attempts: 0,
          completed: false,
          currentState: {},
          hintsUsed: 0,
          timeSpent: 0
        });
      }
    } catch (error) {
      console.error('Error loading puzzle progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = useCallback(async (state, isCompleted = false) => {
    if (!user || !artifact) return;

    const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    
    try {
      await fetch(`/api/artifacts/${artifact._id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentState: state,
          completed: isCompleted,
          timeSpent: timeSpent,
          attempts: currentAttempt + (isCompleted ? 1 : 0)
        })
      });

      if (isCompleted) {
        setCompleted(true);
        handlePuzzleComplete();
      }
    } catch (error) {
      console.error('Error saving puzzle progress:', error);
    }
  }, [user, artifact, startTime, currentAttempt]);

  const handlePuzzleComplete = async () => {
    if (!artifact.completionRewards) return;

    const rewards = artifact.completionRewards;
    
    // Grant experience
    if (rewards.experience) {
      // Add experience through your existing system
      console.log(`Granted ${rewards.experience} XP`);
    }

    // Grant items
    if (rewards.items && rewards.items.length > 0) {
      console.log('Granted items:', rewards.items);
    }

    // Unlock achievements
    if (rewards.achievements && rewards.achievements.length > 0) {
      console.log('Unlocked achievements:', rewards.achievements);
    }

    // Make other artifacts visible
    if (rewards.unlockArtifacts && rewards.unlockArtifacts.length > 0) {
      console.log('Unlocked artifacts:', rewards.unlockArtifacts);
    }

    if (onComplete) {
      onComplete(artifact, rewards);
    }
  };

  const requestHint = async () => {
    if (!artifact.gameConfig.hintsEnabled) return;

    try {
      const response = await fetch(`/api/artifacts/${artifact._id}/hint`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const hint = await response.json();
        setShowHints(true);
        return hint;
      }
    } catch (error) {
      console.error('Error getting hint:', error);
    }
  };

  const renderPuzzleContent = () => {
    if (loading) return <div className="puzzle-loading">Loading puzzle...</div>;
    if (completed) return <div className="puzzle-completed">Puzzle already completed!</div>;

    switch (artifact.puzzleType) {
      case 'textAdventure':
        return (
          <TextAdventure
            gameWorld={artifact.gameConfig.rooms}
            startRoom={artifact.gameConfig.startRoom}
            winCondition={artifact.gameConfig.winCondition}
            onStateChange={(state) => setGameState(state)}
            onComplete={() => saveProgress(gameState, true)}
            initialState={gameState}
            username={user.username}
          />
        );

      case 'dialogChallenge':
        return (
          <NPCDialog
            isOpen={true}
            npc={{
              name: artifact.name,
              dialog: {
                greeting: artifact.gameConfig.dialogTree[0]?.text || "Welcome to the challenge!",
                responses: artifact.gameConfig.dialogTree[0]?.responses || []
              }
            }}
            onClose={onClose}
            character={user}
            onResponseSelect={(response) => {
              if (response.isExit && response.completePuzzle) {
                saveProgress({ dialogComplete: true }, true);
              }
            }}
          />
        );

      case 'terminalPuzzle':
        return (
          <Terminal
            isOpen={true}
            onClose={onClose}
            onComplete={() => saveProgress({ terminalComplete: true }, true)}
            terminalData={{
              commands: artifact.gameConfig.terminalCommands,
              files: artifact.gameConfig.terminalFiles,
              winCondition: artifact.gameConfig.terminalWinCondition
            }}
          />
        );

      case 'apiQuiz':
        return <ApiQuizPuzzle artifact={artifact} onComplete={() => saveProgress({ quizComplete: true }, true)} />;

      case 'logicChallenge':
        return <LogicChallengePuzzle artifact={artifact} onComplete={() => saveProgress({ logicComplete: true }, true)} />;

      case 'riddle':
      default:
        return <RiddlePuzzle artifact={artifact} onComplete={() => saveProgress({ riddleComplete: true }, true)} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="interactive-puzzle-overlay">
      <div className="interactive-puzzle-container">
        <div className="puzzle-header">
          <h2>{artifact.name}</h2>
          <div className="puzzle-info">
            <span>Type: {artifact.puzzleType}</span>
            {artifact.gameConfig.timeLimit && (
              <span>Time Limit: {artifact.gameConfig.timeLimit}s</span>
            )}
            <span>Attempts: {currentAttempt}</span>
            {artifact.completionStats.difficultyRating > 0 && (
              <span>Difficulty: {artifact.completionStats.difficultyRating}/10</span>
            )}
          </div>
        </div>

        <div className="puzzle-content">
          {renderPuzzleContent()}
        </div>

        <div className="puzzle-actions">
          {artifact.gameConfig.hintsEnabled && !completed && (
            <button onClick={requestHint} className="hint-button">
              Get Hint ({playerProgress?.hintsUsed || 0} used)
            </button>
          )}
          <button onClick={onClose} className="close-puzzle-button">
            Close
          </button>
        </div>

        {showHints && (
          <div className="hints-overlay">
            <div className="hints-content">
              <h3>Hints</h3>
              <button onClick={() => setShowHints(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple puzzle components for non-complex types
const RiddlePuzzle = ({ artifact, onComplete }) => {
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setAttempts(prev => prev + 1);

    if (answer.toLowerCase().trim() === artifact.unlockAnswer.toLowerCase().trim()) {
      setFeedback('Correct! Well done!');
      setTimeout(() => onComplete(), 1000);
    } else {
      setFeedback('Not quite right. Try again!');
    }
  };

  return (
    <div className="riddle-puzzle">
      <div className="riddle-text">
        <p>{artifact.riddle}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter your answer..."
          autoFocus
        />
        <button type="submit">Submit Answer</button>
      </form>
      {feedback && <div className="feedback">{feedback}</div>}
      <div className="attempts">Attempts: {attempts}</div>
    </div>
  );
};

const ApiQuizPuzzle = ({ artifact, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [apiData, setApiData] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');

  useEffect(() => {
    // Fetch data from the specified API
    fetchApiData();
  }, [currentQuestion]);

  const fetchApiData = async () => {
    const question = artifact.gameConfig.questions[currentQuestion];
    if (question && question.apiEndpoint) {
      try {
        const response = await fetch(question.apiEndpoint);
        const data = await response.json();
        setApiData(data);
      } catch (error) {
        console.error('Error fetching API data:', error);
      }
    }
  };

  const handleAnswer = () => {
    const question = artifact.gameConfig.questions[currentQuestion];
    const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    if (currentQuestion < artifact.gameConfig.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setUserAnswer('');
    } else {
      // Quiz complete
      const passed = score >= Math.ceil(artifact.gameConfig.questions.length * 0.7); // 70% to pass
      if (passed) {
        onComplete();
      }
    }
  };

  const question = artifact.gameConfig.questions[currentQuestion];
  
  return (
    <div className="api-quiz-puzzle">
      <div className="quiz-progress">
        Question {currentQuestion + 1} of {artifact.gameConfig.questions.length} | Score: {score}
      </div>
      
      {question && (
        <div className="question">
          <h3>{question.question}</h3>
          {apiData && (
            <div className="api-data">
              <pre>{JSON.stringify(apiData, null, 2)}</pre>
            </div>
          )}
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Your answer..."
          />
          <button onClick={handleAnswer}>Submit</button>
        </div>
      )}
    </div>
  );
};

const LogicChallengePuzzle = ({ artifact, onComplete }) => {
  const [userSolution, setUserSolution] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = () => {
    setAttempts(prev => prev + 1);
    
    // Check solution based on logic type
    const config = artifact.gameConfig;
    let isCorrect = false;

    switch (config.logicType) {
      case 'math':
        isCorrect = eval(userSolution) === config.challengeData.expectedResult;
        break;
      case 'pattern':
        isCorrect = userSolution === config.challengeData.nextInSequence;
        break;
      case 'sequence':
        isCorrect = userSolution.split(',').map(n => parseInt(n.trim())).toString() === 
                   config.challengeData.correctSequence.toString();
        break;
    }

    if (isCorrect) {
      onComplete();
    }
  };

  return (
    <div className="logic-challenge-puzzle">
      <div className="challenge-description">
        <h3>{artifact.gameConfig.challengeData.title}</h3>
        <p>{artifact.gameConfig.challengeData.description}</p>
      </div>
      
      <div className="challenge-data">
        {artifact.gameConfig.challengeData.data && (
          <pre>{JSON.stringify(artifact.gameConfig.challengeData.data, null, 2)}</pre>
        )}
      </div>

      <input
        type="text"
        value={userSolution}
        onChange={(e) => setUserSolution(e.target.value)}
        placeholder="Enter your solution..."
      />
      <button onClick={handleSubmit}>Submit Solution</button>
      <div className="attempts">Attempts: {attempts}</div>
    </div>
  );
};

export default InteractivePuzzleArtifact; 