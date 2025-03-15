import React, { useState, useEffect } from "react";
import {
  sendMessage,
  fetchMessages,
  deleteMessage,
  fetchMessage,
  updateMessage,
} from "../api/api";
import "./Inventory.css";

const Inventory = ({ artifacts, onClose, onUpdateArtifact, onGainExperience, refreshArtifacts }) => {
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState("");
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  useEffect(() => {
    fetchMessages()
      .then((data) => setMessages(data))
      .catch((error) => console.error("Error loading messages:", error));
  }, []);

  useEffect(() => {
    if (selectedArtifact?._id) {
      fetchMessage(selectedArtifact._id)
        .then((message) => setMessageContent(message?.messageText || ""))
        .catch((error) => console.error("Error fetching message:", error));
    }
  }, [selectedArtifact]);

  const handleSaveMessage = async () => {
    if (!selectedArtifact?._id) {
      console.error("🚨 Error: No artifact selected for message update.");
      return;
    }

    try {
      const response = await updateMessage(selectedArtifact._id, messageContent);
      console.log("✅ Message updated successfully:", response);
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const handleSendMessage = async () => {
    try {
      await sendMessage(selectedArtifact._id, messageContent);
      setMessageContent("");
      refreshArtifacts(); // ✅ Refresh artifacts after sending a message
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      setMessages(messages.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <div className="inventory-overlay">
      <div className="inventory-container">
        <h2>Inventory</h2>
        <button onClick={onClose}>Close</button>
        <ul className="artifact-list">
          {artifacts.map((artifact) => (
            <li key={artifact._id} className="artifact-item">
              <h3>{artifact.name}</h3>
              <p>{artifact.description}</p>
              <button onClick={() => setSelectedArtifact(artifact)}>Select</button>
            </li>
          ))}
        </ul>
        {selectedArtifact && (
          <div className="message-container">
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Enter your message"
            />
            <button onClick={handleSendMessage}>Send Message</button>
            <button onClick={handleSaveMessage}>Save Message</button>
            <button onClick={() => handleDeleteMessage(selectedArtifact._id)}>Delete Message</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
