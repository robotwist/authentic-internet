import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserChallenges, claimChallengeReward } from '../api/api';
import './DailyChallenges.css';

const DailyChallenges = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Daily challenge definitions
  const challengeTemplates = [
    {
      id: 'explore_world',
      title: 'World Explorer',
      description: 'Visit 3 different areas in the game world',
      type: 'exploration',
      target: 3,
      reward: { experience: 25, coins: 10 },
      icon: '🗺️'
    },
    {
      id: 'create_artifact',
      title: 'Digital Creator',
      description: 'Create 1 new artifact',
      type: 'creation',
      target: 1,
      reward: { experience: 30, coins: 15 },
      icon: '🎨'
    },
    {
      id: 'social_interaction',
      title: 'Social Butterfly',
      description: 'Send 5 messages in chat',
      type: 'social',
      target: 5,
      reward: { experience: 20, coins: 8 },
      icon: '💬'
    },
    {
      id: 'collect_artifacts',
      title: 'Artifact Collector',
      description: 'Collect 2 artifacts from the world',
      type: 'collection',
      target: 2,
      reward: { experience: 35, coins: 12 },
      icon: '🏺'
    },
    {
      id: 'skill_progress',
      title: 'Skill Master',
      description: 'Upgrade 1 skill in the skill tree',
      type: 'progression',
      target: 1,
      reward: { experience: 40, coins: 20 },
      icon: '⭐'
    },
    {
      id: 'friend_interaction',
      title: 'Friend Connector',
      description: 'Interact with 2 different players',
      type: 'social',
      target: 2,
      reward: { experience: 25, coins: 10 },
      icon: '🤝'
    }
  ];

  useEffect(() => {
    generateDailyChallenges();
  }, []);

  const generateDailyChallenges = () => {
    const today = new Date().toDateString();
    const userChallenges = user?.dailyChallenges || {};
    
    // Check if we need to generate new challenges for today
    if (userChallenges.date !== today) {
      // Select 3 random challenges
      const selectedChallenges = [];
      const shuffled = [...challengeTemplates].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < 3; i++) {
        const challenge = shuffled[i];
        selectedChallenges.push({
          ...challenge,
          progress: 0,
          completed: false,
          claimed: false
        });
      }

      const newChallenges = {
        date: today,
        challenges: selectedChallenges
      };

      setChallenges(selectedChallenges);
      
      // Update user with new challenges
      updateUserChallenges(newChallenges).then(() => {
        updateUser({ ...user, dailyChallenges: newChallenges });
      }).catch(error => {
        console.error('Error updating daily challenges:', error);
      });
    } else {
      // Load existing challenges
      setChallenges(userChallenges.challenges || []);
    }
  };

  const updateChallengeProgress = async (challengeId, progress) => {
    const updatedChallenges = challenges.map(challenge => {
      if (challenge.id === challengeId) {
        const newProgress = Math.min(progress, challenge.target);
        const completed = newProgress >= challenge.target;
        return {
          ...challenge,
          progress: newProgress,
          completed
        };
      }
      return challenge;
    });

    setChallenges(updatedChallenges);

    // Update on server
    try {
      const updatedUserChallenges = {
        date: new Date().toDateString(),
        challenges: updatedChallenges
      };
      
      await updateUserChallenges(updatedUserChallenges);
      updateUser({ ...user, dailyChallenges: updatedUserChallenges });
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  };

  const claimReward = async (challengeId) => {
    setIsLoading(true);
    setMessage('');

    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge || !challenge.completed || challenge.claimed) {
        throw new Error('Challenge not available for claiming');
      }

      // Claim reward on server
      const result = await claimChallengeReward(challengeId, challenge.reward);
      
      // Update local state
      const updatedChallenges = challenges.map(c => 
        c.id === challengeId ? { ...c, claimed: true } : c
      );
      
      setChallenges(updatedChallenges);
      
      // Update user with new challenges and rewards
      const updatedUserChallenges = {
        date: new Date().toDateString(),
        challenges: updatedChallenges
      };
      
      const updatedUserData = {
        ...user,
        dailyChallenges: updatedUserChallenges,
        experience: (user.experience || 0) + challenge.reward.experience,
        coins: (user.coins || 0) + challenge.reward.coins
      };
      
      updateUser(updatedUserData);
      
      setMessage(`✅ Claimed ${challenge.reward.experience} XP and ${challenge.reward.coins} coins!`);
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('Error claiming reward:', error);
      setMessage('❌ Failed to claim reward. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = (progress, target) => {
    return Math.min((progress / target) * 100, 100);
  };

  const getChallengeStatus = (challenge) => {
    if (challenge.claimed) return 'claimed';
    if (challenge.completed) return 'completed';
    if (challenge.progress > 0) return 'in-progress';
    return 'not-started';
  };

  return (
    <div className="daily-challenges-modal">
      <div className="daily-challenges-container">
        <div className="challenges-header">
          <h1>📅 Daily Challenges</h1>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="challenges-info">
          <p>Complete daily challenges to earn experience and rewards!</p>
          <div className="streak-info">
            <span>🔥 Current Streak: {user?.challengeStreak || 0} days</span>
          </div>
        </div>

        <div className="challenges-grid">
          {challenges.map((challenge) => {
            const status = getChallengeStatus(challenge);
            const progressPercent = getProgressPercentage(challenge.progress, challenge.target);
            
            return (
              <div key={challenge.id} className={`challenge-card ${status}`}>
                <div className="challenge-header">
                  <div className="challenge-icon">{challenge.icon}</div>
                  <div className="challenge-info">
                    <h3>{challenge.title}</h3>
                    <p>{challenge.description}</p>
                  </div>
                  <div className="challenge-status">
                    {status === 'claimed' && <span className="status-badge claimed">✓ Claimed</span>}
                    {status === 'completed' && <span className="status-badge completed">✓ Complete</span>}
                    {status === 'in-progress' && <span className="status-badge progress">In Progress</span>}
                  </div>
                </div>

                <div className="challenge-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {challenge.progress} / {challenge.target}
                  </div>
                </div>

                <div className="challenge-rewards">
                  <div className="reward-item">
                    <span className="reward-icon">⭐</span>
                    <span className="reward-amount">{challenge.reward.experience} XP</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-icon">🪙</span>
                    <span className="reward-amount">{challenge.reward.coins} Coins</span>
                  </div>
                </div>

                {status === 'completed' && (
                  <button 
                    className="claim-button"
                    onClick={() => claimReward(challenge.id)}
                    disabled={isLoading}
                  >
                    Claim Reward
                  </button>
                )}

                {status === 'claimed' && (
                  <div className="claimed-message">
                    Reward claimed! Come back tomorrow for new challenges.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="challenges-footer">
          <p>New challenges available every day at midnight!</p>
          <div className="completion-bonus">
            <strong>Complete all 3 challenges for a bonus reward!</strong>
          </div>
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner">Processing...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyChallenges;
