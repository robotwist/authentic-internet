import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './shared/Button';
import '../styles/ArtifactForm.css';

// Helper function to generate random coordinates
const generateRandomCoordinates = (area) => {
  // Define bounds based on area
  let bounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
  
  switch (area) {
    case 'library':
      bounds = { minX: 10, maxX: 50, minY: 10, maxY: 50 };
      break;
    case 'garden':
      bounds = { minX: 60, maxX: 100, minY: 10, maxY: 50 };
      break;
    case 'tavern':
      bounds = { minX: 10, maxX: 50, minY: 60, maxY: 100 };
      break;
    case 'workshop':
      bounds = { minX: 60, maxX: 100, minY: 60, maxY: 100 };
      break;
    case 'dungeon':
      bounds = { minX: 30, maxX: 70, minY: 30, maxY: 70 };
      break;
    default: // Overworld
      bounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
  }
  
  // Generate random coordinates within bounds
  const x = Math.floor(Math.random() * (bounds.maxX - bounds.minX + 1)) + bounds.minX;
  const y = Math.floor(Math.random() * (bounds.maxY - bounds.minY + 1)) + bounds.minY;
  
  return { x, y };
};

const ArtifactForm = ({ onSubmit, onClose, initialValues = {}, initialData = {}, isEditing = false }) => {
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
    area: initialProps.area || 'Overworld',
    isExclusive: initialProps.isExclusive || false,
    location: initialProps.location || generateRandomCoordinates('Overworld'),
    exp: initialProps.exp || 10,
    visible: initialProps.visible !== undefined ? initialProps.visible : true,
    status: initialProps.status || 'dropped',
    type: initialProps.type || 'artifact'
  });
  
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(initialProps.attachment || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [useRandomLocation, setUseRandomLocation] = useState(!initialProps.location);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'area' && useRandomLocation) {
      // Update location with new random coordinates when area changes
      const newCoords = generateRandomCoordinates(value);
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
        location: newCoords
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: Number(value)
      }
    }));
  };

  const toggleRandomLocation = () => {
    const newUseRandom = !useRandomLocation;
    setUseRandomLocation(newUseRandom);
    
    if (newUseRandom) {
      // Generate new random coordinates
      const newCoords = generateRandomCoordinates(formData.area);
      setFormData(prev => ({
        ...prev,
        location: newCoords
      }));
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
      
      // Ensure location is properly formatted
      if (!formData.location || typeof formData.location.x !== 'number' || typeof formData.location.y !== 'number') {
        throw new Error('Valid location coordinates are required');
      }
      
      // Check if we're using file upload
      if (attachment) {
        // Create a FormData object for file upload
        const formDataObj = new FormData();
        
        // Add all text fields
        Object.keys(formData).forEach(key => {
          if (key === 'location') {
            // Handle location object specially
            formDataObj.append('location[x]', formData.location.x);
            formDataObj.append('location[y]', formData.location.y);
          } else if (key === 'isExclusive') {
            // Handle boolean
            formDataObj.append(key, formData[key] ? 'true' : 'false');
          } else {
            formDataObj.append(key, formData[key]);
          }
        });
        
        // Add the file last
        formDataObj.append('attachment', attachment);
        
        console.log("Submitting form with attachment");
        await onSubmit(formDataObj);
      } else {
        // Regular JSON submission - prepare the data object
        const submitData = {
          ...formData,
          // Ensure strings are trimmed
          name: formData.name.trim(),
          description: formData.description.trim(),
          content: formData.content.trim(),
          // Ensure location is properly formatted as numbers
          location: {
            x: Number(formData.location.x),
            y: Number(formData.location.y)
          }
        };
        
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
          area: 'Overworld',
          isExclusive: false,
          location: generateRandomCoordinates('Overworld'),
          exp: 10,
          visible: true,
          status: 'dropped',
          type: 'artifact'
        });
        setAttachment(null);
        setAttachmentPreview(null);
        setUseRandomLocation(true);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      console.error('Error submitting artifact:', err);
      setError(err.message || 'Failed to save artifact. Please try again.');
    } finally {
      setUploading(false);
    }
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
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="area">Area</label>
            <select
              id="area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              required
            >
              <option value="Overworld">Overworld</option>
              <option value="main">Main World</option>
              <option value="library">Library</option>
              <option value="garden">Garden</option>
              <option value="tavern">Tavern</option>
              <option value="workshop">Workshop</option>
              <option value="dungeon">Dungeon</option>
            </select>
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
        </div>
        
        <div className="form-group location-group">
          <label>Location</label>
          <div className="location-controls">
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor="location-x">X Coordinate</label>
                <input
                  type="number"
                  id="location-x"
                  name="x"
                  value={formData.location?.x || 0}
                  onChange={handleLocationChange}
                  disabled={useRandomLocation}
                  required
                  min="0"
                  max="1000"
                />
              </div>
              <div className="form-group half-width">
                <label htmlFor="location-y">Y Coordinate</label>
                <input
                  type="number"
                  id="location-y"
                  name="y"
                  value={formData.location?.y || 0}
                  onChange={handleLocationChange}
                  disabled={useRandomLocation}
                  required
                  min="0"
                  max="1000"
                />
              </div>
            </div>
            <div className="random-location-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={useRandomLocation}
                  onChange={toggleRandomLocation}
                />
                Use random coordinates for this area
              </label>
            </div>
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