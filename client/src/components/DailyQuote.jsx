import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG, buildApiUrl } from '../utils/apiConfig';
import './QuoteDisplay.css';

// Expanded fallback quotes for when APIs fail
const FALLBACK_QUOTES = [
  {
    text: "Today is a new beginning, full of possibilities.",
    source: "Anonymous"
  },
  {
    text: "The only way to do great work is to love what you do.",
    source: "Steve Jobs"
  },
  {
    text: "In the midst of winter, I found there was, within me, an invincible summer.",
    source: "Albert Camus"
  },
  {
    text: "The journey of a thousand miles begins with one step.",
    source: "Lao Tzu"
  },
  {
    text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    source: "Ralph Waldo Emerson"
  },
  {
    text: "Be yourself; everyone else is already taken.",
    source: "Oscar Wilde"
  },
  {
    text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
    source: "Albert Einstein"
  },
  {
    text: "A room without books is like a body without a soul.",
    source: "Cicero"
  },
  {
    text: "Be the change that you wish to see in the world.",
    source: "Mahatma Gandhi"
  },
  {
    text: "In three words I can sum up everything I've learned about life: it goes on.",
    source: "Robert Frost"
  }
];

const DailyQuote = () => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Try server-side proxy if available
        try {
          const response = await axios.get('/api/quotes/random');
          if (response.data && (response.data.content || response.data.text || response.data.q)) {
            // Format the quote based on available fields
            const formattedQuote = {
              text: response.data.content || response.data.text || response.data.q,
              source: response.data.author || response.data.a || 'Unknown'
            };
            setQuote(formattedQuote);
            setLoading(false);
            return;
          }
        } catch (proxyError) {
          console.log('Server proxy unavailable, trying direct APIs');
        }

        // Try local static quotes (bypassing API calls)
        const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
        setQuote(randomFallback);

        // Make background API calls to update the quote if possible
        Promise.race([
          getQuoteFromAPI(),
          // Set a timeout to ensure we don't wait too long
          new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout')), 3000))
        ])
          .then(apiQuote => {
            if (apiQuote) {
              setQuote(apiQuote);
            }
          })
          .catch(err => {
            console.log('Background API call failed:', err.message);
            // We already have a fallback quote, so just log the error
          });
      } catch (err) {
        console.error('Failed to fetch quotes:', err);
        // Use a random fallback quote
        const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
        setQuote(randomFallback);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, []);

  // Single function to try all available quote APIs
  const getQuoteFromAPI = async () => {
    try {
      // Try Quotable API through CORS proxy
      const quotableUrl = 'https://api.allorigins.win/raw?url=' + 
        encodeURIComponent('https://api.quotable.io/random');
      
      const response = await axios.get(quotableUrl, { timeout: 2500 });
      if (response.data && response.data.content) {
        return {
          text: response.data.content,
          source: response.data.author || 'Unknown'
        };
      }
    } catch (quotableError) {
      console.log('Quotable API failed:', quotableError.message);
    }

    try {
      // Try an alternative quotes API (type.fit)
      const response = await axios.get('https://type.fit/api/quotes', { timeout: 2500 });
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const randomIndex = Math.floor(Math.random() * response.data.length);
        const randomQuote = response.data[randomIndex];
        return {
          text: randomQuote.text,
          source: randomQuote.author || 'Unknown'
        };
      }
    } catch (altApiError) {
      console.log('Alternative API failed:', altApiError.message);
    }

    // If all APIs fail, return null (which will use our fallback)
    return null;
  };

  if (loading) {
    return <div className="quote-container loading">Loading today's wisdom...</div>;
  }

  if (error) {
    return <div className="quote-container error">Error: {error}</div>;
  }

  if (!quote) {
    return <div className="quote-container empty">No quote available today.</div>;
  }

  return (
    <div className="quote-container">
      <blockquote className="quote-text">
        {quote.text}
      </blockquote>
      <div className="quote-source">— {quote.source}</div>
    </div>
  );
};

export default DailyQuote; 