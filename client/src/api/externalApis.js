/**
 * External APIs utilities
 * This file contains utility functions for interacting with external APIs
 */

import axios from 'axios';
import { SHAKESPEARE_QUOTES, INSPIRATIONAL_QUOTES, getRandomQuoteFromArray } from '../utils/fallbackQuotes';

// Folger Shakespeare API
const FOLGER_BASE_URL = 'https://www.folgerdigitaltexts.org';

// Shakespeare play codes mapping
const SHAKESPEARE_PLAYS = {
  hamlet: 'Ham',
  macbeth: 'Mac',
  kingLear: 'Lr',
  romeo: 'Rom',
  tempest: 'Tmp',
  midsummer: 'MND',
  othello: 'Oth',
  julius: 'JC',
  merchant: 'MV',
  muchAdo: 'Ado',
};

/**
 * Get a random Shakespeare quote
 * @returns {Promise<{text: string, source: string}>}
 */
export const getRandomShakespeareQuote = async () => {
  try {
    // Try fetching from Folger Shakespeare Library API
    const response = await fetch('https://folgerdigitaltexts.org/api/random_quote');
    
    if (!response.ok) {
      throw new Error('Failed to fetch Shakespeare quote');
    }
    
    const text = await response.text();
    
    // Check if the response is JSON
    if (text.startsWith('{') && text.endsWith('}')) {
      const data = JSON.parse(text);
      
      if (data && data.text && data.source) {
        return {
          text: data.text,
          source: `${data.source} - Shakespeare`
        };
      }
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error("Error fetching Shakespeare quote:", error);
    
    // Use fallback quotes
    const fallbackQuote = getRandomQuoteFromArray(SHAKESPEARE_QUOTES);
    console.log("Using fallback Shakespeare quote:", fallbackQuote);
    return fallbackQuote;
  }
};

/**
 * Get a specific Shakespeare line by FTLN (Folger Through Line Number)
 * @param {string} play - Play code
 * @param {string} ftln - Folger Through Line Number
 * @returns {Promise<{text: string, source: string}>}
 */
export const getShakespeareLine = async (play, ftln) => {
  try {
    const response = await axios.get(`${FOLGER_BASE_URL}/${play}/ftln/${ftln}`);
    const html = response.data;
    const textMatch = html.match(/<div class="line-text">(.*?)<\/div>/);
    
    if (!textMatch) {
      throw new Error('Could not extract line text');
    }
    
    return {
      text: textMatch[1].replace(/<[^>]*>/g, ''),
      source: `Shakespeare, ${getPlayName(play)} (Line ${ftln})`
    };
  } catch (error) {
    console.error('Error fetching Shakespeare line:', error);
    throw error;
  }
};

// Helper function to get full play name from code
function getPlayName(playCode) {
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
}

// Quotable API
const QUOTABLE_BASE_URL = 'https://api.quotable.io';

// Fallback quotes if API fails
const FALLBACK_QUOTES = [
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", source: "Nelson Mandela" },
  { text: "The way to get started is to quit talking and begin doing.", source: "Walt Disney" },
  { text: "Your time is limited, so don't waste it living someone else's life.", source: "Steve Jobs" },
  { text: "If life were predictable it would cease to be life, and be without flavor.", source: "Eleanor Roosevelt" },
  { text: "If you look at what you have in life, you'll always have more.", source: "Oprah Winfrey" },
  { text: "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.", source: "James Cameron" },
  { text: "Life is what happens when you're busy making other plans.", source: "John Lennon" },
  { text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", source: "Mother Teresa" },
  { text: "When you reach the end of your rope, tie a knot in it and hang on.", source: "Franklin D. Roosevelt" },
  { text: "Always remember that you are absolutely unique. Just like everyone else.", source: "Margaret Mead" },
  { text: "Don't judge each day by the harvest you reap but by the seeds that you plant.", source: "Robert Louis Stevenson" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", source: "Eleanor Roosevelt" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", source: "Benjamin Franklin" },
  { text: "The best and most beautiful things in the world cannot be seen or even touched — they must be felt with the heart.", source: "Helen Keller" },
  { text: "It is during our darkest moments that we must focus to see the light.", source: "Aristotle" },
  { text: "Whoever is happy will make others happy too.", source: "Anne Frank" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", source: "Ralph Waldo Emerson" }
];

/**
 * Get a random quote
 * @param {Object} options - Optional parameters
 * @param {string} options.tags - Comma-separated list of tags
 * @param {string} options.author - Author name
 * @returns {Promise<{text: string, source: string}>}
 */
export const getRandomQuote = async (options = {}) => {
  try {
    let url = 'https://api.quotable.io/random';
    
    // Add query parameters for filtering
    if (options.maxLength) url += `?maxLength=${options.maxLength}`;
    if (options.tags) url += `${url.includes('?') ? '&' : '?'}tags=${options.tags}`;
    
    const response = await axios.get(url);
    
    return {
      text: response.data.content,
      source: response.data.author
    };
  } catch (error) {
    console.error('Error fetching random quote:', error);
    
    // Return a fallback quote
    const fallbackQuote = getRandomQuoteFromArray(INSPIRATIONAL_QUOTES);
    return fallbackQuote;
  }
};

/**
 * Get quotes by author
 * @param {string} authorSlug - Author slug (e.g., 'albert-einstein')
 * @param {number} limit - Number of quotes to fetch
 * @returns {Promise<Array<{text: string, source: string}>>}
 */
export const getQuotesByAuthor = async (authorSlug, limit = 3) => {
  try {
    const response = await axios.get(`${QUOTABLE_BASE_URL}/quotes?author=${authorSlug}&limit=${limit}`);
    
    return response.data.results.map(quote => ({
      text: quote.content,
      source: quote.author
    }));
  } catch (error) {
    console.error('Error fetching quotes by author:', error);
    throw error;
  }
};

/**
 * Search for authors
 * @param {string} query - Search query
 * @returns {Promise<Array<{name: string, slug: string, bio: string}>>}
 */
export const searchAuthors = async (query) => {
  try {
    const response = await axios.get(`${QUOTABLE_BASE_URL}/search/authors?query=${encodeURIComponent(query)}`);
    
    return response.data.results.map(author => ({
      name: author.name,
      slug: author.slug,
      bio: author.bio || ''
    }));
  } catch (error) {
    console.error('Error searching authors:', error);
    throw error;
  }
};

/**
 * Get available tags
 * @returns {Promise<Array<{name: string, count: number}>>}
 */
export const getTags = async () => {
  try {
    const response = await axios.get(`${QUOTABLE_BASE_URL}/tags`);
    
    return response.data.map(tag => ({
      name: tag.name,
      count: tag.quoteCount
    }));
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

/**
 * Get a quote for specific artifact content based on author or theme
 * @param {string} theme - Theme or concept for the quote
 * @returns {Promise<{text: string, source: string}>}
 */
export const getQuoteForArtifact = async (theme) => {
  try {
    const tags = theme ? theme.split(',').map(t => t.trim()).join('|') : 'inspiration';
    const response = await axios.get(`https://api.quotable.io/quotes?tags=${tags}&limit=1`);
    
    if (response.data.count > 0) {
      const quote = response.data.results[0];
      return {
        text: quote.content,
        source: quote.author
      };
    }
    
    // Fallback to a random quote if no quotes match the tag
    return getRandomQuote();
  } catch (error) {
    console.error('Error getting quote for artifact:', error);
    
    // Return a fallback quote
    const fallbackQuote = getRandomQuoteFromArray(INSPIRATIONAL_QUOTES);
    return fallbackQuote;
  }
};

// ZenQuotes API
const ZENQUOTES_BASE_URL = 'https://zenquotes.io/api';

// Fallback zen quotes if API fails
const FALLBACK_ZEN_QUOTES = [
  { text: "Be yourself; everyone else is already taken.", source: "Oscar Wilde" },
  { text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", source: "Albert Einstein" },
  { text: "Be the change that you wish to see in the world.", source: "Mahatma Gandhi" },
  { text: "No one can make you feel inferior without your consent.", source: "Eleanor Roosevelt" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", source: "Mahatma Gandhi" },
  { text: "Darkness cannot drive out darkness: only light can do that. Hate cannot drive out hate: only love can do that.", source: "Martin Luther King Jr." },
  { text: "Without music, life would be a mistake.", source: "Friedrich Nietzsche" },
  { text: "We accept the love we think we deserve.", source: "Stephen Chbosky" },
  { text: "Imperfection is beauty, madness is genius and it's better to be absolutely ridiculous than absolutely boring.", source: "Marilyn Monroe" },
  { text: "There are only two ways to live your life. One is as though nothing is a miracle. The other is as though everything is a miracle.", source: "Albert Einstein" }
];

/**
 * Get a random quote from ZenQuotes
 * @returns {Promise<{text: string, source: string}>}
 */
export const getZenQuote = async () => {
  try {
    // Create server-side proxy URL to avoid CORS issues
    const proxyUrl = `/api/proxy?url=${encodeURIComponent('https://zenquotes.io/api/random')}`;
    
    // First try using the proxy
    try {
      const response = await axios.get(proxyUrl);
      if (response.data && response.data.length > 0) {
        return {
          text: response.data[0].q,
          source: response.data[0].a
        };
      }
    } catch (proxyError) {
      console.log("Proxy failed, falling back to direct API call");
    }
    
    // Direct call as fallback (might fail due to CORS)
    const response = await axios.get('https://zenquotes.io/api/random');
    
    if (response.data && response.data.length > 0) {
      return {
        text: response.data[0].q,
        source: response.data[0].a
      };
    }
    
    throw new Error('Invalid ZenQuote response format');
  } catch (error) {
    console.error('Error fetching ZenQuote:', error);
    
    // Return a fallback quote
    const fallbackQuote = getRandomQuoteFromArray(INSPIRATIONAL_QUOTES);
    return fallbackQuote;
  }
};

/**
 * Get today's quote from ZenQuotes
 * @returns {Promise<{text: string, source: string}>}
 */
export const getTodayQuote = async () => {
  try {
    const response = await axios.get(`${ZENQUOTES_BASE_URL}/today`);
    
    if (response.data && response.data.length > 0) {
      const quote = response.data[0];
      return {
        text: quote.q,
        source: quote.a
      };
    }
    
    throw new Error('No quote returned from ZenQuotes API');
  } catch (error) {
    console.error('Error fetching today\'s quote:', error);
    // If today's quote fails, try a random ZenQuote
    try {
      return await getZenQuote();
    } catch (zenError) {
      // If that fails too, try Quotable
      try {
        return await getRandomQuote();
      } catch (quotableError) {
        // Last resort - use a fallback
        return {
          text: "Today is a new beginning, full of possibilities and opportunities.",
          source: "Anonymous"
        };
      }
    }
  }
};

/**
 * Get multiple quotes from ZenQuotes
 * @param {number} count - Number of quotes to fetch (1-50)
 * @returns {Promise<Array<{text: string, source: string}>>}
 */
export const getMultipleZenQuotes = async (count = 5) => {
  // Limit count to API restrictions (1-50)
  const limitedCount = Math.min(Math.max(count, 1), 50);
  
  try {
    const response = await axios.get(`${ZENQUOTES_BASE_URL}/quotes`);
    
    if (response.data && response.data.length > 0) {
      return response.data.slice(0, limitedCount).map(quote => ({
        text: quote.q,
        source: quote.a
      }));
    }
    
    throw new Error('No quotes returned from ZenQuotes API');
  } catch (error) {
    console.error('Error fetching multiple quotes:', error);
    // Return at least one fallback quote
    return [{
      text: "Simplicity is the ultimate sophistication.",
      source: "Leonardo da Vinci"
    }];
  }
}; 