import Message from "../models/Message.js"; 

export const sendMessage = async (req, res) => {
    try {
        const { recipient, content, artifactId } = req.body;

        if (!recipient || !content) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const newMessage = new Message({
            recipient,
            content,
            artifactId: artifactId || null
        });

        await newMessage.save();
        res.status(201).json({ success: true, message: "Message sent!", newMessage });
    } catch (error) {
        console.error("❌ Error sending message:", error);
        res.status(500).json({ error: "Failed to send message." });
    }
};

export const fetchMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findById(id);
        if (!message) return res.status(404).json({ error: "Message not found" });

        res.json(message);
    } catch (error) {
        console.error("❌ Error fetching message:", error);
        res.status(500).json({ error: "Failed to fetch message." });
    }
};
