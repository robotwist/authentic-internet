import React, { useState, useEffect } from "react";
import {
  fetchMessage,
  updateMessage,
  deleteMessage,
} from "../api/api";
import "./Inventory.css";

const Inventory = ({ artifacts, onClose, onUpdateArtifact, onGainExperience, refreshArtifacts, characterPosition }) => {
  const [messageContent, setMessageContent] = useState("");
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [actionMode, setActionMode] = useState(null); // 'message', 'drop', or null
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'

  useEffect(() => {
    const artifactId = selectedArtifact?.id || selectedArtifact?._id;
    console.log("Selected artifact changed:", selectedArtifact);
    console.log("Using artifact ID for message fetch:", artifactId);
    
    if (artifactId) {
      fetchMessage(artifactId)
        .then((message) => {
          console.log("Fetched message:", message);
          setMessageContent(message?.messageText || "");
        })
        .catch((error) => console.error("Error fetching message:", error));
    }
  }, [selectedArtifact]);

  const handleSaveMessage = async () => {
    const artifactId = selectedArtifact?.id || selectedArtifact?._id;
    console.log("Saving message for artifact:", selectedArtifact);
    console.log("Using artifact ID:", artifactId);
    
    if (!artifactId) {
      console.error("🚨 Error: No artifact selected for message update.");
      return;
    }

    setSaveStatus('saving');
    try {
      const response = await updateMessage(artifactId, messageContent);
      console.log("✅ Message updated successfully:", response);
      setSaveStatus('success');
      
      // Wait a brief moment to show success message
      setTimeout(() => {
        setSaveStatus(null);
        setMessageContent("");
        setSelectedArtifact(null);
        setActionMode(null);
      }, 1000);
      
    } catch (error) {
      console.error("Error updating message:", error);
      setSaveStatus('error');
      // Clear error status after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleDropArtifact = async () => {
    const artifactId = selectedArtifact?.id || selectedArtifact?._id;
    console.log("Dropping artifact:", selectedArtifact);
    console.log("Using artifact ID:", artifactId);
    
    if (!artifactId) {
      console.error("🚨 Error: No artifact selected to drop.");
      return;
    }

    try {
      // First save the message if there is one
      if (messageContent) {
        await updateMessage(artifactId, messageContent);
      }
      
      // Calculate drop position from character position
      const dropLocation = {
        x: Math.floor(characterPosition.x / 64),
        y: Math.floor(characterPosition.y / 64)
      };

      // Update the artifact's status and return it to the world
      if (onUpdateArtifact) {
        await onUpdateArtifact(artifactId, {
          status: 'dropped',
          location: dropLocation,
          messageText: messageContent
        });
      }
      
      setActionMode(null);
      setSelectedArtifact(null);
      setMessageContent("");
      refreshArtifacts();
    } catch (error) {
      console.error("Error dropping artifact:", error);
    }
  };

  const handleDeleteMessage = async () => {
    const artifactId = selectedArtifact?.id || selectedArtifact?._id;
    if (!artifactId) return;
    
    try {
      await deleteMessage(artifactId);
      setMessageContent("");
      setActionMode(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <div className="inventory-overlay">
      <div className="inventory-container">
        <div className="inventory-header">
          <h2>🎒 Inventory</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="inventory-content">
          <div className="artifact-list">
            <h3>Your Artifacts</h3>
            {artifacts.length === 0 ? (
              <p className="empty-message">No artifacts in your inventory yet. Explore the world to find some!</p>
            ) : (
              <ul>
                {artifacts.map((artifact) => (
                  <li key={artifact.id || artifact._id} 
                      className={`artifact-item ${
                        (selectedArtifact?.id === artifact.id || selectedArtifact?._id === artifact._id) ? 'selected' : ''
                      }`}
                      onClick={() => {
                        console.log("Selected artifact:", artifact);
                        setSelectedArtifact(artifact);
                      }}>
                    <div className="artifact-info">
                      <h4>{artifact.name}</h4>
                      <p>{artifact.description}</p>
                    </div>
                    {(selectedArtifact?.id === artifact.id || selectedArtifact?._id === artifact._id) && !actionMode && (
                      <div className="artifact-actions">
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setActionMode('message');
                        }}>📝 Add/Edit Message</button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setActionMode('drop');
                        }}>🗺️ Drop Here</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {actionMode === 'message' && selectedArtifact && (
            <div className="message-editor">
              <div className="editor-header">
                <h3>📝 Edit Message for {selectedArtifact.name}</h3>
                <div className="editor-info">
                  <p>Write a message or note about this artifact. Click Save when done.</p>
                  {saveStatus === 'saving' && <p className="save-status saving">Saving...</p>}
                  {saveStatus === 'success' && <p className="save-status success">✅ Saved successfully!</p>}
                  {saveStatus === 'error' && <p className="save-status error">❌ Error saving message</p>}
                </div>
              </div>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Write a message or note about this artifact..."
                disabled={saveStatus === 'saving'}
              />
              <div className="editor-actions">
                <button 
                  onClick={handleSaveMessage} 
                  className="save-button"
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? '💾 Saving...' : '💾 Save Message'}
                </button>
                <button 
                  onClick={handleDeleteMessage} 
                  className="delete-button"
                  disabled={saveStatus === 'saving'}
                >
                  🗑️ Delete Message
                </button>
                <button 
                  onClick={() => {
                    setActionMode(null);
                    setMessageContent("");
                    setSaveStatus(null);
                  }} 
                  className="cancel-button"
                  disabled={saveStatus === 'saving'}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}

          {actionMode === 'drop' && selectedArtifact && (
            <div className="drop-confirmation">
              <h3>🗺️ Drop {selectedArtifact.name}</h3>
              <p>Are you sure you want to drop this artifact at your current location?</p>
              <div className="button-group">
                <button onClick={handleDropArtifact} className="confirm-button">✅ Confirm Drop</button>
                <button onClick={() => setActionMode(null)} className="cancel-button">❌ Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
