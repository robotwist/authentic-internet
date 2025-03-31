import React, { useState } from 'react';
import { TILE_SIZE } from './Constants';
import './UserArtifactManager.css';

const UserArtifactManager = ({ 
  artifact, 
  onUpdate, 
  onDelete, 
  onPlace, 
  currentMapName,
  position 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: artifact.name,
    description: artifact.description,
    messageText: artifact.messageText || ''
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await onUpdate(artifact._id, editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update artifact:', error);
      alert('Failed to update artifact. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this artifact?')) {
      try {
        await onDelete(artifact._id);
      } catch (error) {
        console.error('Failed to delete artifact:', error);
        alert('Failed to delete artifact. Please try again.');
      }
    }
  };

  const handlePlace = () => {
    setIsPlacing(true);
  };

  const handlePlacement = (x, y) => {
    if (isPlacing) {
      onPlace(artifact._id, { x, y, area: currentMapName });
      setIsPlacing(false);
    }
  };

  return (
    <div className="user-artifact-manager">
      {isEditing ? (
        <div className="edit-form">
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Artifact Name"
          />
          <textarea
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            placeholder="Description"
          />
          <textarea
            value={editForm.messageText}
            onChange={(e) => setEditForm({ ...editForm, messageText: e.target.value })}
            placeholder="Message Text (optional)"
          />
          <div className="button-group">
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="artifact-controls">
          <button onClick={handleEdit}>Edit</button>
          <button onClick={handleDelete}>Delete</button>
          <button onClick={handlePlace}>Place in World</button>
        </div>
      )}
      
      {isPlacing && (
        <div className="placement-instructions">
          Click on a walkable tile to place the artifact
        </div>
      )}
    </div>
  );
};

export default UserArtifactManager; 