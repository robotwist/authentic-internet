import React, { useState, useEffect } from 'react';
import { getRandomQuote } from '../utils/quoteSystem.js';
import '../styles/DailyQuote.css';

const DailyQuote = ({ onSave }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuote = async () => {
      setLoading(true);
      try {
        const quoteResponse = getRandomQuote();
        setQuote(quoteResponse);
      } catch (err) {
        console.error('Failed to fetch daily quote:', err);
        setError('Failed to load daily quote');
        // Set fallback quote
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
  }, []);

  if (loading) {
    return <div className="daily-quote loading">Loading daily wisdom...</div>;
  }

  if (error) {
    return <div className="daily-quote error">{error}</div>;
  }

  return (
    <div className="daily-quote">
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

export default DailyQuote; 