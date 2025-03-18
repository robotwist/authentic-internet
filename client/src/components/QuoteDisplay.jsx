import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import './QuoteDisplay.css';
import { API_CONFIG, buildApiUrl } from '../utils/apiConfig';
import { getRandomQuoteFromArray, SHAKESPEARE_QUOTES, GENERAL_QUOTES } from '../utils/fallbackQuotes';

const QuoteDisplay = ({ 
  sourceType = 'general', 
  refreshInterval = 0, 
  tags = '', 
  author = '',
  theme = '',
  className = '',
  showSource = true
}) => {
  const [quote, setQuote] = useState({ text: '', source: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getRandomQuote = async (options = {}) => {
    try {
      let url = buildApiUrl('quotable', 'random');
      const params = {};
      
      if (options.tags) {
        params.tags = options.tags;
      }
      
      if (options.author) {
        params.author = options.author;
      }
      
      const response = await axios.get(url, { params });
      
      if (response.data?.content) {
        return {
          text: response.data.content,
          source: response.data.author
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching random quote:', error);
      // Return a random fallback quote
      return getRandomQuoteFromArray(GENERAL_QUOTES);
    }
  };

  const getRandomShakespeareQuote = async () => {
    try {
      // Try to get a random Shakespeare line
      const plays = ['Ham', 'Mac', 'Rom', 'Oth', 'Lr', 'JC', 'MV', 'Ado'];
      const randomPlay = plays[Math.floor(Math.random() * plays.length)];
      
      // Get a random line number (most plays have at least 2500 lines)
      const randomLineNum = Math.floor(Math.random() * 2500) + 1;
      const paddedLineNum = randomLineNum.toString().padStart(4, '0');
      
      const url = `${API_CONFIG.folger.baseUrl}/${randomPlay}/ftln/${paddedLineNum}`;
      const response = await axios.get(url);
      
      if (response.data && typeof response.data === 'string') {
        const textMatch = response.data.match(/<div class="line-text">(.*?)<\/div>/);
        
        if (textMatch && textMatch[1]) {
          const text = textMatch[1].replace(/<[^>]*>/g, '');
          const playName = getPlayName(randomPlay);
          
          return {
            text: text,
            source: `${playName} - Shakespeare`
          };
        }
      }
      
      throw new Error('Failed to extract Shakespeare quote');
    } catch (error) {
      console.error('Error fetching Shakespeare quote:', error);
      // Use fallback quotes
      return getRandomQuoteFromArray(SHAKESPEARE_QUOTES);
    }
  };

  const getPlayName = (playCode) => {
    const playNames = {
      Ham: 'Hamlet',
      Mac: 'Macbeth',
      Lr: 'King Lear',
      Rom: 'Romeo and Juliet',
      Tmp: 'The Tempest',
      MND: 'A Midsummer Night\'s Dream',
      Oth: 'Othello',
      JC: 'Julius Caesar',
      MV: 'The Merchant of Venice',
      Ado: 'Much Ado About Nothing'
    };
    
    return playNames[playCode] || playCode;
  };

  const getZenQuote = async () => {
    try {
      const url = buildApiUrl('zenQuotes', 'random');
      const response = await axios.get(url);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return {
          text: response.data[0].q,
          source: response.data[0].a
        };
      }
      
      throw new Error('Invalid ZenQuotes response format');
    } catch (error) {
      console.error('Error fetching Zen quote:', error);
      // Return a random zen-like fallback quote
      return {
        text: "Be present in all things and thankful for all things.",
        source: "Maya Angelou"
      };
    }
  };

  const getTodayQuote = async () => {
    try {
      const url = buildApiUrl('quotable', 'today');
      const response = await axios.get(url);
      
      if (response.data?.content) {
        return {
          text: response.data.content,
          source: response.data.author
        };
      }
      
      throw new Error('Invalid today quote response format');
    } catch (error) {
      console.error('Error fetching today quote:', error);
      // Fallback to a random quote
      return getRandomQuote();
    }
  };

  const fetchQuote = async () => {
    setLoading(true);
    setError('');
    try {
      let quoteData;
      
      switch (sourceType) {
        case 'shakespeare':
          quoteData = await getRandomShakespeareQuote();
          break;
        case 'zen':
          quoteData = await getZenQuote();
          break;
        case 'today':
          quoteData = await getTodayQuote();
          break;
        default:
          // For general quotes, we can pass tags and author
          const options = {};
          if (tags) options.tags = tags;
          if (author) options.author = author;
          
          quoteData = await getRandomQuote(options);
          break;
      }
      
      setQuote(quoteData);
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('Failed to load quote');
      setQuote({ 
        text: 'The journey of a thousand miles begins with a single step.', 
        source: 'Lao Tzu' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
    
    // Set up a refresh interval if specified
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchQuote, refreshInterval * 1000);
      
      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, [sourceType, tags, author, refreshInterval]);

  // Apply different class based on source type
  const getSourceClass = () => {
    switch (sourceType) {
      case 'shakespeare': return 'shakespeare';
      case 'zen': return 'zen';
      case 'today': return 'today';
      default: return '';
    }
  };

  return (
    <div className={`quote-display ${className} ${getSourceClass()} ${loading ? 'loading' : ''}`}>
      {loading ? (
        <div className="quote-loading">
          <div className="quote-loading-spinner"></div>
          <p>Loading wisdom...</p>
        </div>
      ) : error ? (
        <div className="quote-error">
          <p>{error}</p>
          <button onClick={fetchQuote} className="quote-retry-btn">
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="quote-text">"{quote.text}"</div>
          {showSource && <div className="quote-source">— {quote.source}</div>}
          {refreshInterval > 0 && (
            <button onClick={fetchQuote} className="quote-refresh-btn">
              ↻ New Quote
            </button>
          )}
        </>
      )}
    </div>
  );
};

QuoteDisplay.propTypes = {
  sourceType: PropTypes.oneOf(['general', 'shakespeare', 'zen', 'today']),
  refreshInterval: PropTypes.number,
  tags: PropTypes.string,
  author: PropTypes.string,
  theme: PropTypes.string,
  className: PropTypes.string,
  showSource: PropTypes.bool
};

export default QuoteDisplay; 