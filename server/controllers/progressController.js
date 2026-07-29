import User from '../models/User.js';
import Artifact from '../models/Artifact.js';

// Experience points constants — server-authoritative award amounts
const XP_REWARDS = {
  ARTIFACT_PICKUP: 25,
  AREA_DISCOVERY: 50,
  QUEST_COMPLETION: 100,
  DAILY_LOGIN: 10,
  MESSAGE_DISCOVERY: 15
};

const ALLOWED_XP_REASONS = new Set(Object.keys(XP_REWARDS));

/**
 * Award experience points to a user.
 * Amounts are server-defined by reason; clients cannot forge arbitrary XP.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const awardExperience = async (req, res) => {
  try {
    const { userId } = req.user;
    const { reason } = req.body;

    if (!reason || !ALLOWED_XP_REASONS.has(reason)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing experience reason"
      });
    }

    const amount = XP_REWARDS[reason];

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Calculate new experience and determine if level up occurred
    const oldLevel = user.level;
    const oldExperience = user.experience;

    // Add experience (level recalculated by User pre-save hook)
    user.experience += amount;

    // Save changes
    await user.save();

    // Check if user leveled up
    const leveledUp = user.level > oldLevel;

    // Return updated user data
    res.json({
      success: true,
      oldExperience,
      newExperience: user.experience,
      oldLevel,
      newLevel: user.level,
      leveledUp,
      message: leveledUp
        ? `Congratulations! You are now level ${user.level}`
        : `You gained ${amount} experience points`,
      reason
    });
  } catch (error) {
    console.error("Error awarding experience:", error);
    res.status(500).json({
      success: false,
      message: "Failed to award experience",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Track artifact discovery
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const discoverArtifact = async (req, res) => {
  try {
    const { userId } = req.user;
    const { artifactId } = req.params;

    // Find user and artifact
    const [user, artifact] = await Promise.all([
      User.findById(userId),
      Artifact.findById(artifactId)
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!artifact) {
      return res.status(404).json({
        success: false,
        message: "Artifact not found"
      });
    }

    if (!user.gameState) {
      user.gameState = { viewedArtifacts: [] };
    }
    if (!Array.isArray(user.gameState.viewedArtifacts)) {
      user.gameState.viewedArtifacts = [];
    }

    // Check if user already discovered this artifact
    if (!user.gameState.viewedArtifacts.includes(artifactId)) {
      // Add to viewed artifacts
      user.gameState.viewedArtifacts.push(artifactId);

      // Award experience if this is the first time viewing
      const xpGain = Math.min(
        Math.max(0, Number(artifact.exp) || XP_REWARDS.ARTIFACT_PICKUP),
        XP_REWARDS.ARTIFACT_PICKUP
      );
      user.experience += xpGain;

      // Increment artifact views
      artifact.views += 1;

      // Save changes
      await Promise.all([user.save(), artifact.save()]);

      // Return success with XP gain
      return res.json({
        success: true,
        message: `Discovered artifact: ${artifact.name}`,
        experienceGained: xpGain,
        artifact
      });
    }

    // User already discovered this artifact
    return res.json({
      success: true,
      message: `You have already discovered: ${artifact.name}`,
      experienceGained: 0,
      artifact
    });
  } catch (error) {
    console.error("Error discovering artifact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process artifact discovery",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Save user game state.
 * Rejects client-authoritative progression fields (XP, level, inventory)
 * that would allow forging progress or injecting arbitrary artifacts.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const saveGameState = async (req, res) => {
  try {
    const { userId } = req.user;
    const gameStateData = req.body;

    // Validate request body
    if (!gameStateData || typeof gameStateData !== 'object') {
      return res.status(400).json({
        success: false,
        message: "Invalid game state data"
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prepare update data with non-progression state only
    const updateData = {
      lastSaved: new Date(),
      lastActive: new Date()
    };

    // Handle character position
    if (gameStateData.characterPosition) {
      updateData.lastPosition = gameStateData.characterPosition;
    }

    // Handle current map index
    if (typeof gameStateData.currentMapIndex === 'number') {
      updateData.currentMapIndex = gameStateData.currentMapIndex;
    }

    // Explicitly ignore client-provided experience, level, inventory,
    // userArtifacts, and modifiedArtifacts — those are server-authoritative.

    // Handle achievements (append-only merge to avoid wiping server state)
    if (Array.isArray(gameStateData.achievements)) {
      const existing = Array.isArray(user.achievements) ? user.achievements : [];
      const merged = [...existing];
      for (const achievement of gameStateData.achievements) {
        const key = achievement?.id || achievement?.name || JSON.stringify(achievement);
        const already = merged.some(
          (a) => (a?.id || a?.name || JSON.stringify(a)) === key
        );
        if (!already) merged.push(achievement);
      }
      updateData.achievements = merged;
    }

    // Handle quests (replace only when provided — quest progress is per-user)
    if (Array.isArray(gameStateData.quests)) {
      updateData.quests = gameStateData.quests;
    }

    // Handle game state object (for backward compatibility)
    if (gameStateData.gameState && typeof gameStateData.gameState === 'object') {
      if (!user.gameState) user.gameState = {};

      const incoming = { ...gameStateData.gameState };
      // Strip progression fields that must not be client-set via this path
      delete incoming.experience;
      delete incoming.level;
      delete incoming.inventory;
      delete incoming.exp;

      updateData.gameState = {
        ...user.gameState,
        ...incoming,
        gameProgress: {
          ...(user.gameState?.gameProgress || {}),
          ...(incoming.gameProgress || {})
        }
      };

      // Preserve viewedArtifacts monotonically (union)
      const existingViewed = user.gameState?.viewedArtifacts || [];
      const incomingViewed = Array.isArray(incoming.viewedArtifacts)
        ? incoming.viewedArtifacts
        : [];
      updateData.gameState.viewedArtifacts = [
        ...new Set([...existingViewed, ...incomingViewed].map(String))
      ];
    }

    // Update user with comprehensive data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Validate the update was successful
    if (!updatedUser) {
      throw new Error('Failed to update user data');
    }

    // Return success with comprehensive response
    res.json({
      success: true,
      message: "Game state saved successfully",
      timestamp: new Date().toISOString(),
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        level: updatedUser.level,
        experience: updatedUser.experience,
        lastPosition: updatedUser.lastPosition,
        currentMapIndex: updatedUser.currentMapIndex,
        lastSaved: updatedUser.lastSaved,
        lastActive: updatedUser.lastActive
      }
    });
  } catch (error) {
    console.error("Error saving game state:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save game state",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user progression details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserProgress = async (req, res) => {
  try {
    const { userId } = req.user;

    // Find user with populated inventory
    const user = await User.findById(userId)
      .populate('inventory')
      .select('experience level lastPosition gameState inventory achievements');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Calculate progress to next level
    const expToNextLevel = (user.level * 100);
    const currentLevelExp = ((user.level - 1) * 100);
    const expInCurrentLevel = user.experience - currentLevelExp;
    const progressPercentage = Math.floor((expInCurrentLevel / expToNextLevel) * 100);

    // Return user progress data
    res.json({
      success: true,
      progress: {
        level: user.level,
        experience: user.experience,
        nextLevelAt: currentLevelExp + expToNextLevel,
        expToNextLevel: expToNextLevel - expInCurrentLevel,
        progressPercentage,
        lastPosition: user.lastPosition,
        inventory: user.inventory,
        achievements: user.achievements,
        gameState: user.gameState
      }
    });
  } catch (error) {
    console.error("Error getting user progress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user progress",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { XP_REWARDS };
