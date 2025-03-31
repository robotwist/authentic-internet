import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getRandomQuote, getCategoryQuote } from '../utils/quoteSystem.js';
import '../styles/QuoteDisplay.css';

const QuoteDisplay = ({ type = 'random', onSave }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuote = async () => {
      setLoading(true);
      setError(null);
      try {
        let quoteData;
        
        switch (type) {
          case 'wisdom':
            quoteData = getCategoryQuote('wisdom');
            break;
          case 'random':
          default:
            quoteData = getRandomQuote();
        }
        
        setQuote(quoteData);
      } catch (err) {
        console.error('Failed to fetch quote:', err);
        setError('Failed to load quote');
        setQuote({
          text: "The best way out is always through.",
          author: "Robert Frost",
          type: "wisdom"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [type]);

  if (loading) {
    return <div className="quote-display loading">Loading wisdom...</div>;
  }

  if (error) {
    return <div className="quote-display error">{error}</div>;
  }

  if (!quote) {
    return null;
  }

  return (
    <div className="quote-display">
      <blockquote>
        <p className="quote-text">{quote.text}</p>
        <footer className="quote-author">— {quote.author}</footer>
      </blockquote>
      {onSave && (
        <button 
          className="save-quote-button"
          onClick={() => onSave(quote)}
        >
          Save Quote
        </button>
      )}
    </div>
  );
};

QuoteDisplay.propTypes = {
  type: PropTypes.oneOf(['random', 'wisdom']),
  onSave: PropTypes.func
};

export default QuoteDisplay; 