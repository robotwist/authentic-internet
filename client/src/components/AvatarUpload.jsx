import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { updateCharacter } from '../api/api';
import './AvatarUpload.css';

const AvatarUpload = ({ character, onUpdateCharacter }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showPiskelInfo, setShowPiskelInfo] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size should be less than 2MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await convertToBase64(selectedFile);
      
      // Update character with new avatar
      const updatedCharacter = {
        ...character,
        avatar: base64
      };
      
      await updateCharacter(updatedCharacter);
      
      // Update parent component
      if (onUpdateCharacter) {
        onUpdateCharacter(updatedCharacter);
      }
      
      // Reset state
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsUploading(false);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Failed to upload avatar. Please try again.');
      setIsUploading(false);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="avatar-upload-container">
      <h3>NKD Man Chrome Extension</h3>
      <p>Congratulations on completing the final dungeon! Upload your own pixel art avatar to replace NKD Man.</p>
      
      <div className="avatar-preview">
        {previewUrl ? (
          <img src={previewUrl} alt="Avatar preview" />
        ) : (
          <div className="avatar-placeholder">
            <span>Preview</span>
          </div>
        )}
      </div>
      
      <div className="avatar-upload-controls">
        <input
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <label htmlFor="avatar-upload" className="upload-button">
          Select Image
        </label>
        
        <button 
          className="upload-submit-button"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Avatar'}
        </button>
      </div>
      
      {error && <div className="avatar-upload-error">{error}</div>}
      
      <div className="piskel-info">
        <button 
          className="piskel-info-button"
          onClick={() => setShowPiskelInfo(!showPiskelInfo)}
        >
          {showPiskelInfo ? 'Hide Piskel Info' : 'How to Create Pixel Art with Piskel'}
        </button>
        
        {showPiskelInfo && (
          <div className="piskel-instructions">
            <h4>Creating Pixel Art with Piskel</h4>
            <ol>
              <li>Go to <a href="https://www.piskelapp.com/p/create/sprite" target="_blank" rel="noopener noreferrer">Piskel App</a></li>
              <li>Create your pixel art character (32x32 pixels recommended)</li>
              <li>Export as PNG</li>
              <li>Upload the PNG file here</li>
            </ol>
            <p>Your custom avatar will replace NKD Man in the game!</p>
          </div>
        )}
      </div>
      
      <div className="chrome-extension-info">
        <h4>NKD Man Chrome Extension</h4>
        <p>You've unlocked the NKD Man Chrome Extension worth infinite dollars!</p>
        <p>This exclusive reward for completing the final dungeon allows you to create and use your own custom avatars in the game.</p>
        <p className="extension-value">Estimated Value: ∞ dollars</p>
      </div>
    </div>
  );
};

AvatarUpload.propTypes = {
  character: PropTypes.object.isRequired,
  onUpdateCharacter: PropTypes.func.isRequired
};

export default AvatarUpload; 