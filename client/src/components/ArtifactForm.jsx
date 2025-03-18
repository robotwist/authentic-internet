import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './shared/Button';
import '../styles/ArtifactForm.css';

// Area-specific coordinate ranges
const AREA_COORDINATES = {
  'Overworld': { x: [100, 900], y: [100, 900] },
  'main': { x: [100, 900], y: [100, 900] },
  'library': { x: [50, 450], y: [50, 450] },
  'garden': { x: [500, 950], y: [50, 450] },
  'tavern': { x: [50, 450], y: [500, 950] },
  'workshop': { x: [500, 950], y: [500, 950] },
  'dungeon': { x: [200, 800], y: [200, 800] }
};

// Helper to generate random coordinates based on area
const generateRandomCoordinates = (area) => {
  const coords = AREA_COORDINATES[area] || AREA_COORDINATES['main'];
  return {
    x: Math.floor(Math.random() * (coords.x[1] - coords.x[0])) + coords.x[0],
    y: Math.floor(Math.random() * (coords.y[1] - coords.y[0])) + coords.y[0]
  };
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
    riddle: initialProps.riddle || '',
    unlockAnswer: initialProps.unlockAnswer || '',
    area: initialProps.area || 'Overworld',
    isExclusive: initialProps.isExclusive || false,
    location: initialProps.location || generateRandomCoordinates('Overworld')
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
    setUseRandomLocation(false); // User is manually setting coordinates
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: parseInt(value, 10) || 0
      }
    }));
  };

  const handleRandomLocation = () => {
    const newCoords = generateRandomCoordinates(formData.area);
    setFormData(prev => ({
      ...prev,
      location: newCoords
    }));
    setUseRandomLocation(true);
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachmentPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, just show the filename
        setAttachmentPreview(file.name);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setUploading(true);
      
      // Ensure we have valid coordinates for the selected area
      if (useRandomLocation || !formData.location.x || !formData.location.y) {
        const newCoords = generateRandomCoordinates(formData.area);
        setFormData(prev => ({
          ...prev,
          location: newCoords
        }));
      }
      
      // Create FormData object for file upload
      const artifactFormData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'location') {
          artifactFormData.append('location[x]', value.x);
          artifactFormData.append('location[y]', value.y);
        } else {
          artifactFormData.append(key, value);
        }
      });
      
      // Add attachment if present
      if (attachment) {
        artifactFormData.append('attachment', attachment);
      }
      
      // Add content if not present but description is
      if (!formData.content && formData.description) {
        artifactFormData.append('content', formData.description);
      }
      
      // Add area if not present
      if (!formData.area) {
        artifactFormData.append('area', 'Overworld');
      }
      
      console.log("Submitting artifact with area:", formData.area, "and location:", formData.location);
      
      // Call the onSubmit callback with the FormData
      await onSubmit(artifactFormData);
      
      // Reset form if not editing
      if (!isEditMode) {
        setFormData({
          name: '',
          description: '',
          content: '',
          riddle: '',
          unlockAnswer: '',
          area: 'Overworld',
          isExclusive: false,
          location: generateRandomCoordinates('Overworld')
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
      setError('Failed to save artifact. Please try again.');
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
        
        <div className="form-row location-controls">
          <div className="form-group">
            <label htmlFor="locationX">X Position</label>
            <input
              type="number"
              id="locationX"
              name="x"
              value={formData.location.x}
              onChange={handleLocationChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="locationY">Y Position</label>
            <input
              type="number"
              id="locationY"
              name="y"
              value={formData.location.y}
              onChange={handleLocationChange}
              required
            />
          </div>
          
          <button 
            type="button" 
            className="random-location-btn"
            onClick={handleRandomLocation}
          >
            Random Location
          </button>
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
        </div>
      </form>
    </div>
  );
};

export default ArtifactForm; 