const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Add Friend
router.post("/:id/add-friend", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const friend = await User.findById(req.body.friendId);
    if (!user || !friend) return res.status(404).json({ message: "User not found" });

    user.friends.push(friend._id);
    await user.save();

    res.json({ message: "Friend added!", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
