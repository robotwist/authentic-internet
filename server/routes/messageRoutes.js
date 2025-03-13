import express from "express";
import Message from "../models/Message.js";
import authenticateToken from "../middleware/authMiddleware.js";

const router = express.Router();

// 📌 GET Messages for a User
router.get("/", authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user.userId }).populate("sender", "username");
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { recipient, content, artifactId } = req.body;

    // Check required fields
    if (!recipient || !content) {
      return res.status(400).json({ error: "Recipient and content are required." });
    }
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "Unauthorized: No user ID found." });
    }
    // Create and save message
    const newMessage = new Message({
      sender: req.user.userId,
      recipient,
      content,
      artifactId: artifactId || null,
    });

    const savedMessage = await newMessage.save(); // ✅ Save to DB

    console.log("Message saved successfully:", savedMessage);

    // ✅ Send back proper response
    res.json({ message: "Message sent!", newMessage: savedMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
});

// 📌 DELETE a Message
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found." });

    // Ensure only sender or recipient can delete
    if (message.sender.toString() !== req.user.userId && message.recipient.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Unauthorized to delete this message." });
    }

    await message.remove();
    res.json({ message: "Message deleted successfully." });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message." });
  }
});

export default router;
