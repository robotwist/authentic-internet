import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createArtifact } from "../api/api";
import SoundManager from './utils/SoundManager';
import { getRandomQuote, getCategoryQuote } from '../utils/quoteSystem.js';
import "./ArtifactCreation.css";
import { useAuth } from '../context/AuthContext';
import ArtifactForm from './ArtifactForm';
import { useSoundUtils } from '../hooks/useSound';

const ARTIFACT_THEMES = [
  { value: 'wisdom', label: 'Wisdom & Philosophy' },
  { value: 'inspiration', label: 'Inspiration & Motivation' },
  { value: 'nature', label: 'Nature & Exploration' },
  { value: 'literature', label: 'Literature & Poetry' },
  { value: 'history', label: 'History & Legacy' },
  { value: 'personal', label: 'Personal Reflection' },
];

const ArtifactCreation = ({ position, onClose, onSuccess, refreshArtifacts, isFirstArtifact = false, onCancel, currentArea }) => {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [soundManager, setSoundManager] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: ''
  });
  const { playSuccess, playError } = useSoundUtils();

  // Initialize sound manager
  useEffect(() => {
    const initSoundManager = async () => {
      const manager = SoundManager.getInstance();
      await manager.initialize();
      setSoundManager(manager);
    };
    initSoundManager();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create artifacts');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Get a random quote for inspiration if content is empty
      if (!formData.content.trim()) {
        const quote = getRandomQuote();
        formData.content = quote.text;
      }
      
      // Get an inspirational quote for the artifact
      let quote;
      try {
        quote = formData.type === 'wisdom' ? 
          getCategoryQuote('wisdom') :
          getRandomQuote();
      } catch (err) {
        console.error('Failed to fetch quote:', err);
        quote = {
          text: "The journey of a thousand miles begins with a single step.",
          author: "Lao Tzu",
          type: "wisdom"
        };
      }

      // Prepare artifact data
      const artifactData = {
        ...formData,
        creator: user.id,
        location: {
          x: position.x,
          y: position.y,
          area: currentArea
        },
        quote: quote.text,
        quoteAuthor: quote.author,
        createdAt: new Date().toISOString()
      };

      // Create the artifact
      const response = await createArtifact(artifactData);

      if (response.success) {
        if (soundManager) soundManager.playSound('artifact_create');
        onSuccess?.(response.artifact);
        onClose?.();
        playSuccess();
      } else {
        setError(response.message || 'Failed to create artifact');
        if (soundManager) soundManager.playSound('error');
        playError();
      }
    } catch (err) {
      console.error('Error creating artifact:', err);
      setError('Failed to create artifact. Please try again.');
      if (soundManager) soundManager.playSound('error');
      playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (soundManager) soundManager.playSound('bump');
    onCancel?.();
    onClose?.();
  };

  return (
    <div className="artifact-creation" style={{ left: position.x, top: position.y }}>
      <h2>Create New Artifact</h2>
      {error && <div className="error-message">{error}</div>}
      <ArtifactForm
        onSubmit={handleSubmit}
        onClose={handleCancel}
        currentArea={currentArea}
        isFirstArtifact={isFirstArtifact}
        loading={isSubmitting}
        formData={formData}
        setFormData={setFormData}
      />
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
  onCancel: PropTypes.func,
  currentArea: PropTypes.string
};

export default ArtifactCreation;
