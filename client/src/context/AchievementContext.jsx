import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { addUserAchievement } from "../api/api";
import AchievementNotification from "../components/AchievementNotification";

// Create context
const AchievementContext = createContext();

// Achievement definitions
export const ACHIEVEMENTS = {
  // Level achievements
  LEVEL_5: {
    id: "achievement_level_5",
    name: "Apprentice Explorer",
    description: "Reach level 5 in your journey",
    type: "level",
  },
  LEVEL_10: {
    id: "achievement_level_10",
    name: "Seasoned Adventurer",
    description: "Reach level 10 in your journey",
    type: "level",
  },
  LEVEL_20: {
    id: "achievement_level_20",
    name: "Master Explorer",
    description: "Reach level 20 in your journey",
    type: "level",
  },

  // Discovery achievements
  FIRST_DISCOVERY: {
    id: "achievement_first_discovery",
    name: "First Discovery",
    description: "Discover your first artifact in the world",
    type: "discovery",
  },
  DISCOVERY_5: {
    id: "achievement_explorer",
    name: "Curious Explorer",
    description: "Discover 5 different artifacts in the world",
    type: "discovery",
  },
  DISCOVERY_15: {
    id: "achievement_master_explorer",
    name: "Master Explorer",
    description: "Discover 15 different artifacts in the world",
    type: "discovery",
  },

  // Creation achievements
  FIRST_ARTIFACT: {
    id: "achievement_first_artifact",
    name: "Digital Artisan",
    description: "Create your first artifact",
    type: "creation",
  },

  // Collection achievements
  ARTIFACTS_5: {
    id: "achievement_artifacts_5",
    name: "Artifact Collector",
    description: "Collect 5 different artifacts",
    type: "collection",
  },
  ARTIFACTS_10: {
    id: "achievement_artifacts_10",
    name: "Treasure Hunter",
    description: "Collect 10 different artifacts",
    type: "collection",
  },
  ARTIFACTS_20: {
    id: "achievement_artifacts_20",
    name: "Museum Curator",
    description: "Collect 20 different artifacts",
    type: "collection",
  },
};

export const AchievementProvider = ({ children }) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Load achievements from localStorage on mount
  useEffect(() => {
    try {
      const savedAchievements = JSON.parse(
        localStorage.getItem("achievements") || "[]",
      );
      setAchievements(savedAchievements);
    } catch (error) {
      console.error("Error loading achievements:", error);
    }
  }, []);

  // Unlock an achievement
  const unlockAchievement = async (achievementKey) => {
    // Get achievement data
    const achievement = ACHIEVEMENTS[achievementKey];
    if (!achievement) {
      console.error(`Unknown achievement key: ${achievementKey}`);
      return null;
    }

    // Check if already unlocked
    if (achievements.some((a) => a.id === achievement.id)) {
      return null; // Already unlocked
    }

    // Create complete achievement object with timestamp
    const newAchievement = {
      ...achievement,
      unlockedAt: new Date().toISOString(),
    };

    // Add to local state
    const updatedAchievements = [...achievements, newAchievement];
    setAchievements(updatedAchievements);

    // Save to localStorage
    localStorage.setItem("achievements", JSON.stringify(updatedAchievements));

    // Show notification
    const notificationId = Date.now().toString();
    setNotifications((prev) => [
      ...prev,
      { id: notificationId, achievement: newAchievement },
    ]);

    // Save to database if user is logged in
    if (user) {
      try {
        await addUserAchievement(newAchievement).catch((err) =>
          console.error("Failed to save achievement to database:", err),
        );
      } catch (error) {
        console.error("Error saving achievement:", error);
      }
    }

    return notificationId;
  };

  // Check for level achievements
  const checkLevelAchievements = (level) => {
    if (level >= 5) unlockAchievement("LEVEL_5");
    if (level >= 10) unlockAchievement("LEVEL_10");
    if (level >= 20) unlockAchievement("LEVEL_20");
  };

  // Check for discovery achievements
  const checkDiscoveryAchievements = (discoveredCount) => {
    if (discoveredCount === 1) unlockAchievement("FIRST_DISCOVERY");
    if (discoveredCount >= 5) unlockAchievement("DISCOVERY_5");
    if (discoveredCount >= 15) unlockAchievement("DISCOVERY_15");
  };

  // Check for artifact collection achievements
  const checkCollectionAchievements = (collectionCount) => {
    if (collectionCount >= 5) unlockAchievement("ARTIFACTS_5");
    if (collectionCount >= 10) unlockAchievement("ARTIFACTS_10");
    if (collectionCount >= 20) unlockAchievement("ARTIFACTS_20");
  };

  // Remove a notification
  const removeNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  // Return the context value
  const value = {
    achievements,
    unlockAchievement,
    checkLevelAchievements,
    checkDiscoveryAchievements,
    checkCollectionAchievements,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}

      {/* Render achievement notifications */}
      <div className="achievement-notification-container">
        {notifications.map((notification) => (
          <AchievementNotification
            key={notification.id}
            achievement={notification.achievement}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </AchievementContext.Provider>
  );
};

// Custom hook to use achievement context
export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error(
      "useAchievements must be used within an AchievementProvider",
    );
  }
  return context;
};

export default AchievementContext;
