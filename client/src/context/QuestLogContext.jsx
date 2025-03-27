import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import gameProgressService from '../services/GameProgressService';

const QuestLogContext = createContext();

/**
 * QuestLogProvider - Manages player quests and their state
 * Provides context for tracking quest progress, completion, and rewards
 */
export const QuestLogProvider = ({ children }) => {
  const [quests, setQuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useContext(AuthContext);

  // Load quests from player profile or service
  useEffect(() => {
    const loadQuests = async () => {
      if (!isAuthenticated || !user) {
        setQuests([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Load quests from the game progress service
        const playerQuests = await gameProgressService.getPlayerQuests(user.id);
        setQuests(playerQuests || []);
      } catch (error) {
        console.error('Failed to load quests:', error);
        // Use empty array as fallback
        setQuests([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuests();
  }, [user, isAuthenticated]);

  // Save quests whenever they change
  useEffect(() => {
    if (!isAuthenticated || !user || isLoading) {
      return;
    }

    // Save quests to the game progress service
    gameProgressService.savePlayerQuests(user.id, quests)
      .catch(error => {
        console.error('Failed to save quests:', error);
      });
  }, [quests, user, isAuthenticated, isLoading]);

  /**
   * Add a new quest to the player's quest log
   */
  const addQuest = (quest) => {
    if (!quest || !quest.id) {
      console.error('Invalid quest data');
      return;
    }

    // Check if quest already exists
    if (quests.some(q => q.id === quest.id)) {
      console.warn(`Quest ${quest.id} already exists in quest log`);
      return;
    }

    // Add the new quest with initialized fields
    setQuests(prevQuests => [
      ...prevQuests,
      {
        ...quest,
        dateAccepted: quest.dateAccepted || new Date(),
        dateCompleted: null,
        completed: false,
        progress: 0,
        // Ensure all objectives have a completed property
        objectives: (quest.objectives || []).map(obj => ({
          ...obj,
          completed: obj.completed || false
        }))
      }
    ]);
  };

  /**
   * Update an objective's completion status within a quest
   */
  const updateObjective = (questId, objectiveId, isCompleted) => {
    setQuests(prevQuests => 
      prevQuests.map(quest => {
        if (quest.id !== questId) return quest;
        
        // Update the specific objective
        const updatedObjectives = quest.objectives.map(objective => {
          if (objective.id !== objectiveId) return objective;
          return { ...objective, completed: isCompleted };
        });
        
        // Calculate completion percentage
        const completedCount = updatedObjectives.filter(obj => obj.completed).length;
        const progress = Math.round((completedCount / updatedObjectives.length) * 100);
        
        // Check if all objectives are completed
        const allCompleted = updatedObjectives.every(obj => obj.completed);
        
        return {
          ...quest,
          objectives: updatedObjectives,
          progress,
          completed: allCompleted,
          dateCompleted: allCompleted && !quest.completed ? new Date() : quest.dateCompleted
        };
      })
    );
  };

  /**
   * Mark a quest as complete
   */
  const completeQuest = (questId) => {
    setQuests(prevQuests => 
      prevQuests.map(quest => {
        if (quest.id !== questId) return quest;
        
        // Mark all objectives as completed
        const updatedObjectives = quest.objectives.map(objective => ({
          ...objective,
          completed: true
        }));
        
        return {
          ...quest,
          objectives: updatedObjectives,
          progress: 100,
          completed: true,
          dateCompleted: quest.dateCompleted || new Date()
        };
      })
    );
  };

  /**
   * Remove a quest from the quest log
   */
  const removeQuest = (questId) => {
    setQuests(prevQuests => prevQuests.filter(quest => quest.id !== questId));
  };

  /**
   * Get a specific quest by ID
   */
  const getQuest = (questId) => {
    return quests.find(quest => quest.id === questId);
  };

  /**
   * Get active quests (not completed)
   */
  const getActiveQuests = () => {
    return quests.filter(quest => !quest.completed);
  };

  /**
   * Get completed quests
   */
  const getCompletedQuests = () => {
    return quests.filter(quest => quest.completed);
  };

  const contextValue = {
    quests,
    isLoading,
    addQuest,
    updateObjective,
    completeQuest,
    removeQuest,
    getQuest,
    getActiveQuests,
    getCompletedQuests
  };

  return (
    <QuestLogContext.Provider value={contextValue}>
      {children}
    </QuestLogContext.Provider>
  );
};

export default QuestLogContext; 