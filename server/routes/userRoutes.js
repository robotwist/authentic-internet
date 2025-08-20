import express from "express";
import { addFriend, getUserAccess } from "../controllers/userController.js";
import authenticateToken from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { validate, schemas } from "../middleware/validation.js";

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public/uploads/avatars');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and SVG files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// 📌 Upload Avatar (🔐 Requires Authentication)
router.post("/me/avatar", authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old avatar if it's a custom one (not the default)
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldAvatarPath = path.join(process.cwd(), 'public', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user avatar with new file path
    const avatarPath = '/uploads/avatars/' + req.file.filename;
    user.avatar = avatarPath;
    await user.save();

    res.json({ 
      message: "Avatar uploaded successfully", 
      avatar: avatarPath 
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 📌 Add Friend (🔐 Requires Authentication)
router.post("/:id/add-friend", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { friendId } = req.body;

    if (req.user.userId !== id) {
      return res.status(403).json({ message: "You can only modify your own friend list" });
    }

    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent duplicate friends
    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ message: "Friend already added" });
    }

    user.friends.push(friend._id);
    await user.save();

    res.json({ message: "Friend added successfully!", friends: user.friends });
  } catch (error) {
    console.error("Error adding friend:", error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 Get Full User Profile (🔐 Requires Authentication)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("inventory") // Load Artifacts
      .populate("messages") // Load Messages
      .select("-password"); // Exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      friends: user.friends,
      exp: user.experience,
      level: user.level,
      inventory: user.inventory,
      messages: user.messages,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 📌 Check User Access (🔐 Requires Authentication)
router.get("/me/access", authenticateToken, getUserAccess);

// 📌 Get Character by ID (🔐 Requires Authentication)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 📌 Update Character (🔐 Requires Authentication)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure the user can only update their own character
    if (req.user.userId !== id) {
      return res.status(403).json({ message: "You can only update your own character" });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update allowed fields
    const { avatar, exp, level, inventory, savedQuotes } = req.body;
    
    if (avatar) user.avatar = avatar;
    if (exp !== undefined) user.experience = exp;
    if (level !== undefined) user.level = level;
    if (inventory) user.inventory = inventory;
    if (savedQuotes) user.savedQuotes = savedQuotes;
    
    await user.save();
    
    res.json({
      message: "Character updated successfully",
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        exp: user.experience,
        level: user.level,
        inventory: user.inventory,
        savedQuotes: user.savedQuotes
      }
    });
  } catch (error) {
    console.error("Error updating character:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user's game state
router.get('/game-state', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's full game state from database
    const gameState = await User.findById(userId).select('gameState');
    
    if (!gameState) {
      return res.status(404).json({ message: 'Game state not found' });
    }
    
    res.json(gameState.gameState || {});
  } catch (error) {
    console.error('Error fetching game state:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user's game state
router.put('/game-state', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const gameState = req.body;
    
    // Update user's game state in database
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { $set: { gameState } },
      { new: true }
    ).select('gameState');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser.gameState);
  } catch (error) {
    console.error('Error updating game state:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user's experience points
router.put('/experience', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { experience } = req.body;
    
    if (typeof experience !== 'number') {
      return res.status(400).json({ message: 'Experience must be a number' });
    }
    
    // Update user's experience points in database
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { $set: { experience } },
      { new: true }
    ).select('username email experience level');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add achievement for user
router.post('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { achievement } = req.body;
    
    if (!achievement || !achievement.name || !achievement.description) {
      return res.status(400).json({ message: 'Invalid achievement data' });
    }
    
    // Get user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize achievements array if it doesn't exist
    if (!user.gameState) user.gameState = {};
    if (!user.gameState.achievements) user.gameState.achievements = [];
    
    // Check if achievement already exists
    const existingAchievement = user.gameState.achievements.find(
      a => a.id === achievement.id
    );
    
    if (existingAchievement) {
      return res.json(user.gameState.achievements);
    }
    
    // Add achievement with timestamp
    const newAchievement = {
      ...achievement,
      unlockedAt: new Date().toISOString()
    };
    
    user.gameState.achievements.push(newAchievement);
    
    // Save user
    await user.save();
    
    res.json(user.gameState.achievements);
  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Friend system routes

// Send friend request
router.post("/friends/request", authenticateToken, validate(schemas.friend.request), async (req, res) => {
  try {
    const { targetUserId } = req.body;
    
    if (!targetUserId) {
      return res.status(400).json({ message: "Target user ID is required" });
    }
    
    if (targetUserId === req.user.userId) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }
    
    const user = await User.findById(req.user.userId);
    const targetUser = await User.findById(targetUserId);
    
    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const result = user.sendFriendRequest(targetUserId);
    
    if (result.alreadyFriends) {
      return res.status(400).json({ message: "Already friends" });
    }
    
    if (result.requestAlreadySent) {
      return res.status(400).json({ message: "Friend request already sent" });
    }
    
    if (result.requestAlreadyReceived) {
      return res.status(400).json({ message: "Friend request already received from this user" });
    }
    
    await user.save();
    
    // Add to target user's received requests
    targetUser.friendRequests.received.push({
      userId: req.user.userId,
      receivedAt: new Date(),
      status: 'pending'
    });
    await targetUser.save();
    
    res.json({ 
      message: "Friend request sent successfully",
      targetUser: {
        id: targetUser._id,
        username: targetUser.username,
        avatar: targetUser.avatar
      }
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Accept friend request
router.post("/friends/accept", authenticateToken, validate(schemas.friend.accept), async (req, res) => {
  try {
    const { fromUserId } = req.body;
    
    if (!fromUserId) {
      return res.status(400).json({ message: "From user ID is required" });
    }
    
    const user = await User.findById(req.user.userId);
    const fromUser = await User.findById(fromUserId);
    
    if (!user || !fromUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const result = user.acceptFriendRequest(fromUserId);
    
    if (result.noRequestFound) {
      return res.status(404).json({ message: "No friend request found" });
    }
    
    if (result.requestAlreadyProcessed) {
      return res.status(400).json({ message: "Friend request already processed" });
    }
    
    await user.save();
    
    // Add current user to fromUser's friends list
    if (!fromUser.friends.includes(req.user.userId)) {
      fromUser.friends.push(req.user.userId);
    }
    
    // Update the sent request status
    const sentRequest = fromUser.friendRequests.sent.find(req => 
      req.userId.toString() === req.user.userId
    );
    if (sentRequest) {
      sentRequest.status = 'accepted';
    }
    
    await fromUser.save();
    
    res.json({ 
      message: "Friend request accepted successfully",
      newFriend: {
        id: fromUser._id,
        username: fromUser.username,
        avatar: fromUser.avatar
      }
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Decline friend request
router.post("/friends/decline", authenticateToken, validate(schemas.friend.decline), async (req, res) => {
  try {
    const { fromUserId } = req.body;
    
    if (!fromUserId) {
      return res.status(400).json({ message: "From user ID is required" });
    }
    
    const user = await User.findById(req.user.userId);
    const fromUser = await User.findById(fromUserId);
    
    if (!user || !fromUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const result = user.declineFriendRequest(fromUserId);
    
    if (result.noRequestFound) {
      return res.status(404).json({ message: "No friend request found" });
    }
    
    if (result.requestAlreadyProcessed) {
      return res.status(400).json({ message: "Friend request already processed" });
    }
    
    await user.save();
    
    // Update the sent request status
    const sentRequest = fromUser.friendRequests.sent.find(req => 
      req.userId.toString() === req.user.userId
    );
    if (sentRequest) {
      sentRequest.status = 'declined';
    }
    
    await fromUser.save();
    
    res.json({ message: "Friend request declined successfully" });
  } catch (error) {
    console.error("Error declining friend request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Remove friend
router.delete("/friends/:friendId", authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    
    const user = await User.findById(req.user.userId);
    const friend = await User.findById(friendId);
    
    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const result = user.removeFriend(friendId);
    
    if (result.notFriends) {
      return res.status(400).json({ message: "Not friends" });
    }
    
    await user.save();
    
    // Remove from friend's friends list too
    const friendResult = friend.removeFriend(req.user.userId);
    await friend.save();
    
    res.json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get friend status with another user
router.get("/friends/status/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(req.user.userId);
    const otherUser = await User.findById(userId);
    
    if (!user || !otherUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const status = user.getFriendStatus(userId);
    
    res.json({ 
      status: status.status,
      request: status.request,
      otherUser: {
        id: otherUser._id,
        username: otherUser.username,
        avatar: otherUser.avatar
      }
    });
  } catch (error) {
    console.error("Error getting friend status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get friends list
router.get("/friends", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('friends', 'username avatar level lastActive');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ 
      friends: user.friends,
      friendCount: user.friends.length
    });
  } catch (error) {
    console.error("Error getting friends list:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get friend requests
router.get("/friends/requests", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('friendRequests.received.userId', 'username avatar level')
      .populate('friendRequests.sent.userId', 'username avatar level');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ 
      received: user.friendRequests.received.filter(req => req.status === 'pending'),
      sent: user.friendRequests.sent.filter(req => req.status === 'pending')
    });
  } catch (error) {
    console.error("Error getting friend requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 📌 Update User Skills (🔐 Requires Authentication)
router.put("/skills", authenticateToken, async (req, res) => {
  try {
    const { skills } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update skills
    user.skills = skills;
    await user.save();

    res.json({
      success: true,
      message: 'Skills updated successfully',
      skills: user.skills
    });
  } catch (error) {
    console.error('Error updating skills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update skills'
    });
  }
});

export default router;
