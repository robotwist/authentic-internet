import { useState, useEffect, useCallback } from 'react';
import { 
  getRandomQuote, 
  getRandomShakespeareQuote, 
  getZenQuote,
  getTodayQuote,
  getQuoteForArtifact
} from '../api/externalApis';

/**
 * Custom hook for fetching quotes from various sources
 * @param {Object} options - Configuration options
 * @param {string} options.source - Quote source ('general', 'shakespeare', 'zen', 'today', 'themed')
 * @param {string} options.theme - Theme for themed quotes
 * @param {string} options.tags - Tags for filtering quotes
 * @param {string} options.author - Author for filtering quotes
 * @param {number} options.refreshInterval - Auto-refresh interval in seconds (0 to disable)
 * @returns {Object} - Quote state and control functions
 */
export const useQuote = ({
  source = 'general',
  theme = '',
  tags = '',
  author = '',
  refreshInterval = 0 
} = {}) => {
  const [quote, setQuote] = useState({ text: '', source: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      let quoteData;
      
      switch (source) {
        case 'shakespeare':
          quoteData = await getRandomShakespeareQuote();
          break;
        case 'zen':
          quoteData = await getZenQuote();
          break;
        case 'today':
          quoteData = await getTodayQuote();
          break;
        case 'themed':
          quoteData = await getQuoteForArtifact(theme || 'wisdom');
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
      // Set fallback quote
      setQuote({ 
        text: 'The journey of a thousand miles begins with a single step.', 
        source: 'Lao Tzu' 
      });
    } finally {
      setLoading(false);
    }
  }, [source, theme, tags, author]);

  useEffect(() => {
    fetchQuote();
    
    // Set up a refresh interval if specified
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchQuote, refreshInterval * 1000);
      
      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, [fetchQuote, refreshInterval]);

  return {
    quote,
    loading,
    error,
    refreshQuote: fetchQuote,
    setSource: (newSource) => {
      if (['general', 'shakespeare', 'zen', 'today', 'themed'].includes(newSource)) {
        source = newSource;
        fetchQuote();
      } else {
        setError(`Invalid source: ${newSource}`);
      }
    }
  };
};

export default useQuote; 