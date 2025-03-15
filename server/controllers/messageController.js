import Message from "../models/Message.js"; 

// ✅ Send a message
export const sendMessage = async (req, res) => {
  try {
    const { recipient, content, artifactId } = req.body;

    if (!recipient || !content) {
      return res.status(400).json({ error: "Recipient and content are required." });
    }

    const newMessage = new Message({
      sender: req.user.userId,
      recipient,
      content,
      artifact: artifactId || null,
    });

    await newMessage.save();
    res.status(201).json({ success: true, message: "Message sent!", newMessage });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
};

// ✅ Fetch a message by ID
export const fetchMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id).populate("sender recipient artifact");

    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    res.json(message);
  } catch (error) {
    console.error("❌ Error fetching message:", error);
    res.status(500).json({ error: "Failed to fetch message." });
  }
};

// ✅ Fetch all messages for a user
export const fetchMessagesForUser = async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user.userId }).populate("sender artifact");

    res.json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
};

// ✅ Update a message
export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({ error: "You can only edit your own messages." });
    }

    message.content = content;
    await message.save();

    res.json({ success: true, message: "Message updated successfully!", updatedMessage: message });
  } catch (error) {
    console.error("❌ Error updating message:", error);
    res.status(500).json({ error: "Failed to update message." });
  }
};

// ✅ Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({ error: "You can only delete your own messages." });
    }

    await Message.findByIdAndDelete(id);
    res.json({ success: true, message: "Message deleted successfully!" });
  } catch (error) {
    console.error("❌ Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message." });
  }
};
