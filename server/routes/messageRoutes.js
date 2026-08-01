import express from "express";
import Message from "../models/Message.js";
import Artifact from "../models/Artifact.js";
import User from "../models/User.js";
import authenticateToken from "../middleware/authMiddleware.js";
import { sendMessage, fetchMessage } from "../controllers/messageController.js";

const router = express.Router();

const idsMatch = (a, b) => String(a) === String(b);

// 📌 1️⃣ CREATE A MESSAGE (Tied to an Artifact)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { recipient, content, artifactId } = req.body;
    const senderId = req.user?.userId ?? req.user?.id;

    if (!senderId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!recipient || !content) {
      return res.status(400).json({ error: "Recipient and message content are required." });
    }

    const recipientUser = await User.findById(recipient).select(
      "preferences.privacy.allowMessages friends blockedUsers"
    );
    if (!recipientUser) {
      return res.status(404).json({ error: "Recipient not found." });
    }

    if (recipientUser.blockedUsers?.some((id) => idsMatch(id, senderId))) {
      return res.status(403).json({ error: "You cannot message this user." });
    }

    // Default privacy is friends-only; enforce it so strangers cannot bypass DMs.
    const allowMessages =
      recipientUser.preferences?.privacy?.allowMessages || "friends";

    if (allowMessages === "none") {
      return res.status(403).json({ error: "This user is not accepting messages." });
    }

    if (allowMessages === "friends") {
      const isFriend = recipientUser.friends?.some((id) => idsMatch(id, senderId));
      if (!isFriend) {
        return res.status(403).json({ error: "Only friends can message this user." });
      }
    }

    const newMessage = new Message({
      sender: senderId,
      recipient,
      content,
      ...(artifactId ? { artifactId } : {}),
    });

    await newMessage.save();
    res.status(201).json({ message: "Message sent successfully!", newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
});

// 📌 2️⃣ GET ALL MESSAGES FOR A USER
router.get("/", authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user.userId }).populate("artifact");
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// 📌 3️⃣ UPDATE A MESSAGE
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({ error: "You can only edit your own messages." });
    }

    message.content = content;
    await message.save();

    res.json({ message: "Message updated successfully!", updatedMessage: message });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ error: "Failed to update message." });
  }
});

// 📌 4️⃣ DELETE A MESSAGE
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({ error: "You can only delete your own messages." });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: "Message deleted successfully!" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message." });
  }
});

// 📌 5️⃣ FETCH A MESSAGE ATTACHED TO AN ARTIFACT
router.get("/artifact/:artifactId", authenticateToken, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.artifactId);
    if (!artifact) {
      return res.status(404).json({ error: "Artifact not found." });
    }

    // Messages store `artifactId` (Message schema); Artifact has no `message` path.
    const message = await Message.findOne({ artifactId: req.params.artifactId })
      .sort({ createdAt: -1 })
      .populate("sender", "username")
      .populate("recipient", "username");

    res.json({ message: message || "No message attached to this artifact." });
  } catch (error) {
    console.error("Error fetching artifact message:", error);
    res.status(500).json({ error: "Failed to fetch artifact message." });
  }
});

export default router;
