import User from "../models/User.js";

// ✅ Add a friend (Authenticated Request)
export const addFriend = async (req, res) => {
  try {
    const userId = req.user.userId; // Ensure correct user access
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ message: "Friend ID is required." });
    }

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User or friend not found." });
    }

    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ message: "Already friends!" });
    }

    user.friends.push(friend._id);
    await user.save();

    res.status(200).json({ message: "Friend added successfully!", user });
  } catch (error) {
    console.error("Error adding friend:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Check if the user has at least 1 friend
export const checkUserAccess = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const accessGranted = user.friends.length > 0;
    res.json({ accessGranted });
  } catch (error) {
    console.error("Error checking access:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
