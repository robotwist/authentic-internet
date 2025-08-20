import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApi } from '../api/apiConfig';
import './QuestLog.css';

const QuestLog = ({ onClose, onQuestUpdate }) => {
  const { user } = useAuth();
  const [quests, setQuests] = useState({
    activeQuests: [],
    completedQuests: [],
    stats: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuest, setSelectedQuest] = useState(null);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const response = await getApi().get('/api/quests');
      if (response.data.success) {
        setQuests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching quests:', error);
      setError('Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteStage = async (questId, stageIndex) => {
    try {
      const response = await getApi().post('/api/quests/complete-stage', {
        questId,
        stageIndex
      });

      if (response.data.success) {
        // Refresh quests
        await fetchQuests();
        
        // Notify parent component
        if (onQuestUpdate) {
          onQuestUpdate(response.data.data);
        }

        // Show success message
        alert(`Stage completed! You earned ${response.data.data.rewards.exp || 0} XP!`);
      }
    } catch (error) {
      console.error('Error completing stage:', error);
      alert('Failed to complete stage: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAbandonQuest = async (questId) => {
    if (!confirm('Are you sure you want to abandon this quest? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await getApi().delete(`/api/quests/abandon/${questId}`);
      if (response.data.success) {
        await fetchQuests();
        alert('Quest abandoned successfully');
      }
    } catch (error) {
      console.error('Error abandoning quest:', error);
      alert('Failed to abandon quest: ' + (error.response?.data?.message || error.message));
    }
  };

  const getQuestProgress = (quest) => {
    const completedStages = quest.stages.filter(stage => stage.completed).length;
    const totalStages = quest.stages.length;
    return Math.round((completedStages / totalStages) * 100);
  };

  const getQuestStatus = (quest) => {
    if (quest.isCompleted) return 'completed';
    if (quest.isActive) return 'active';
    return 'available';
  };

  if (loading) {
    return (
      <div className="quest-log-overlay">
        <div className="quest-log">
          <div className="quest-log-header">
            <h2>Quest Log</h2>
            <button onClick={onClose} className="close-button">×</button>
          </div>
          <div className="loading">Loading quests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="quest-log-overlay">
      <div className="quest-log">
        <div className="quest-log-header">
          <h2>Quest Log</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Quest Statistics */}
        <div className="quest-stats">
          <div className="stat-item">
            <span className="stat-label">Active Quests:</span>
            <span className="stat-value">{quests.activeQuests.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Completed:</span>
            <span className="stat-value">{quests.stats.totalQuestsCompleted || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total XP Earned:</span>
            <span className="stat-value">{quests.stats.totalExpEarned || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Current Streak:</span>
            <span className="stat-value">{quests.stats.currentStreak || 0}</span>
          </div>
        </div>

        {/* Active Quests */}
        <div className="quest-section">
          <h3>Active Quests ({quests.activeQuests.length})</h3>
          {quests.activeQuests.length === 0 ? (
            <p className="no-quests">No active quests. Visit NPCs to start new quests!</p>
          ) : (
            <div className="quest-list">
              {quests.activeQuests.map((quest) => (
                <div key={quest.questId} className="quest-item active">
                  <div className="quest-header">
                    <h4>{quest.title}</h4>
                    <div className="quest-actions">
                      <button 
                        onClick={() => setSelectedQuest(selectedQuest?.questId === quest.questId ? null : quest)}
                        className="view-details-btn"
                      >
                        {selectedQuest?.questId === quest.questId ? 'Hide' : 'View'} Details
                      </button>
                      <button 
                        onClick={() => handleAbandonQuest(quest.questId)}
                        className="abandon-btn"
                      >
                        Abandon
                      </button>
                    </div>
                  </div>
                  
                  <div className="quest-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${getQuestProgress(quest)}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {quest.stages.filter(s => s.completed).length} / {quest.stages.length} stages
                    </span>
                  </div>

                  {selectedQuest?.questId === quest.questId && (
                    <div className="quest-details">
                      <p className="quest-description">{quest.description}</p>
                      <div className="quest-stages">
                        {quest.stages.map((stage, index) => (
                          <div key={index} className={`stage-item ${stage.completed ? 'completed' : ''}`}>
                            <div className="stage-header">
                              <span className="stage-number">Stage {index + 1}</span>
                              {stage.completed && <span className="completed-badge">✓</span>}
                            </div>
                            <p className="stage-task">{stage.task}</p>
                            {stage.reward && (
                              <div className="stage-reward">
                                <span>Reward: </span>
                                {stage.reward.exp && <span className="reward-exp">+{stage.reward.exp} XP</span>}
                                {stage.reward.item && <span className="reward-item">+{stage.reward.item}</span>}
                                {stage.reward.ability && <span className="reward-ability">+{stage.reward.ability}</span>}
                              </div>
                            )}
                            {!stage.completed && (
                              <button 
                                onClick={() => handleCompleteStage(quest.questId, index)}
                                className="complete-stage-btn"
                              >
                                Complete Stage
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Quests */}
        {quests.completedQuests.length > 0 && (
          <div className="quest-section">
            <h3>Completed Quests ({quests.completedQuests.length})</h3>
            <div className="quest-list">
              {quests.completedQuests.slice(0, 5).map((quest) => (
                <div key={quest.questId} className="quest-item completed">
                  <div className="quest-header">
                    <h4>{quest.title}</h4>
                    <span className="completed-date">
                      {new Date(quest.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="quest-rewards">
                    <span>Total Rewards: </span>
                    <span className="reward-exp">+{quest.totalExp} XP</span>
                    {quest.totalItems.length > 0 && (
                      <span className="reward-items">+{quest.totalItems.join(', ')}</span>
                    )}
                    {quest.totalAbilities.length > 0 && (
                      <span className="reward-abilities">+{quest.totalAbilities.join(', ')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestLog;
