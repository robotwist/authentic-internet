import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  fetchMessage,
  updateMessage,
  deleteMessage,
  updateArtifact,
} from "../api/api";
import "./Inventory.css";

const Inventory = ({ 
  artifacts = [], 
  onClose = () => {}, 
  onUpdateArtifact = () => {}, 
  onGainExperience = () => {}, 
  refreshArtifacts = () => {}, 
  characterPosition = { x: 0, y: 0 } 
}) => {
  const [messageContent, setMessageContent] = useState("");
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [actionMode, setActionMode] = useState(null); // 'message', 'drop', or null
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef(null);

  // Add error boundary
  useEffect(() => {
    const handleError = (error) => {
      console.error("Inventory Error:", error);
      setFormError("An error occurred. Please try again.");
      // Reset state
      setSelectedArtifact(null);
      setActionMode(null);
      setSaveStatus(null);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Handle escape key to close inventory
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    console.log("Message content:", messageContent);
    
    if (!artifactId) {
      console.error("🚨 Error: No artifact selected for message update.");
      setFormError("No artifact selected");
      return;
    }

    setSaveStatus('saving');
    try {
      console.log("Calling updateMessage with:", { artifactId, messageContent });
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
      console.error("🚨 Error updating message:", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      setSaveStatus('error');
      setFormError(error.message || "Failed to save message");
      // Clear error status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
        setFormError("");
      }, 3000);
    }
  };

  const handleDropArtifact = async () => {
    const artifactId = selectedArtifact?.id || selectedArtifact?._id;
    console.log("Dropping artifact:", selectedArtifact);
    console.log("Using artifact ID:", artifactId);
    
    if (!artifactId) {
      console.error("🚨 Error: No artifact selected for drop.");
      return;
    }

    try {
      const updatedArtifact = {
        status: 'dropped',
        location: characterPosition
      };

      // Update the artifact's location to the current character position
      const response = await updateArtifact(artifactId, updatedArtifact);
      
      // Call the parent component's onUpdateArtifact function
      if (onUpdateArtifact) {
        onUpdateArtifact(response.artifact || response);
      }
      
      // Reward the player with experience
      if (onGainExperience) {
        onGainExperience(5);
      }
      
      // Refresh the artifacts list
      if (refreshArtifacts) {
        refreshArtifacts();
      }
      
      setActionMode(null);
      setSelectedArtifact(null);
    } catch (error) {
      console.error("Error dropping artifact:", error);
      setFormError(error.message || "Failed to drop artifact");
      setTimeout(() => setFormError(""), 3000);
    }
  };

  const handleDeleteMessage = async () => {
    const artifactId = selectedArtifact?.id || selectedArtifact?._id;
    if (!artifactId) {
      setFormError("No artifact selected");
      return;
    }
    
    try {
      await deleteMessage(artifactId);
      setMessageContent("");
      setActionMode(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      setFormError(error.message || "Failed to delete message");
      setTimeout(() => setFormError(""), 3000);
    }
  };

  const handleUpdateArtifact = async () => {
    const artifactId = selectedArtifact?.id || selectedArtifact?._id;
    if (!artifactId) {
      setFormError("No artifact selected");
      return;
    }

    setSaveStatus('saving');
    try {
      let updateResponse;
      
      // Check if there's a file attachment to update
      if (attachment) {
        // Create FormData for the file upload
        const formData = new FormData();
        formData.append('attachment', attachment);
        
        // Add the artifact ID to the FormData
        formData.append('id', artifactId);
        
        // Make the update request with FormData
        updateResponse = await updateArtifact(artifactId, formData);
      } else {
        // Just update basic info without a file
        updateResponse = await updateArtifact(artifactId, {
          // You can add other fields to update here if needed
          name: selectedArtifact.name,
          description: selectedArtifact.description
        });
      }
      
      console.log("✅ Artifact updated successfully:", updateResponse);
      setSaveStatus('success');
      
      // Call the parent component's onUpdateArtifact function
      if (onUpdateArtifact) {
        onUpdateArtifact(updateResponse.artifact || updateResponse);
      }
      
      // Wait a brief moment to show success message
      setTimeout(() => {
        setSaveStatus(null);
        setAttachment(null);
        setAttachmentPreview(null);
        setSelectedArtifact(null);
        setActionMode(null);
      }, 1000);
      
    } catch (error) {
      console.error("Error updating artifact:", error);
      setSaveStatus('error');
      setFormError(error.message || "Failed to update artifact");
      // Clear error status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
        setFormError("");
      }, 3000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError("File size should be less than 5MB");
      return;
    }
    
    // Set the file for upload
    setAttachment(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      // For non-images, show file name as preview
      setAttachmentPreview(`File: ${file.name}`);
    }
  };

  return (
    <div className="inventory-overlay">
      <div className="inventory-container">
        <div className="inventory-header">
          <h2>🎒 Inventory</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {formError && <div className="form-error">{formError}</div>}
        
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
                      {artifact.attachment && (
                        <div className="attachment-badge" title="Has attachment">📎</div>
                      )}
                    </div>
                    {(selectedArtifact?.id === artifact.id || selectedArtifact?._id === artifact._id) && !actionMode && (
                      <div className="artifact-actions">
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setActionMode('message');
                        }}>📝 Add/Edit Message</button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setActionMode('update');
                        }}>📎 Add Attachment</button>
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

          {actionMode === 'update' && selectedArtifact && (
            <div className="attachment-editor">
              <div className="editor-header">
                <h3>📎 Update {selectedArtifact.name}</h3>
                <div className="editor-info">
                  <p>Add an attachment to this artifact. Click Save when done.</p>
                  {saveStatus === 'saving' && <p className="save-status saving">Uploading...</p>}
                  {saveStatus === 'success' && <p className="save-status success">✅ Updated successfully!</p>}
                  {saveStatus === 'error' && <p className="save-status error">❌ Error updating</p>}
                </div>
              </div>
              
              <div className="attachment-section">
                {selectedArtifact.attachment && (
                  <div className="current-attachment">
                    <h4>Current Attachment</h4>
                    <p>{selectedArtifact.attachmentOriginalName || "Attachment"}</p>
                  </div>
                )}
                
                <div className="file-upload">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="upload-button"
                    disabled={saveStatus === 'saving'}
                  >
                    📁 Choose File
                  </button>
                  
                  {attachmentPreview && (
                    <div className="attachment-preview">
                      {attachmentPreview.startsWith('data:image') ? (
                        <img src={attachmentPreview} alt="Preview" className="image-preview" />
                      ) : (
                        <p className="file-preview">{attachmentPreview}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="editor-actions">
                <button 
                  onClick={handleUpdateArtifact} 
                  className="save-button"
                  disabled={saveStatus === 'saving' || !attachment}
                >
                  {saveStatus === 'saving' ? '⏳ Uploading...' : '💾 Save Changes'}
                </button>
                <button 
                  onClick={() => {
                    setActionMode(null);
                    setAttachment(null);
                    setAttachmentPreview(null);
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

Inventory.propTypes = {
  artifacts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    location: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number
    })
  })),
  onClose: PropTypes.func,
  onUpdateArtifact: PropTypes.func,
  onGainExperience: PropTypes.func,
  refreshArtifacts: PropTypes.func,
  characterPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  })
};

export default Inventory;
