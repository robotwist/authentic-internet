import React, { useState, useEffect } from "react";
import {
  sendMessage,
  fetchMessages,
  deleteMessage,
  fetchMessage,
  updateMessage,
} from "../api/api";
import "./Inventory.css";

const Inventory = ({ artifacts, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState("");
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  // 🔹 Load messages on mount
  useEffect(() => {
    fetchMessages()
      .then((data) => setMessages(data))
      .catch((error) => console.error("Error loading messages:", error));
  }, []);

  // 🔹 Ensure default artifact selection
  useEffect(() => {
    if (artifacts.length > 0 && !selectedArtifact) {
      const firstArtifact = artifacts.find((art) => art._id) || artifacts[0];
      console.log("✅ Defaulting to first artifact:", firstArtifact); // Debugging
      setSelectedArtifact(firstArtifact);
    }
  }, [artifacts]);

  // 🔹 Fetch message when an artifact is selected
  useEffect(() => {
    if (selectedArtifact?._id) {
      console.log("🔍 Fetching message for artifact:", selectedArtifact);
      fetchMessage(selectedArtifact._id)
        .then((message) => setMessageContent(message?.messageText || ""))
        .catch((error) => console.error("Error fetching message:", error));
    }
  }, [selectedArtifact]);

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      alert("Message cannot be empty!");
      return;
    }

    // 🔹 Ensure valid artifact is selected
    if (!selectedArtifact || !selectedArtifact._id) {
      console.error("🚨 No valid artifact selected! Current artifact:", selectedArtifact);
      alert("No valid artifact selected! Please select an artifact.");
      return;
    }

    const recipient = "robotwist"; // ✅ Replace with actual recipient logic
    const artifactId = selectedArtifact._id;

    console.log("✅ Sending message with artifact:", { recipient, content: messageContent, artifactId });

    try {
      const response = await sendMessage(recipient, messageContent, artifactId);

      console.log("✅ Response from sendMessage:", response);

      if (!response || !response.newMessage) {
        alert("Failed to send message.");
        return;
      }

      setMessages([...messages, response.newMessage]);
      setMessageContent("");
    } catch (error) {
      console.error("🚨 Error sending message:", error);
      alert("An error occurred while sending the message.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await deleteMessage(messageId);
      if (response) {
        setMessages(messages.filter((msg) => msg._id !== messageId));
      }
    } catch (error) {
      console.error("🚨 Error deleting message:", error);
    }
  };

  const handleSaveMessage = async () => {
    if (!selectedArtifact?._id) {
      console.error("🚨 Error: No artifact selected for message update.");
      return;
    }

    try {
      const response = await updateMessage(selectedArtifact._id, messageContent);
      console.log("✅ Message updated successfully:", response);
    } catch (error) {
      console.error("🚨 Error updating message:", error);
    }
  };

  return (
    <div className="inventory-container">
      <h2>Inventory</h2>

      {/* 🔹 Artifact Selection Dropdown */}
      {artifacts.length > 0 ? (
        <select
          onChange={(e) => {
            const artifact = artifacts.find((a) => a._id === e.target.value);
            console.log("🔹 Selected Artifact:", artifact);
            setSelectedArtifact(artifact);
          }}
          value={selectedArtifact?._id || ""}
        >
          <option value="" disabled>
            -- Select an Artifact --
          </option>
          {artifacts.map((artifact) => (
            <option key={artifact._id || `artifact-${artifact.name}`} value={artifact._id}>
              {artifact.name}
            </option>
          ))}
        </select>
      ) : (
        <p>No artifacts found.</p>
      )}

      {/* 🔹 Message Input */}
      <textarea
        value={messageContent}
        onChange={(e) => setMessageContent(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSendMessage}>Send Message</button>
      <button onClick={handleSaveMessage}>Save Message</button>

      {/* 🔹 Messages Display */}
      <h2>Messages</h2>
      {messages.length > 0 ? (
        messages.map((msg) => (
          <div key={msg._id || msg.content}>
            <p>{msg.content}</p>
            <button onClick={() => handleDeleteMessage(msg._id)}>Delete</button>
          </div>
        ))
      ) : (
        <p>No messages yet.</p>
      )}

      <button onClick={onClose}>Close Inventory</button>
    </div>
  );
};

export default Inventory;
