import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./shared/Button";
import "../styles/ArtifactForm.css";

const ArtifactForm = ({
  onSubmit,
  onClose,
  initialValues = {},
  initialData = {},
  isEditing = false,
  currentArea = "overworld",
}) => {
  const { user } = useAuth();
  // Use either initialData or initialValues to support both prop formats
  const initialProps =
    initialData && Object.keys(initialData).length > 0
      ? initialData
      : initialValues;
  const isEditMode =
    isEditing || (initialProps && Object.keys(initialProps).length > 0);

  const [formData, setFormData] = useState({
    // Core fields (required)
    name: initialProps.name || "",
    description: initialProps.description || "",
    type: initialProps.type || "artifact",
    content: initialProps.content || "",

    // Location and visibility
    location: initialProps.location || { x: 0, y: 0, mapName: currentArea },
    area: initialProps.area || currentArea,
    visible: initialProps.visible !== undefined ? initialProps.visible : true,

    // Experience and rewards
    exp: initialProps.exp || 10,

    // Media and attachments
    media: initialProps.media || [],
    attachment: initialProps.attachment || null,

    // Social and discovery
    tags: initialProps.tags || [],
    rating: initialProps.rating || 0,
    reviews: initialProps.reviews || [],
    remixOf: initialProps.remixOf || null,

    // Legacy fields (for backward compatibility)
    messageText: initialProps.messageText || "",
    riddle: initialProps.riddle || "",
    unlockAnswer: initialProps.unlockAnswer || "",
    isExclusive: initialProps.isExclusive || false,
    status: initialProps.status || "dropped",
    image: initialProps.image || "/images/default-artifact.png",
    visibility: initialProps.visibility || "public",
    allowedUsers: initialProps.allowedUsers || [],

    // UI state
    iconPreview: null,
    iconFile: null,
  });

  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(
    initialProps.attachment || null,
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Artifact type options for the unified model
  const ARTIFACT_TYPES = [
    { value: "artifact", label: "General Artifact" },
    { value: "WEAPON", label: "Weapon" },
    { value: "SCROLL", label: "Scroll/Text" },
    { value: "ART", label: "Visual Art" },
    { value: "MUSIC", label: "Music/Audio" },
    { value: "GAME", label: "Game" },
    { value: "PUZZLE", label: "Puzzle" },
    { value: "STORY", label: "Story" },
    { value: "TOOL", label: "Tool" },
    { value: "TREASURE", label: "Treasure" },
    { value: "PORTAL", label: "Portal" },
    { value: "NPC", label: "NPC" },
    { value: "ENVIRONMENT", label: "Environment" },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUploading(true);

    try {
      // Validate the form data
      if (!formData.name.trim()) {
        throw new Error("Name is required");
      }
      if (!formData.description.trim()) {
        throw new Error("Description is required");
      }
      if (!formData.content.trim()) {
        // If content is empty, use description as content to meet backend requirements
        formData.content = formData.description;
      }

      // Prepare the data object with unified model structure
      const submitData = {
        // Core fields
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type || "artifact",
        content: formData.content.trim(),

        // Location and visibility
        location: {
          x: formData.location?.x || 0,
          y: formData.location?.y || 0,
          mapName: formData.area || currentArea,
        },
        area: formData.area || currentArea,
        visible: Boolean(formData.visible),

        // Experience and rewards
        exp: Number(formData.exp) || 10,

        // Media and attachments
        media: formData.media || [],

        // Social and discovery
        tags: formData.tags || [],
        rating: Number(formData.rating) || 0,
        reviews: formData.reviews || [],
        remixOf: formData.remixOf || null,

        // Legacy fields (for backward compatibility)
        messageText: formData.messageText?.trim() || "",
        riddle: formData.riddle?.trim() || "",
        unlockAnswer: formData.unlockAnswer?.trim() || "",
        isExclusive: Boolean(formData.isExclusive),
        status: formData.status || "dropped",
        image: formData.image || "/images/default-artifact.png",
        visibility: formData.visibility || "public",
        allowedUsers: formData.allowedUsers || [],

        // Creator information
        createdBy: user?.id,
        createdAt: isEditMode ? formData.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Check if we're using file upload (either attachment or icon)
      if (attachment || formData.iconFile) {
        // Create a FormData object for file upload
        const formDataObj = new FormData();

        // Add all text fields
        Object.keys(submitData).forEach((key) => {
          if (key === "isExclusive" || key === "visible") {
            // Handle boolean
            formDataObj.append(key, submitData[key] ? "true" : "false");
          } else if (key === "location") {
            // Handle location object
            formDataObj.append(key, JSON.stringify(submitData[key]));
          } else if (
            key === "media" ||
            key === "tags" ||
            key === "reviews" ||
            key === "allowedUsers"
          ) {
            // Handle arrays
            formDataObj.append(key, JSON.stringify(submitData[key]));
          } else if (
            key !== "iconFile" &&
            key !== "iconPreview" &&
            submitData[key] !== null &&
            submitData[key] !== undefined
          ) {
            // Skip the iconFile and iconPreview fields, we'll handle them separately
            formDataObj.append(key, submitData[key]);
          }
        });

        // Add the file attachment if present
        if (attachment) {
          formDataObj.append("attachment", attachment);
        }

        // Add the icon file if present
        if (formData.iconFile) {
          formDataObj.append("artifactIcon", formData.iconFile);
        }

        console.log("Submitting form with file(s)");
        await onSubmit(formDataObj);
      } else {
        // Remove the icon-related fields that don't need to be sent to the server
        delete submitData.iconFile;
        delete submitData.iconPreview;

        console.log("Submitting form data:", submitData);
        await onSubmit(submitData);
      }

      // Reset form if not editing
      if (!isEditMode) {
        setFormData({
          name: "",
          description: "",
          type: "artifact",
          content: "",
          location: { x: 0, y: 0, mapName: currentArea },
          area: currentArea,
          visible: true,
          exp: 10,
          media: [],
          attachment: null,
          tags: [],
          rating: 0,
          reviews: [],
          remixOf: null,
          messageText: "",
          riddle: "",
          unlockAnswer: "",
          isExclusive: false,
          status: "dropped",
          image: "/images/default-artifact.png",
          visibility: "public",
          allowedUsers: [],
          iconPreview: null,
          iconFile: null,
        });
        setAttachment(null);
        setAttachmentPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Reset the icon upload input
        if (document.getElementById("icon-upload")) {
          document.getElementById("icon-upload").value = "";
        }
      }
    } catch (err) {
      console.error("Error submitting artifact:", err);
      setError(err.message || "Failed to save artifact. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAttachment(file);

    // Preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      // For non-images, just show the filename
      setAttachmentPreview(file.name);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="artifact-form-container">
      <h2>{isEditMode ? "Edit Artifact" : "Create New Artifact"}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="artifact-form">
        {/* Core Information */}
        <div className="form-section">
          <h3>Core Information</h3>

          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={50}
              placeholder="Enter artifact name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              {ARTIFACT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder="Brief description of the artifact"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={5}
              maxLength={1000}
              placeholder="Main content of the artifact (text, story, etc.)"
            />
          </div>
        </div>

        {/* Experience and Rewards */}
        <div className="form-section">
          <h3>Experience & Rewards</h3>

          <div className="form-group">
            <label htmlFor="exp">Experience Points</label>
            <input
              type="number"
              id="exp"
              name="exp"
              value={formData.exp}
              onChange={handleChange}
              min="0"
              max="100"
              placeholder="10"
            />
            <small>XP awarded when players interact with this artifact</small>
          </div>
        </div>

        {/* Tags and Discovery */}
        <div className="form-section">
          <h3>Tags & Discovery</h3>

          <div className="form-group tags-section">
            <label>Tags</label>
            <input
              type="text"
              placeholder="Add tags separated by commas"
              value={formData.tags.join(", ")}
              onChange={(e) => {
                const tags = e.target.value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter((tag) => tag);
                setFormData((prev) => ({ ...prev, tags }));
              }}
            />
            <div className="tags-preview">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        tags: prev.tags.filter((_, i) => i !== index),
                      }));
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <small>Tags help other players discover your artifact</small>
          </div>
        </div>

        {/* Legacy Fields (for backward compatibility) */}
        <div className="form-section">
          <h3>Additional Options</h3>

          <div className="form-group">
            <label htmlFor="messageText">Interaction Message</label>
            <textarea
              id="messageText"
              name="messageText"
              value={formData.messageText}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              placeholder="Message displayed when player interacts with the artifact"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="riddle">Riddle (Optional)</label>
              <input
                type="text"
                id="riddle"
                name="riddle"
                value={formData.riddle}
                onChange={handleChange}
                maxLength={100}
                placeholder="Enter a riddle"
              />
            </div>

            <div className="form-group">
              <label htmlFor="unlockAnswer">Answer (Optional)</label>
              <input
                type="text"
                id="unlockAnswer"
                name="unlockAnswer"
                value={formData.unlockAnswer}
                onChange={handleChange}
                maxLength={100}
                placeholder="Answer to the riddle"
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isExclusive"
                checked={formData.isExclusive}
                onChange={handleChange}
              />
              Exclusive (Only visible to you)
            </label>
          </div>

          <div className="form-group visibility-section">
            <label>Visibility Settings</label>
            <div className="visibility-options">
              <label>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === "public"}
                  onChange={handleChange}
                />
                Public (Everyone can see)
              </label>
              <label>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === "private"}
                  onChange={handleChange}
                />
                Private (Only you can see)
              </label>
              <label>
                <input
                  type="radio"
                  name="visibility"
                  value="friends"
                  checked={formData.visibility === "friends"}
                  onChange={handleChange}
                />
                Friends Only
              </label>
            </div>
          </div>
        </div>

        {/* Media and Attachments */}
        <div className="form-section">
          <h3>Media & Attachments</h3>

          <div className="form-group attachment-section">
            <label>Attachment</label>
            <div className="attachment-container">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAttachmentChange}
                style={{ display: "none" }}
              />

              <Button
                type="button"
                onClick={triggerFileInput}
                className="attachment-button"
                disabled={uploading}
              >
                Choose File
              </Button>

              {attachmentPreview && (
                <div className="attachment-preview">
                  {typeof attachmentPreview === "string" &&
                  attachmentPreview.startsWith("data:image") ? (
                    <img
                      src={attachmentPreview}
                      alt="Attachment preview"
                      className="image-preview"
                    />
                  ) : (
                    <div className="file-preview">
                      {typeof attachmentPreview === "string" &&
                      !attachmentPreview.startsWith("data:")
                        ? attachmentPreview
                        : attachment?.name || "Selected file"}
                    </div>
                  )}
                </div>
              )}
            </div>
            <small>Upload an image, audio, video, or document (max 10MB)</small>
          </div>

          <div className="form-group icon-section">
            <label>Custom Icon</label>
            <div className="icon-container">
              <input
                type="file"
                id="icon-upload"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  // Only allow images for icons
                  if (!file.type.startsWith("image/")) {
                    setError("Icons must be image files (JPG, PNG, GIF, SVG)");
                    return;
                  }

                  // Check file size (max 1MB)
                  if (file.size > 1 * 1024 * 1024) {
                    setError("Icon size should be less than 1MB");
                    return;
                  }

                  // Set to state
                  setFormData((prev) => ({
                    ...prev,
                    iconFile: file,
                  }));

                  // Create preview
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setFormData((prev) => ({
                      ...prev,
                      iconPreview: reader.result,
                    }));
                  };
                  reader.readAsDataURL(file);
                }}
                accept="image/*"
                style={{ display: "none" }}
              />

              <div className="icon-preview">
                {formData.iconPreview ? (
                  <img
                    src={formData.iconPreview}
                    alt="Icon preview"
                    className="custom-icon-preview"
                  />
                ) : (
                  <img
                    src={initialProps.image || "/images/default-artifact.png"}
                    alt="Default icon"
                    className="default-icon-preview"
                  />
                )}
              </div>

              <Button
                type="button"
                onClick={() => document.getElementById("icon-upload").click()}
                className="icon-button"
                disabled={uploading}
              >
                Choose Icon
              </Button>
            </div>
            <small>
              Upload a custom icon for your artifact (recommended: 64x64px)
            </small>
            <div className="icon-options">
              <label>Or choose from preset icons:</label>
              <div className="preset-icons">
                {[
                  "/images/default-artifact.png",
                  "/images/artifact-scroll.png",
                  "/images/artifact-gem.png",
                  "/images/artifact-book.png",
                  "/images/artifact-potion.png",
                ].map((iconPath, index) => (
                  <img
                    key={index}
                    src={iconPath}
                    alt={`Preset icon ${index + 1}`}
                    className={`preset-icon ${formData.image === iconPath ? "selected" : ""}`}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        image: iconPath,
                        iconPreview: null,
                        iconFile: null,
                      }));
                      document.getElementById("icon-upload").value = null;
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Button type="submit" className="submit-button" disabled={uploading}>
            {uploading
              ? "Saving..."
              : isEditMode
                ? "Update Artifact"
                : "Create Artifact"}
          </Button>
          <Button type="button" className="cancel-button" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ArtifactForm;
