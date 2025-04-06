import User from '../models/User.js';
import Artifact from '../models/Artifact.js';

// Experience points constants
const XP_REWARDS = {
  ARTIFACT_PICKUP: 25,
  AREA_DISCOVERY: 50,
  QUEST_COMPLETION: 100,
  DAILY_LOGIN: 10,
  MESSAGE_DISCOVERY: 15
};

/**
 * Award experience points to a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const awardExperience = async (req, res) => {
  try {
    const { userId } = req.user;
    const { amount, reason, artifactId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid experience amount"
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
    
    // Calculate new experience and determine if level up occurred
    const oldLevel = user.level;
    const oldExperience = user.experience;
    
    // Add experience
    user.experience += amount;
    
    // Save changes
    await user.save();
    
    // Check if user leveled up
    const leveledUp = user.level > oldLevel;
    
    // If artifact ID was provided, mark it as collected
    if (artifactId) {
      // Check if artifact exists in user's inventory already
      const hasArtifact = user.inventory.includes(artifactId);
      
      if (!hasArtifact) {
        // Add to inventory
        user.inventory.push(artifactId);
        
        // Update artifact status
        await Artifact.findByIdAndUpdate(artifactId, {
          status: "inventory",
          $push: { viewers: userId } // Track who has viewed this artifact
        });
        
        // Save updated inventory
        await user.save();
      }
    }
    
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
    
    // Check if user already discovered this artifact
    if (!user.gameState.viewedArtifacts.includes(artifactId)) {
      // Add to viewed artifacts
      user.gameState.viewedArtifacts.push(artifactId);
      
      // Award experience if this is the first time viewing
      user.experience += (artifact.exp || XP_REWARDS.ARTIFACT_PICKUP);
      
      // Increment artifact views
      artifact.views += 1;
      
      // Save changes
      await Promise.all([user.save(), artifact.save()]);
      
      // Return success with XP gain
      return res.json({
        success: true,
        message: `Discovered artifact: ${artifact.name}`,
        experienceGained: artifact.exp || XP_REWARDS.ARTIFACT_PICKUP,
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
 * Save user game state
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const saveGameState = async (req, res) => {
  try {
    const { userId } = req.user;
    const { position, gameState, inventory } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Prepare update data
    const updateData = {};
    
    // Update position if provided
    if (position) {
      updateData.lastPosition = position;
    }
    
    // Update game state if provided, using deep merge to preserve existing data
    if (gameState) {
      // Initialize gameState if it doesn't exist
      if (!user.gameState) user.gameState = {};
      
      // Deep merge new state with existing state
      updateData.gameState = {
        ...user.gameState,
        ...gameState,
        // Merge nested objects if they exist
        gameProgress: {
          ...(user.gameState.gameProgress || {}),
          ...(gameState.gameProgress || {})
        }
      };
    }
    
    // Update inventory if provided
    if (inventory) {
      updateData.inventory = inventory;
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );
    
    // Return success
    res.json({
      success: true,
      message: "Game state saved successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        lastPosition: updatedUser.lastPosition,
        experience: updatedUser.experience,
        level: updatedUser.level
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