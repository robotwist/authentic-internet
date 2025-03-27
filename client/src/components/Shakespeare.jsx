import React, { useState, useEffect } from 'react';
import './DialogBox.css';

const ShakespeareDialog = ({ 
  isOpen, 
  onClose, 
  character = { 
    name: 'William Shakespeare', 
    role: 'Playwright and Poet',
    avatar: '/assets/npcs/shakespeare.png'
  } 
}) => {
  const [quote, setQuote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchShakespeareQuote();
    }
  }, [isOpen]);

  const fetchShakespeareQuote = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/external/shakespeare');
      if (!response.ok) {
        throw new Error('Failed to fetch Shakespeare quote');
      }
      
      const data = await response.json();
      setQuote(data.quote || data.content || 'To be, or not to be, that is the question.');
    } catch (err) {
      console.error('Error fetching Shakespeare quote:', err);
      setError('Could not fetch a quote. The Bard seems to be taking a break.');
      setQuote("All the world's a stage, and all the men and women merely players. They have their exits and their entrances; And one man in his time plays many parts.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop">
      <div className="dialog-container shakespeare">
        <div className="dialog-header">
          <img 
            src={character.avatar} 
            alt={character.name} 
            className="dialog-avatar"
          />
          <div className="dialog-character-info">
            <h2>{character.name}</h2>
            <p>{character.role}</p>
          </div>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        
        <div className="dialog-content">
          {isLoading ? (
            <div className="dialog-loading">
              <div className="loading-spinner"></div>
              <p>The Bard is contemplating...</p>
            </div>
          ) : error ? (
            <div className="dialog-error">
              <p>{error}</p>
              <button onClick={fetchShakespeareQuote}>Try Again</button>
            </div>
          ) : (
            <div className="shakespeare-quote">
              <p>"{quote}"</p>
              <p className="quote-attribution">— William Shakespeare</p>
            </div>
          )}
        </div>
        
        <div className="dialog-actions">
          <button onClick={fetchShakespeareQuote} disabled={isLoading}>
            {isLoading ? 'Fetching...' : 'Another Quote'}
          </button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ShakespeareDialog; 