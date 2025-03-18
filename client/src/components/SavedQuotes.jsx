import React from 'react';
import PropTypes from 'prop-types';
import './SavedQuotes.css';

const SavedQuotes = ({ quotes = [], onClose, onDeleteQuote }) => {
  if (!quotes || quotes.length === 0) {
    return (
      <div className="saved-quotes-container">
        <div className="saved-quotes-header">
          <h2>Saved Quotes</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="no-quotes-message">
          <p>You haven't saved any quotes yet.</p>
          <p>Talk to Shakespeare and save his quotes to see them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-quotes-container">
      <div className="saved-quotes-header">
        <h2>Saved Shakespeare Quotes</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="quotes-list">
        {quotes.map((quote, index) => (
          <div key={index} className="quote-item">
            <div className="quote-text">"{quote.text}"</div>
            <div className="quote-source">{quote.source}</div>
            <div className="quote-timestamp">Saved on: {new Date(quote.timestamp).toLocaleDateString()}</div>
            {onDeleteQuote && (
              <button 
                className="delete-quote-button"
                onClick={() => onDeleteQuote(index)}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

SavedQuotes.propTypes = {
  quotes: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      source: PropTypes.string,
      timestamp: PropTypes.string
    })
  ),
  onClose: PropTypes.func.isRequired,
  onDeleteQuote: PropTypes.func
};

export default SavedQuotes; 