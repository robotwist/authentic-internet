import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateSkillBonuses } from '../constants/SkillTree';
import './InteractiveNPC.css';

const InteractiveNPC = ({ npc, onClose, onQuestComplete }) => {
  const { user } = useAuth();
  const [currentDialogue, setCurrentDialogue] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [questProgress, setQuestProgress] = useState({});

  const skillBonuses = calculateSkillBonuses(user?.skills || {});

  // NPC dialogue based on player skills and progress
  const getNPCDialogue = () => {
    const baseDialogue = npc.dialogue || [];
    const enhancedDialogue = [...baseDialogue];

    // Add skill-specific dialogue
    if (skillBonuses.exploration > 0) {
      enhancedDialogue.push({
        type: 'skill',
        text: `Ah, I can see you're quite the explorer! Your knowledge of hidden paths is impressive.`,
        options: [
          { text: 'Tell me about hidden areas', action: 'explore_hint' },
          { text: 'Share your wisdom', action: 'skill_share' }
        ]
      });
    }

    if (skillBonuses.creation > 0) {
      enhancedDialogue.push({
        type: 'skill',
        text: `Your creative spirit is strong! I sense great artifacts in your future.`,
        options: [
          { text: 'Ask about artifact creation', action: 'creation_advice' },
          { text: 'Share your creations', action: 'show_artifacts' }
        ]
      });
    }

    if (skillBonuses.social > 0) {
      enhancedDialogue.push({
        type: 'skill',
        text: `You have a way with people! The community speaks highly of you.`,
        options: [
          { text: 'Learn about the community', action: 'community_info' },
          { text: 'Ask about collaborations', action: 'collaboration_help' }
        ]
      });
    }

    return enhancedDialogue;
  };

  const handleDialogueOption = async (option) => {
    setSelectedOption(option);
    setIsLoading(true);

    try {
      switch (option.action) {
        case 'quest_accept':
          // Start a new quest
          const newQuest = {
            id: `quest_${npc.id}_${Date.now()}`,
            npcId: npc.id,
            title: npc.quests[0].title,
            description: npc.quests[0].description,
            requirements: npc.quests[0].requirements,
            rewards: npc.quests[0].rewards,
            progress: 0,
            startedAt: new Date().toISOString()
          };
          
          // Save quest to user's active quests
          const updatedUser = {
            ...user,
            activeQuests: [...(user.activeQuests || []), newQuest]
          };
          
          // Update user context (you'll need to implement this)
          // updateUser(updatedUser);
          
          setCurrentDialogue(prev => prev + 1);
          break;

        case 'quest_complete':
          // Complete quest and give rewards
          const quest = user.activeQuests?.find(q => q.npcId === npc.id);
          if (quest) {
            const rewards = {
              experience: quest.rewards.experience || 50,
              items: quest.rewards.items || [],
              skills: quest.rewards.skills || []
            };

            // Apply rewards
            const updatedUser = {
              ...user,
              experience: (user.experience || 0) + rewards.experience,
              activeQuests: user.activeQuests?.filter(q => q.id !== quest.id) || [],
              completedQuests: [...(user.completedQuests || []), quest.id]
            };

            // Update user context
            // updateUser(updatedUser);
            
            if (onQuestComplete) {
              onQuestComplete(quest, rewards);
            }
          }
          break;

        case 'explore_hint':
          // Give exploration hints based on skill level
          const hintLevel = Math.min(Math.floor(skillBonuses.exploration / 10), 3);
          const hints = [
            'I heard there are hidden passages in the ancient ruins...',
            'The old library contains maps of forgotten areas...',
            'Legend says there\'s a secret chamber beneath the town square...',
            'The highest skill reveals all secrets of this world...'
          ];
          
          setCurrentDialogue(prev => prev + 1);
          break;

        case 'creation_advice':
          // Give creation advice based on skill level
          const adviceLevel = Math.min(Math.floor(skillBonuses.creation / 10), 3);
          const advice = [
            'Start with simple artifacts to build your skills...',
            'Try combining different elements for unique results...',
            'Collaborate with other creators for amazing outcomes...',
            'Master creators can bend reality itself...'
          ];
          
          setCurrentDialogue(prev => prev + 1);
          break;

        case 'community_info':
          // Share community information
          setCurrentDialogue(prev => prev + 1);
          break;

        default:
          setCurrentDialogue(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error handling dialogue option:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dialogue = getNPCDialogue();
  const currentDialogueData = dialogue[currentDialogue] || dialogue[0];

  if (!currentDialogueData) {
    return (
      <div className="npc-modal">
        <div className="npc-container">
          <div className="npc-header">
            <h2>{npc.name}</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="npc-content">
            <p>No dialogue available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="npc-modal">
      <div className="npc-container">
        <div className="npc-header">
          <div className="npc-info">
            <div className="npc-avatar">{npc.avatar}</div>
            <div className="npc-details">
              <h2>{npc.name}</h2>
              <p className="npc-title">{npc.title}</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="npc-content">
          <div className="dialogue-box">
            <p className="dialogue-text">{currentDialogueData.text}</p>
            
            {currentDialogueData.options && (
              <div className="dialogue-options">
                {currentDialogueData.options.map((option, index) => (
                  <button
                    key={index}
                    className={`dialogue-option ${selectedOption === option ? 'selected' : ''}`}
                    onClick={() => handleDialogueOption(option)}
                    disabled={isLoading}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            )}
          </div>

          {npc.quests && npc.quests.length > 0 && (
            <div className="quest-section">
              <h3>Available Quests</h3>
              {npc.quests.map((quest, index) => {
                const isCompleted = user.completedQuests?.includes(quest.id);
                const isActive = user.activeQuests?.some(q => q.id === quest.id);
                const canAccept = !isCompleted && !isActive;

                return (
                  <div key={index} className={`quest-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                    <h4>{quest.title}</h4>
                    <p>{quest.description}</p>
                    {quest.requirements && (
                      <div className="quest-requirements">
                        <strong>Requirements:</strong> {quest.requirements.join(', ')}
                      </div>
                    )}
                    {quest.rewards && (
                      <div className="quest-rewards">
                        <strong>Rewards:</strong> {quest.rewards.experience} XP
                        {quest.rewards.items?.map(item => `, ${item}`).join('')}
                      </div>
                    )}
                    {canAccept && (
                      <button 
                        className="quest-button accept"
                        onClick={() => handleDialogueOption({ action: 'quest_accept', questId: quest.id })}
                        disabled={isLoading}
                      >
                        Accept Quest
                      </button>
                    )}
                    {isActive && (
                      <button 
                        className="quest-button complete"
                        onClick={() => handleDialogueOption({ action: 'quest_complete', questId: quest.id })}
                        disabled={isLoading}
                      >
                        Complete Quest
                      </button>
                    )}
                    {isCompleted && (
                      <span className="quest-status">✓ Completed</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner">Processing...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveNPC;
