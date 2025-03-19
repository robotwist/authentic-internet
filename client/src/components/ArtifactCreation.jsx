import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createArtifact } from "../api/api";
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
  
  // New personalization fields
  const [theme, setTheme] = useState('wisdom');
  const [dedication, setDedication] = useState('');
  const [significance, setSignificance] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
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
      return;
    }
    
    if (!name || !description || !content) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Create a more detailed artifact object
      const artifactData = {
        name,
        description,
        content,
        messageText,
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
        dedication: dedication || null,
        significance: significance || null,
        creationDate: new Date().toISOString(),
        placeWithCare: true // Flag to indicate this was thoughtfully placed
      };
      
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(artifactData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create artifact');
      }
      
      const result = await response.json();
      setSuccess('Artifact created successfully!');
      
      // Update character experience for first artifact
      if (isFirstArtifact) {
        try {
          const userResponse = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            
            // Update user with bonus XP for first artifact
            await fetch('/api/users/me', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                exp: (userData.exp || 0) + 100, // Bonus 100 XP for first artifact
              })
            });
          }
        } catch (error) {
          console.error('Error updating user experience:', error);
        }
      }
      
      // Refresh artifacts if provided
      if (refreshArtifacts) {
        refreshArtifacts();
      }
      
      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess(result.artifact);
      }
      
      // Reset form
      setName('');
      setDescription('');
      setContent('');
      setMessageText('');
      setTheme('wisdom');
      setDedication('');
      setSignificance('');
      setIsPrivate(false);
      
      // Auto-close for first artifact flow
      if (isFirstArtifact) {
        setTimeout(() => {
          onCancel ? onCancel() : onClose();
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error creating artifact:', error);
      setError('Failed to create artifact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQuote = async (source) => {
    setIsGeneratingQuote(true);
    try {
      let quoteData;
      
      switch(source) {
        case 'general':
          quoteData = await getRandomQuote();
          break;
        case 'shakespeare':
          quoteData = await getRandomShakespeareQuote();
          break;
        case 'zen':
          quoteData = await getZenQuote();
          break;
        case 'themed':
          if (!name) {
            setError('Please enter a name first for themed quotes');
            setIsGeneratingQuote(false);
            return;
          }
          quoteData = await getQuoteForArtifact(theme || name);
          break;
        default:
          quoteData = await getRandomQuote();
      }
      
      if (quoteData && quoteData.text) {
        setContent(quoteData.text);
      } else {
        setError('Could not generate quote. Please try again.');
      }
    } catch (error) {
      console.error('Error generating quote:', error);
      setError('Failed to generate quote. Please try again.');
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  // Simplified form for first-time users
  if (isFirstArtifact) {
    return (
      <div className="artifact-creation-container first-artifact-mode">
        <h3>Create Your First Artifact</h3>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name <span className="required">*</span></label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="theme">Theme <span className="required">*</span></label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              required
              className="theme-select"
            >
              {ARTIFACT_THEMES.map(theme => (
                <option key={theme.value} value={theme.value}>{theme.label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="content">Content <span className="required">*</span></label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="content-textarea"
              placeholder="Enter profound wisdom or click a quote button below..."
            />
          </div>
          
          <div className="quote-buttons">
            <button
              type="button"
              onClick={() => handleGenerateQuote('general')}
              disabled={isGeneratingQuote}
              className="quote-button"
            >
              Random Quote
            </button>
            <button
              type="button"
              onClick={() => handleGenerateQuote('shakespeare')}
              disabled={isGeneratingQuote}
              className="quote-button shakespeare"
            >
              Shakespeare Quote
            </button>
          </div>
          
          <div className="artifact-instructions">
            <div className="instruction-icon">💡</div>
            <p>This artifact will be placed in the world for others to discover. Make it meaningful!</p>
          </div>
          
          <div className="form-action-buttons">
            <button
              type="submit"
              disabled={isSubmitting}
              className="create-button"
            >
              {isSubmitting ? 'Creating...' : 'Create My Artifact'}
            </button>
            <button
              type="button"
              onClick={onCancel || onClose}
              className="cancel-button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Regular full form with enhanced personalization
  return (
    <div className="artifact-creation-container">
      <h3>Create a Meaningful Artifact</h3>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h4 className="section-title">Basic Information</h4>
          
          <div className="form-group">
            <label htmlFor="name">Name <span className="required">*</span></label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Give your artifact a meaningful name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description <span className="required">*</span></label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Briefly describe what this artifact represents"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="theme">Theme <span className="required">*</span></label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              required
              className="theme-select"
            >
              {ARTIFACT_THEMES.map(theme => (
                <option key={theme.value} value={theme.value}>{theme.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-section">
          <h4 className="section-title">Content</h4>
          
          <div className="form-group">
            <label htmlFor="content">Content <span className="required">*</span></label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="content-textarea"
              placeholder="Enter wisdom, quotes, or thoughts you want to share with others..."
            />
          </div>
          
          <div className="quote-buttons">
            <button
              type="button"
              onClick={() => handleGenerateQuote('general')}
              disabled={isGeneratingQuote}
              className="quote-button"
            >
              Random Quote
            </button>
            <button
              type="button"
              onClick={() => handleGenerateQuote('shakespeare')}
              disabled={isGeneratingQuote}
              className="quote-button shakespeare"
            >
              Shakespeare Quote
            </button>
            <button
              type="button"
              onClick={() => handleGenerateQuote('zen')}
              disabled={isGeneratingQuote}
              className="quote-button zen"
            >
              Zen Quote
            </button>
            <button
              type="button"
              onClick={() => handleGenerateQuote('themed')}
              disabled={isGeneratingQuote || (!name && !theme)}
              className="quote-button themed"
            >
              Themed Quote
            </button>
          </div>
        </div>
        
        <div className="form-section">
          <h4 className="section-title">Personalization <span className="optional">(Optional)</span></h4>
          
          <div className="form-group">
            <label htmlFor="dedication">Dedication</label>
            <input
              type="text"
              id="dedication"
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              placeholder="Dedicate this artifact to someone special"
              className="optional-field"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="significance">Personal Significance</label>
            <textarea
              id="significance"
              value={significance}
              onChange={(e) => setSignificance(e.target.value)}
              placeholder="Why is this artifact meaningful to you? (Only visible to you)"
              className="optional-field significance-textarea"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="messageText">Message to Discoverers</label>
            <input
              type="text"
              id="messageText"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Leave a message for those who find your artifact"
              className="optional-field"
            />
          </div>
          
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <label htmlFor="isPrivate">Make this a private artifact (only visible to you)</label>
          </div>
        </div>
        
        <div className="artifact-instructions">
          <div className="instruction-icon">💡</div>
          <p>This artifact will be placed at your current location in the world. Choose this spot with care to give your artifact meaning in its context.</p>
        </div>
        
        <div className="form-action-buttons">
          <button
            type="submit"
            disabled={isSubmitting}
            className="create-button"
          >
            {isSubmitting ? 'Creating...' : 'Create Artifact with Care'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cancel-button"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

ArtifactCreation.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }).isRequired,
  onClose: PropTypes.func,
  refreshArtifacts: PropTypes.func,
  onSuccess: PropTypes.func,
  isFirstArtifact: PropTypes.bool,
  onCancel: PropTypes.func
};

ArtifactCreation.defaultProps = {
  onClose: () => {},
  refreshArtifacts: () => {},
  onSuccess: null,
  isFirstArtifact: false,
  onCancel: null
};

export default ArtifactCreation;
