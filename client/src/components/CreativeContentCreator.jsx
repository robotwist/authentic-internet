import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './CreativeContentCreator.css';

const CreativeContentCreator = ({ onClose, isOpen = false }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Type Selection, 2: Content Creation, 3: Details, 4: Publish
  const [contentType, setContentType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [],
    visibility: 'public',
    area: 'creative-commons',
    location: { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) },
    
    // Content-specific fields
    content: '',
    
    // Writing-specific
    writingType: 'poetry',
    genre: [],
    wordCount: 0,
    language: 'en',
    mature: false,
    allowComments: true,
    
    // Art-specific
    artType: 'digital',
    medium: [],
    dimensions: { width: 0, height: 0 },
    style: [],
    nsfw: false,
    
    // Music-specific
    musicType: 'original',
    duration: 0,
    bpm: 0,
    key: '',
    instruments: [],
    
    // Media files
    mediaFiles: [],
    
    // Rewards
    experience: 10,
    featured: false
  });

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (formData.content && contentType === 'writing') {
      const wordCount = formData.content.trim().split(/\s+/).length;
      setFormData(prev => ({ ...prev, wordCount }));
    }
  }, [formData.content, contentType]);

  const contentTypes = [
    {
      id: 'writing',
      name: 'Writing & Poetry',
      icon: '✍️',
      description: 'Share your poems, stories, essays, and creative writing',
      subtypes: ['poetry', 'short-story', 'novel-chapter', 'essay', 'script', 'lyrics', 'other']
    },
    {
      id: 'art',
      name: 'Visual Art',
      icon: '🎨',
      description: 'Showcase your digital art, drawings, and visual creations',
      subtypes: ['digital', 'pixel', 'concept', 'character', 'environment', 'ui', 'photo', 'mixed']
    },
    {
      id: 'music',
      name: 'Music & Audio',
      icon: '🎵',
      description: 'Share your original music, covers, and audio creations',
      subtypes: ['original', 'remix', 'cover', 'soundtrack', 'ambient', 'effect']
    },
    {
      id: 'game',
      name: 'Interactive Games',
      icon: '🎮',
      description: 'Create custom puzzles and mini-games for others to discover',
      subtypes: ['puzzle', 'platformer', 'rpg', 'custom']
    },
    {
      id: 'experience',
      name: 'Interactive Experience',
      icon: '🌟',
      description: 'Design immersive experiences and interactive stories',
      subtypes: ['story', 'tour', 'meditation', 'education']
    }
  ];

  const genres = [
    'Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Horror', 'Comedy', 'Drama', 'Adventure',
    'Historical', 'Contemporary', 'Literary', 'Experimental', 'Nature', 'Spiritual',
    'Personal', 'Social', 'Political', 'Philosophical', 'Educational', 'Therapeutic'
  ];

  const artStyles = [
    'Realistic', 'Cartoon', 'Abstract', 'Minimalist', 'Pixel Art', 'Impressionist',
    'Surreal', 'Pop Art', 'Concept Art', 'Fan Art', 'Traditional', 'Digital Painting',
    'Vector', 'Photography', 'Mixed Media', 'Experimental'
  ];

  const instruments = [
    'Piano', 'Guitar', 'Violin', 'Drums', 'Bass', 'Vocals', 'Synthesizer', 'Flute',
    'Saxophone', 'Trumpet', 'Cello', 'Harp', 'Electronic', 'Orchestral', 'Acoustic',
    'Digital', 'Ambient', 'Percussion', 'String Ensemble', 'Choir'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleFileUpload = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isValid = file.size <= 10 * 1024 * 1024; // 10MB limit
      if (!isValid) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
      }
      return isValid;
    });

    setFormData(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...validFiles]
    }));
  };

  const removeMediaFile = (index) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = e.target.value.trim();
      if (tag && !formData.tags.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
        e.target.value = '';
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please provide a title for your creation');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Please provide a description');
      return false;
    }

    if (contentType === 'writing' && !formData.content.trim()) {
      setError('Please provide your written content');
      return false;
    }

    if ((contentType === 'art' || contentType === 'music') && formData.mediaFiles.length === 0) {
      setError(`Please upload at least one ${contentType === 'art' ? 'image' : 'audio'} file`);
      return false;
    }

    return true;
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const publishData = new FormData();
      
      // Basic artifact data
      publishData.append('name', formData.name);
      publishData.append('description', formData.description);
      publishData.append('contentType', contentType);
      publishData.append('area', formData.area);
      publishData.append('visibility', formData.visibility);
      publishData.append('tags', JSON.stringify(formData.tags));
      publishData.append('location', JSON.stringify(formData.location));
      
      // Content-specific configuration
      const config = {};
      
      if (contentType === 'writing') {
        config.writingType = formData.writingType;
        config.genre = formData.genre;
        config.wordCount = formData.wordCount;
        config.language = formData.language;
        config.mature = formData.mature;
        config.allowComments = formData.allowComments;
        publishData.append('content', formData.content);
      } else if (contentType === 'art') {
        config.artType = formData.artType;
        config.medium = formData.medium;
        config.dimensions = formData.dimensions;
        config.style = formData.style;
        config.nsfw = formData.nsfw;
      } else if (contentType === 'music') {
        config.musicType = formData.musicType;
        config.duration = formData.duration;
        config.bpm = formData.bpm;
        config.key = formData.key;
        config.instruments = formData.instruments;
      }
      
      publishData.append(`${contentType}Config`, JSON.stringify(config));
      
      // Upload media files
      formData.mediaFiles.forEach((file, index) => {
        publishData.append(`media_${index}`, file);
      });
      
      // Completion rewards
      publishData.append('completionRewards', JSON.stringify({
        experience: formData.experience,
        achievements: ['content_creator', 'first_publish']
      }));

      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: publishData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to publish content');
      }

      const result = await response.json();
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.message || 'Failed to publish content');
    } finally {
      setLoading(false);
    }
  };

  const renderTypeSelection = () => (
    <div className="type-selection">
      <h2>What would you like to create?</h2>
      <div className="content-types">
        {contentTypes.map(type => (
          <div
            key={type.id}
            className={`content-type-card ${contentType === type.id ? 'selected' : ''}`}
            onClick={() => setContentType(type.id)}
          >
            <div className="type-icon">{type.icon}</div>
            <h3>{type.name}</h3>
            <p>{type.description}</p>
          </div>
        ))}
      </div>
      <div className="step-actions">
        <button onClick={onClose} className="cancel-btn">Cancel</button>
        <button 
          onClick={() => setStep(2)} 
          disabled={!contentType}
          className="next-btn"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderContentCreation = () => (
    <div className="content-creation">
      <h2>Create Your {contentTypes.find(t => t.id === contentType)?.name}</h2>
      
      {contentType === 'writing' && (
        <div className="writing-creator">
          <div className="form-group">
            <label>Writing Type</label>
            <select 
              value={formData.writingType} 
              onChange={(e) => handleInputChange('writingType', e.target.value)}
            >
              {contentTypes.find(t => t.id === contentType)?.subtypes.map(subtype => (
                <option key={subtype} value={subtype}>
                  {subtype.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Your Content</label>
            <textarea
              ref={textareaRef}
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Share your creative writing..."
              rows={15}
              className="content-textarea"
            />
            <div className="word-count">
              Words: {formData.wordCount}
            </div>
          </div>
          
          <div className="form-group">
            <label>Genres (select all that apply)</label>
            <div className="checkbox-grid">
              {genres.map(genre => (
                <label key={genre} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.genre.includes(genre)}
                    onChange={(e) => handleArrayFieldChange('genre', genre, e.target.checked)}
                  />
                  {genre}
                </label>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.mature}
                onChange={(e) => handleInputChange('mature', e.target.checked)}
              />
              Mature Content (18+)
            </label>
          </div>
        </div>
      )}
      
      {contentType === 'art' && (
        <div className="art-creator">
          <div className="form-group">
            <label>Art Type</label>
            <select 
              value={formData.artType} 
              onChange={(e) => handleInputChange('artType', e.target.value)}
            >
              {contentTypes.find(t => t.id === contentType)?.subtypes.map(subtype => (
                <option key={subtype} value={subtype}>
                  {subtype.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Upload Your Artwork</label>
            <div className="file-upload-area">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                style={{ display: 'none' }}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="upload-btn"
              >
                📁 Choose Images
              </button>
              <p>Upload your artwork (PNG, JPG, GIF, WebP)</p>
            </div>
            
            {formData.mediaFiles.length > 0 && (
              <div className="uploaded-files">
                {formData.mediaFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <span>{file.name}</span>
                    <button onClick={() => removeMediaFile(index)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>Art Styles</label>
            <div className="checkbox-grid">
              {artStyles.map(style => (
                <label key={style} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.style.includes(style)}
                    onChange={(e) => handleArrayFieldChange('style', style, e.target.checked)}
                  />
                  {style}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {contentType === 'music' && (
        <div className="music-creator">
          <div className="form-group">
            <label>Music Type</label>
            <select 
              value={formData.musicType} 
              onChange={(e) => handleInputChange('musicType', e.target.value)}
            >
              {contentTypes.find(t => t.id === contentType)?.subtypes.map(subtype => (
                <option key={subtype} value={subtype}>
                  {subtype.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Upload Your Music</label>
            <div className="file-upload-area">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                style={{ display: 'none' }}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="upload-btn"
              >
                🎵 Choose Audio Files
              </button>
              <p>Upload your music (MP3, WAV, OGG, M4A)</p>
            </div>
            
            {formData.mediaFiles.length > 0 && (
              <div className="uploaded-files">
                {formData.mediaFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <span>{file.name}</span>
                    <button onClick={() => removeMediaFile(index)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>BPM</label>
              <input
                type="number"
                value={formData.bpm}
                onChange={(e) => handleInputChange('bpm', parseInt(e.target.value) || 0)}
                min="0"
                max="300"
              />
            </div>
            <div className="form-group">
              <label>Key</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => handleInputChange('key', e.target.value)}
                placeholder="e.g., C Major, A Minor"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Instruments Used</label>
            <div className="checkbox-grid">
              {instruments.map(instrument => (
                <label key={instrument} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.instruments.includes(instrument)}
                    onChange={(e) => handleArrayFieldChange('instruments', instrument, e.target.checked)}
                  />
                  {instrument}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="step-actions">
        <button onClick={() => setStep(1)} className="back-btn">Back</button>
        <button onClick={() => setStep(3)} className="next-btn">Next</button>
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="details-form">
      <h2>Publication Details</h2>
      
      <div className="form-group">
        <label>Title *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Give your creation a title..."
          maxLength={100}
        />
      </div>
      
      <div className="form-group">
        <label>Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your creation..."
          rows={4}
          maxLength={1000}
        />
      </div>
      
      <div className="form-group">
        <label>Tags</label>
        <input
          type="text"
          placeholder="Add tags (press Enter or comma to add)"
          onKeyDown={handleTagInput}
        />
        <div className="tags-display">
          {formData.tags.map(tag => (
            <span key={tag} className="tag">
              {tag}
              <button onClick={() => removeTag(tag)}>×</button>
            </span>
          ))}
        </div>
      </div>
      
      <div className="form-group">
        <label>Visibility</label>
        <select 
          value={formData.visibility} 
          onChange={(e) => handleInputChange('visibility', e.target.value)}
        >
          <option value="public">Public - Anyone can discover</option>
          <option value="unlisted">Unlisted - Only with direct link</option>
          <option value="community-only">Community Only - Members only</option>
          <option value="private">Private - Only you</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Experience Reward</label>
        <input
          type="number"
          value={formData.experience}
          onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 10)}
          min="5"
          max="100"
        />
        <small>Experience points viewers will gain by engaging with your content</small>
      </div>
      
      <div className="step-actions">
        <button onClick={() => setStep(2)} className="back-btn">Back</button>
        <button onClick={() => setStep(4)} className="next-btn">Review & Publish</button>
      </div>
    </div>
  );

  const renderPublish = () => (
    <div className="publish-review">
      <h2>Review & Publish</h2>
      
      <div className="preview-card">
        <div className="preview-header">
          <h3>{formData.name}</h3>
          <div className="content-type-badge">
            {contentTypes.find(t => t.id === contentType)?.icon} {contentTypes.find(t => t.id === contentType)?.name}
          </div>
        </div>
        
        <p className="preview-description">{formData.description}</p>
        
        <div className="preview-details">
          <div className="detail-row">
            <span>Creator:</span>
            <span>{user?.displayName || user?.username}</span>
          </div>
          <div className="detail-row">
            <span>Visibility:</span>
            <span>{formData.visibility}</span>
          </div>
          <div className="detail-row">
            <span>Experience Reward:</span>
            <span>{formData.experience} XP</span>
          </div>
          {formData.tags.length > 0 && (
            <div className="detail-row">
              <span>Tags:</span>
              <span>{formData.tags.join(', ')}</span>
            </div>
          )}
        </div>
        
        {formData.mediaFiles.length > 0 && (
          <div className="preview-media">
            <span>Media Files: {formData.mediaFiles.length}</span>
          </div>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="step-actions">
        <button onClick={() => setStep(3)} className="back-btn">Back</button>
        <button 
          onClick={handlePublish} 
          disabled={loading}
          className="publish-btn"
        >
          {loading ? 'Publishing...' : '🚀 Publish Creation'}
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="success-screen">
      <div className="success-content">
        <h2>🎉 Successfully Published!</h2>
        <p>Your creation has been published to the Authentic Internet!</p>
        <p>Other players can now discover and engage with your content.</p>
        <div className="success-actions">
          <button onClick={onClose} className="continue-btn">
            Continue Exploring
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="creative-content-creator">
      <div className="creator-modal">
        <div className="creator-header">
          <h1>Creative Content Creator</h1>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="progress-bar">
          <div className="progress-steps">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className={`step ${step >= num ? 'active' : ''}`}>
                {num}
              </div>
            ))}
          </div>
        </div>
        
        <div className="creator-content">
          {success ? renderSuccess() : (
            <>
              {step === 1 && renderTypeSelection()}
              {step === 2 && renderContentCreation()}
              {step === 3 && renderDetails()}
              {step === 4 && renderPublish()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreativeContentCreator; 