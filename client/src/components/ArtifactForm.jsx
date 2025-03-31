import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './shared/Button';
import '../styles/ArtifactForm.css';

const ArtifactForm = ({ onSubmit, onClose, initialValues = {}, initialData = {}, isEditing = false, currentArea = 'overworld' }) => {
  const { user } = useAuth();
  // Use either initialData or initialValues to support both prop formats
  const initialProps = initialData && Object.keys(initialData).length > 0 ? initialData : initialValues;
  const isEditMode = isEditing || (initialProps && Object.keys(initialProps).length > 0);
  
  const [formData, setFormData] = useState({
    name: initialProps.name || '',
    description: initialProps.description || '',
    content: initialProps.content || '',
    messageText: initialProps.messageText || '',
    riddle: initialProps.riddle || '',
    unlockAnswer: initialProps.unlockAnswer || '',
    area: currentArea,
    isExclusive: initialProps.isExclusive || false,
    exp: initialProps.exp || 10,
    visible: initialProps.visible !== undefined ? initialProps.visible : true,
    status: initialProps.status || 'dropped',
    type: initialProps.type || 'artifact',
    image: initialProps.image || '/images/default-artifact.png',
    iconPreview: null,
    iconFile: null,
    visibility: initialProps.visibility || 'public',
    allowedUsers: initialProps.allowedUsers || [],
    tags: initialProps.tags || []
  });
  
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(initialProps.attachment || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);
    
    try {
      // Validate the form data
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.content.trim()) {
        // If content is empty, use description as content to meet backend requirements
        formData.content = formData.description;
      }
      
      // Prepare the data object with consistent formatting
      const submitData = {
        ...formData,
        // Ensure strings are trimmed
        name: formData.name.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        messageText: formData.messageText?.trim() || '',
        riddle: formData.riddle?.trim() || '',
        unlockAnswer: formData.unlockAnswer?.trim() || '',
        // Ensure boolean values
        isExclusive: Boolean(formData.isExclusive),
        // Ensure numeric values
        exp: Number(formData.exp) || 10,
        // Ensure area is set
        area: formData.area || currentArea,
        // Ensure status is set
        status: formData.status || 'dropped',
        // Ensure type is set
        type: formData.type || 'artifact',
        // Ensure image is set
        image: formData.image || '/images/default-artifact.png'
      };
      
      // Check if we're using file upload (either attachment or icon)
      if (attachment || formData.iconFile) {
        // Create a FormData object for file upload
        const formDataObj = new FormData();
        
        // Add all text fields
        Object.keys(submitData).forEach(key => {
          if (key === 'isExclusive') {
            // Handle boolean
            formDataObj.append(key, submitData[key] ? 'true' : 'false');
          } else if (key !== 'iconFile' && key !== 'iconPreview' && submitData[key] !== null && submitData[key] !== undefined) {
            // Skip the iconFile and iconPreview fields, we'll handle them separately
            formDataObj.append(key, submitData[key]);
          }
        });
        
        // Add the file attachment if present
        if (attachment) {
          formDataObj.append('attachment', attachment);
        }
        
        // Add the icon file if present
        if (formData.iconFile) {
          formDataObj.append('artifactIcon', formData.iconFile);
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
          name: '',
          description: '',
          content: '',
          messageText: '',
          riddle: '',
          unlockAnswer: '',
          area: currentArea,
          isExclusive: false,
          exp: 10,
          visible: true,
          status: 'dropped',
          type: 'artifact',
          image: '/images/default-artifact.png',
          iconPreview: null,
          iconFile: null,
          visibility: 'public',
          allowedUsers: [],
          tags: []
        });
        setAttachment(null);
        setAttachmentPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Reset the icon upload input
        if (document.getElementById('icon-upload')) {
          document.getElementById('icon-upload').value = '';
        }
      }
    } catch (err) {
      console.error('Error submitting artifact:', err);
      setError(err.message || 'Failed to save artifact. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAttachment(file);
    
    // Preview for images
    if (file.type.startsWith('image/')) {
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
      <h2>{isEditMode ? 'Edit Artifact' : 'Create New Artifact'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="artifact-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            maxLength={50}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            maxLength={200}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows={5}
            maxLength={1000}
            placeholder="If left empty, description will be used as content"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="messageText">Message (optional)</label>
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
                checked={formData.visibility === 'public'}
                onChange={handleChange}
              />
              Public (Everyone can see)
            </label>
            <label>
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={formData.visibility === 'private'}
                onChange={handleChange}
              />
              Private (Only you can see)
            </label>
            <label>
              <input
                type="radio"
                name="visibility"
                value="friends"
                checked={formData.visibility === 'friends'}
                onChange={handleChange}
              />
              Friends Only
            </label>
          </div>
        </div>
        
        <div className="form-group tags-section">
          <label>Tags (Optional)</label>
          <input
            type="text"
            placeholder="Add tags separated by commas"
            value={formData.tags.join(', ')}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
              setFormData(prev => ({ ...prev, tags }));
            }}
          />
          <div className="tags-preview">
            {formData.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      tags: prev.tags.filter((_, i) => i !== index)
                    }));
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div className="form-group attachment-section">
          <label>Attachment (Optional)</label>
          <div className="attachment-container">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleAttachmentChange} 
              style={{ display: 'none' }}
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
                {typeof attachmentPreview === 'string' && attachmentPreview.startsWith('data:image') ? (
                  <img src={attachmentPreview} alt="Attachment preview" className="image-preview" />
                ) : (
                  <div className="file-preview">
                    {typeof attachmentPreview === 'string' && !attachmentPreview.startsWith('data:') 
                      ? attachmentPreview 
                      : attachment?.name || 'Selected file'}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="attachment-help">Upload an image, audio, video, or document (max 10MB)</p>
        </div>
        
        <div className="form-group icon-section">
          <label>Custom Icon (Optional)</label>
          <div className="icon-container">
            <input 
              type="file" 
              id="icon-upload"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                // Only allow images for icons
                if (!file.type.startsWith('image/')) {
                  setError('Icons must be image files (JPG, PNG, GIF, SVG)');
                  return;
                }
                
                // Check file size (max 1MB)
                if (file.size > 1 * 1024 * 1024) {
                  setError('Icon size should be less than 1MB');
                  return;
                }
                
                // Create FormData for icon upload
                const iconFormData = new FormData();
                iconFormData.append('artifactIcon', file);
                
                // Set to state
                setFormData(prev => ({
                  ...prev,
                  iconFile: file
                }));
                
                // Create preview
                const reader = new FileReader();
                reader.onloadend = () => {
                  setFormData(prev => ({
                    ...prev,
                    iconPreview: reader.result
                  }));
                };
                reader.readAsDataURL(file);
              }}
              accept="image/*"
              style={{ display: 'none' }}
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
              onClick={() => document.getElementById('icon-upload').click()} 
              className="icon-button"
              disabled={uploading}
            >
              Choose Icon
            </Button>
          </div>
          <p className="icon-help">Upload a custom icon for your artifact (recommended: 64x64px)</p>
          <div className="icon-options">
            <label>Or choose from preset icons:</label>
            <div className="preset-icons">
              {["/images/default-artifact.png", "/images/artifact-scroll.png", "/images/artifact-gem.png", "/images/artifact-book.png", "/images/artifact-potion.png"].map((iconPath, index) => (
                <img 
                  key={index}
                  src={iconPath}
                  alt={`Preset icon ${index+1}`}
                  className={`preset-icon ${formData.image === iconPath ? 'selected' : ''}`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      image: iconPath,
                      iconPreview: null,
                      iconFile: null
                    }));
                    document.getElementById('icon-upload').value = null;
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <Button 
            type="submit" 
            className="submit-button"
            disabled={uploading}
          >
            {uploading ? 'Saving...' : isEditMode ? 'Update Artifact' : 'Create Artifact'}
          </Button>
          <Button 
            type="button" 
            className="cancel-button"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ArtifactForm; 