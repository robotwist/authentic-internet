import express from "express";
import { addFriend, getUserAccess } from "../controllers/userController.js";
import authenticateToken from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// 📌 Add Friend (🔐 Requires Authentication)
router.post("/:id/add-friend", authenticateToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.id) {
      return res.status(403).json({ message: "You can only modify your own friend list" });
    }

    const user = await User.findById(req.params.id);
    const friend = await User.findById(req.body.friendId);

    if (!user || !friend) return res.status(404).json({ message: "User not found" });

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
    res.status(500).json({ message: "Server error", error });
  }
});

// 📌 Check User Access (🔐 Requires Authentication)
router.get("/me/access", authenticateToken, getUserAccess);

export default router;
