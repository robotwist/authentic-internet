import { useState, useCallback } from 'react';
import { addUserAchievement, updateUserExperience } from '../api/api';
import { useAuth } from '../context/AuthContext';

/**
 * Achievement system hook - handles XP, level completion, and achievement unlocking
 * Extracted from GameWorld.jsx to reduce complexity
 */
export const useAchievementSystem = () => {
  const [xpNotifications, setXpNotifications] = useState([]);
  const [achievementNotifications, setAchievementNotifications] = useState([]);
  const [levelCompletion, setLevelCompletion] = useState({
    level1: false,
    level2: false,
    level3: false,
    level4: false
  });
  const [showWinNotification, setShowWinNotification] = useState(false);
  const [winMessage, setWinMessage] = useState('');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState('');

  const { user, updateUser } = useAuth();

  const awardXP = useCallback((amount, reason) => {
    // Update local experience state
    const newExperience = (user?.experience || 0) + amount;
    
    // Create notification
    const notificationId = Date.now().toString();
    setXpNotifications(prev => [
      ...prev,
      { id: notificationId, amount, reason }
    ]);
    
    // Update user context
    if (user) {
      const updatedUser = { ...user, experience: newExperience };
      updateUser(updatedUser);
      
      // Update in database
      updateUserExperience(newExperience).catch(err => 
        console.error('Failed to update experience in database:', err)
      );
    }
    
    return notificationId;
  }, [user, updateUser]);

  const handleAchievementUnlocked = useCallback((id, title, description) => {
    const achievement = { id, title, description, unlockedAt: new Date().toISOString() };
    
    setAchievementNotifications(prev => [...prev, achievement]);
    
    // Add to user achievements if logged in
    if (user?.id) {
      addUserAchievement(user.id, achievement).catch(err =>
        console.error('Failed to save achievement:', err)
      );
    }
  }, [user]);

  const handleLevelCompletion = useCallback((level, soundManager) => {
    if (levelCompletion[level]) return;
    
    setLevelCompletion(prev => ({
      ...prev,
      [level]: true
    }));
    
    // Save to localStorage
    try {
      localStorage.setItem(`level-${level}-completed`, 'true');
    } catch (error) {
      console.error("Error saving level completion to localStorage:", error);
    }
    
    // Level-specific rewards and messages
    const levelConfigs = {
      level1: {
        message: 'Congratulations! You have completed Level 1 - The Digital Wilderness!',
        xp: 10,
        showReward: () => {
          setTimeout(() => {
            const rewardShown = localStorage.getItem('nkd-man-reward-shown');
            if (!rewardShown) {
              setCurrentAchievement('level1');
              setShowRewardModal(true);
              localStorage.setItem('nkd-man-reward-shown', 'true');
            }
          }, 5500);
        }
      },
      level2: {
        message: 'Magnificent! You have completed Level 2 - The Realm of Shadows!',
        xp: 15
      },
      level3: {
        message: 'Extraordinary! You have completed Level 3 - The Terminal Void!',
        xp: 20,
        showReward: () => {
          setTimeout(() => {
            const goToLevel4 = window.confirm('You have unlocked Level 4: The Hemingway Challenge! Ready to enter?');
            if (goToLevel4) {
              if (soundManager) {
                const sound = Math.random() < 0.6 ? 'toilet_flush' : 'portal';
                soundManager.playSound(sound, 0.5);
              }
              // This would trigger Level 4 - needs to be handled by parent component
            }
          }, 3000);
        }
      },
      level4: {
        message: 'Amazing! You have completed Level 4 - The Hemingway Challenge!',
        xp: 30
      }
    };

    const config = levelConfigs[level] || { 
      message: 'Level completed!', 
      xp: 10 
    };
    
    // Play sound and award XP
    if (soundManager) soundManager.playSound('level_complete');
    awardXP(config.xp, `Completed ${level}`);
    
    // Show win notification
    setWinMessage(config.message);
    setShowWinNotification(true);
    
    setTimeout(() => {
      setShowWinNotification(false);
    }, 5000);

    // Handle special rewards
    if (config.showReward) {
      config.showReward();
    }
  }, [levelCompletion, awardXP]);

  const removeXpNotification = useCallback((id) => {
    setXpNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const removeAchievementNotification = useCallback((id) => {
    setAchievementNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const checkForLevelUpAchievements = useCallback((experience) => {
    const level = Math.floor(experience / 100) + 1;
    
    // Check for level-based achievements
    const levelAchievements = {
      5: { id: 'level_5', title: 'Novice Explorer', description: 'Reached level 5' },
      10: { id: 'level_10', title: 'Seasoned Adventurer', description: 'Reached level 10' },
      20: { id: 'level_20', title: 'Expert Explorer', description: 'Reached level 20' }
    };

    const achievement = levelAchievements[level];
    if (achievement) {
      handleAchievementUnlocked(achievement.id, achievement.title, achievement.description);
    }
  }, [handleAchievementUnlocked]);

  return {
    // State
    xpNotifications,
    achievementNotifications,
    levelCompletion,
    showWinNotification,
    winMessage,
    showRewardModal,
    currentAchievement,
    
    // Actions
    awardXP,
    handleAchievementUnlocked,
    handleLevelCompletion,
    removeXpNotification,
    removeAchievementNotification,
    checkForLevelUpAchievements,
    setLevelCompletion,
    setShowWinNotification,
    setWinMessage,
    setShowRewardModal,
    setCurrentAchievement
  };
};