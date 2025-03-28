import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createArtifact } from "../api/api";
import SoundManager from './utils/SoundManager';
import { 
  getRandomQuote, 
  getRandomShakespeareQuote, 
  getQuoteForArtifact, 
  getZenQuote,
  getTodayQuote
} from "../api/externalApis";
import "./ArtifactCreation.css";

const ARTIFACT_THEMES = [
  { value: 'wisdom', label: 'Wisdom & Philosophy' },
  { value: 'inspiration', label: 'Inspiration & Motivation' },
  { value: 'nature', label: 'Nature & Exploration' },
  { value: 'literature', label: 'Literature & Poetry' },
  { value: 'history', label: 'History & Legacy' },
  { value: 'personal', label: 'Personal Reflection' },
];

const ArtifactCreation = ({ position, onClose, onSuccess, refreshArtifacts, isFirstArtifact = false, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [soundManager, setSoundManager] = useState(null);
  
  // New personalization fields
  const [theme, setTheme] = useState('wisdom');
  const [dedication, setDedication] = useState('');
  const [significance, setSignificance] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Initialize sound manager
  useEffect(() => {
    const initSoundManager = async () => {
      const manager = SoundManager.getInstance();
      await manager.initialize();
      setSoundManager(manager);
    };
    initSoundManager();
  }, []);
  
  // Add default values for first-time users
  useEffect(() => {
    if (isFirstArtifact) {
      setName('My First Artifact');
      setDescription('A special creation guided by Shakespeare');
      setTheme('wisdom');
    }
  }, [isFirstArtifact]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!localStorage.getItem('token')) {
      setError('You must be logged in to create artifacts.');
      if (soundManager) soundManager.playSound('error');
      return;
    }
    
    if (!name || !description || !content) {
      setError('Please fill in all required fields.');
      if (soundManager) soundManager.playSound('error');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Create a more detailed artifact object
      const artifactData = {
        name: name.trim(),
        description: description.trim(),
        content: content.trim(),
        messageText: messageText.trim(),
        area: 'world',
        isExclusive: isPrivate,
        location: {
          x: Math.floor(position.x / 32),
          y: Math.floor(position.y / 32)
        },
        // Add extra XP reward for first artifact
        exp: isFirstArtifact ? 50 : 10,
        // Add personalization fields
        theme,
        dedication: dedication.trim() || null,
        significance: significance.trim() || null,
        creationDate: new Date().toISOString(),
        placeWithCare: true // Flag to indicate this was thoughtfully placed
      };
      
      const response = await createArtifact(artifactData);
      
      if (response) {
        setSuccess('Artifact created successfully!');
        if (soundManager) soundManager.playSound('artifact_create');
        
        // Wait a moment before closing to show success message
        setTimeout(() => {
          if (onSuccess) onSuccess(response);
          if (refreshArtifacts) refreshArtifacts();
          if (onClose) onClose();
        }, 1500);
      } else {
        throw new Error('Failed to create artifact');
      }
    } catch (error) {
      console.error('Error creating artifact:', error);
      setError(error.message || 'Failed to create artifact. Please try again.');
      if (soundManager) soundManager.playSound('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQuote = async (source) => {
    setIsGeneratingQuote(true);
    setError('');
    
    try {
      let quote;
      switch (source) {
        case 'shakespeare':
          quote = await getRandomShakespeareQuote();
          break;
        case 'zen':
          quote = await getZenQuote();
          break;
        case 'today':
          quote = await getTodayQuote();
          break;
        default:
          quote = await getRandomQuote();
      }
      
      if (quote) {
        setContent(quote);
        if (soundManager) soundManager.playSound('page_turn');
      } else {
        throw new Error('Failed to generate quote');
      }
    } catch (error) {
      console.error('Error generating quote:', error);
      setError('Failed to generate quote. Please try again.');
      if (soundManager) soundManager.playSound('error');
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  const handleCancel = () => {
    if (soundManager) soundManager.playSound('bump');
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  return (
    <div className="artifact-creation-modal">
      <div className="artifact-creation-content">
        <h2>{isFirstArtifact ? 'Create Your First Artifact' : 'Create New Artifact'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter artifact name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your artifact"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter artifact content"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="messageText">Message (Optional)</label>
            <textarea
              id="messageText"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Add a message for others"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="theme">Theme</label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              {ARTIFACT_THEMES.map(theme => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="dedication">Dedication (Optional)</label>
            <input
              type="text"
              id="dedication"
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              placeholder="Dedicate this artifact to someone"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="significance">Significance (Optional)</label>
            <textarea
              id="significance"
              value={significance}
              onChange={(e) => setSignificance(e.target.value)}
              placeholder="What makes this artifact special?"
            />
          </div>
          
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              Make this artifact private
            </label>
          </div>
          
          <div className="quote-generation">
            <button
              type="button"
              onClick={() => handleGenerateQuote('shakespeare')}
              disabled={isGeneratingQuote}
            >
              Generate Shakespeare Quote
            </button>
            <button
              type="button"
              onClick={() => handleGenerateQuote('zen')}
              disabled={isGeneratingQuote}
            >
              Generate Zen Quote
            </button>
            <button
              type="button"
              onClick={() => handleGenerateQuote('today')}
              disabled={isGeneratingQuote}
            >
              Generate Today's Quote
            </button>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Artifact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ArtifactCreation.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }).isRequired,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  refreshArtifacts: PropTypes.func,
  isFirstArtifact: PropTypes.bool,
  onCancel: PropTypes.func
};

export default ArtifactCreation;
