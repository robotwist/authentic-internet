import React, { useState } from "react";
import PropTypes from "prop-types";
import { updateCharacter } from "../api/api";
import "./AvatarUpload.css";

const AvatarUpload = ({ character, onUpdateCharacter }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showPiskelInfo, setShowPiskelInfo] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.match("image.*")) {
      setError("Please select an image file");
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("File size should be less than 2MB");
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
      setError("Please select a file first");
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
        avatar: base64,
      };

      await updateCharacter(updatedCharacter);

      // Update parent component
      if (onUpdateCharacter) {
        onUpdateCharacter(updatedCharacter);
      }

      // Set success message
      setSuccess("Your custom avatar has been uploaded successfully!");

      // Reset state
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsUploading(false);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setError("Failed to upload avatar. Please try again.");
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
      <h3>Custom Pixel Sprite Avatar</h3>
      <p>Upload your own pixel art avatar to personalize your profile!</p>

      <div className="avatar-preview-section">
        <div className="current-avatar">
          <h4>Current Avatar</h4>
          <img
            src={character?.avatar || "/assets/default-avatar.svg"}
            alt="Current avatar"
            className="current-avatar-image"
          />
        </div>

        <div className="new-avatar">
          <h4>Preview New Avatar</h4>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar preview"
              className="new-avatar-image"
            />
          ) : (
            <div className="avatar-placeholder">
              <span>Preview</span>
            </div>
          )}
        </div>
      </div>

      {success && (
        <div className="avatar-upload-success">
          {success}
          <button onClick={() => setSuccess(null)} className="dismiss-button">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="avatar-upload-error">
          {error}
          <button onClick={() => setError(null)} className="dismiss-button">
            ✕
          </button>
        </div>
      )}

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
          {isUploading ? "Uploading..." : "Upload Avatar"}
        </button>
      </div>

      <div className="piskel-info">
        <button
          className="piskel-info-button"
          onClick={() => setShowPiskelInfo(!showPiskelInfo)}
        >
          {showPiskelInfo
            ? "Hide Piskel Tutorial"
            : "How to Create Pixel Art with Piskel"}
        </button>

        {showPiskelInfo && (
          <div className="piskel-instructions">
            <h4>Creating Pixel Art with Piskel</h4>
            <ol>
              <li>
                Go to{" "}
                <a
                  href="https://www.piskelapp.com/p/create/sprite"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Piskel App
                </a>{" "}
                (free, no account required)
              </li>
              <li>Start with a blank canvas (32x32 pixels recommended)</li>
              <li>Use the drawing tools to create your character:</li>
              <ul>
                <li>Pen tool (P) for individual pixels</li>
                <li>Paint bucket (B) to fill areas</li>
                <li>Eraser (E) to remove pixels</li>
                <li>Color picker (O) to select colors from your artwork</li>
              </ul>
              <li>When finished, click "Export" in the top-right</li>
              <li>Select "PNG" and download your image</li>
              <li>Upload the PNG file here as your avatar</li>
            </ol>

            <div className="piskel-tips">
              <h5>Tips for Great Pixel Art:</h5>
              <ul>
                <li>
                  Start with a simple design - pixel art works best with
                  minimalism
                </li>
                <li>
                  Limit your color palette to 4-8 colors for a classic pixel art
                  look
                </li>
                <li>Use outlines to define your character's shape</li>
                <li>
                  Make your avatar face forward or at a 3/4 angle for best
                  results
                </li>
                <li>
                  Test your avatar at small sizes to ensure it's recognizable
                </li>
              </ul>
            </div>

            <div className="piskel-examples">
              <h5>Example Pixel Avatars:</h5>
              <div className="example-gallery">
                <img
                  src="/assets/pixel-example-1.png"
                  alt="Pixel art example 1"
                />
                <img
                  src="/assets/pixel-example-2.png"
                  alt="Pixel art example 2"
                />
                <img
                  src="/assets/pixel-example-3.png"
                  alt="Pixel art example 3"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AvatarUpload.propTypes = {
  character: PropTypes.object.isRequired,
  onUpdateCharacter: PropTypes.func.isRequired,
};

export default AvatarUpload;
