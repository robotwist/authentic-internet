import express from "express";
import { addFriend, getUserAccess } from "../controllers/userController.js";
import authenticateToken from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import fs from "fs";

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

export default router;
