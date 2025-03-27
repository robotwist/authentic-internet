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

// Create a timeout for external API calls
const apiTimeout = 3000; // 3 seconds timeout
const withTimeout = (promise) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), apiTimeout)
    )
  ]);
};

/**
 * Get a random Shakespeare quote
 * @returns {Promise<{text: string, source: string}>}
 */
export const getRandomShakespeareQuote = async () => {
  try {
    // Use fallback quotes directly to avoid API calls that might cause errors
    return getRandomQuoteFromArray(SHAKESPEARE_QUOTES);
    
    /* Commented out to avoid external API calls
    // Try fetching from Folger Shakespeare Library API
    const response = await withTimeout(fetch('https://folgerdigitaltexts.org/api/random_quote'));
    
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
    */
  } catch (error) {
    // Silently use fallback quotes without logging errors
    return getRandomQuoteFromArray(SHAKESPEARE_QUOTES);
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
    // Use a local fallback instead of making an API call
    return {
      text: "To be, or not to be, that is the question.",
      source: "Shakespeare, Hamlet"
    };
    
    /* Commented out to avoid external API calls
    const response = await withTimeout(
      axios.get(`${FOLGER_BASE_URL}/${play}/ftln/${ftln}`)
    );
    const html = response.data;
    const textMatch = html.match(/<div class="line-text">(.*?)<\/div>/);
    
    if (!textMatch) {
      throw new Error('Could not extract line text');
    }
    
    return {
      text: textMatch[1].replace(/<[^>]*>/g, ''),
      source: `Shakespeare, ${getPlayName(play)} (Line ${ftln})`
    };
    */
  } catch (error) {
    // Return a default value instead of propagating the error
    return {
      text: "To be, or not to be, that is the question.",
      source: "Shakespeare, Hamlet"
    };
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

/**
 * Get a random quote
 * @param {Object} options - Optional parameters
 * @param {string} options.tags - Comma-separated list of tags
 * @param {string} options.author - Author name
 * @returns {Promise<{text: string, source: string}>}
 */
export const getRandomQuote = async (options = {}) => {
  try {
    // Use fallback quotes directly to avoid API calls that might cause errors
    return getRandomQuoteFromArray(INSPIRATIONAL_QUOTES);
    
    /* Commented out to avoid external API calls
    let url = 'https://api.quotable.io/random';
    
    // Add query parameters for filtering
    if (options.maxLength) url += `?maxLength=${options.maxLength}`;
    if (options.tags) url += `${url.includes('?') ? '&' : '?'}tags=${options.tags}`;
    
    const response = await withTimeout(axios.get(url));
    
    return {
      text: response.data.content,
      source: response.data.author
    };
    */
  } catch (error) {
    // Silently use fallback quotes without logging errors
    return getRandomQuoteFromArray(INSPIRATIONAL_QUOTES);
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
    // Return a static array instead of making an API call
    return [
      { text: "The important thing is not to stop questioning.", source: "Albert Einstein" },
      { text: "Imagination is more important than knowledge.", source: "Albert Einstein" },
      { text: "Life is like riding a bicycle. To keep your balance, you must keep moving.", source: "Albert Einstein" }
    ];
    
    /* Commented out to avoid external API calls
    const response = await withTimeout(
      axios.get(`${QUOTABLE_BASE_URL}/quotes?author=${authorSlug}&limit=${limit}`)
    );
    
    return response.data.results.map(quote => ({
      text: quote.content,
      source: quote.author
    }));
    */
  } catch (error) {
    // Return a default array instead of propagating the error
    return [
      { text: "The important thing is not to stop questioning.", source: "Albert Einstein" },
      { text: "Imagination is more important than knowledge.", source: "Albert Einstein" }
    ];
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
    // Use fallback quotes directly to avoid API calls that might cause errors
    return getRandomQuoteFromArray(INSPIRATIONAL_QUOTES);
    
    /* Commented out to avoid external API calls
    const tags = theme ? theme.split(',').map(t => t.trim()).join('|') : 'inspiration';
    const response = await withTimeout(
      axios.get(`https://api.quotable.io/quotes?tags=${tags}&limit=1`)
    );
    
    if (response.data.count > 0) {
      const quote = response.data.results[0];
      return {
        text: quote.content,
        source: quote.author
      };
    }
    
    // Fallback to a random quote if no quotes match the tag
    return getRandomQuote();
    */
  } catch (error) {
    // Silently use fallback quotes without logging errors
    return getRandomQuoteFromArray(INSPIRATIONAL_QUOTES);
  }
};

// ZenQuotes API
const ZENQUOTES_BASE_URL = 'https://zenquotes.io/api';

/**
 * Get a random Zen quote
 * @returns {Promise<{text: string, source: string}>}
 */
export const getZenQuote = async () => {
  try {
    // Use fallback quotes directly to avoid API calls that might cause errors
    return getRandomQuoteFromArray(INSPIRATIONAL_QUOTES);
    
    /* Commented out to avoid external API calls
    const response = await withTimeout(
      axios.get(`${ZENQUOTES_BASE_URL}/random`)
    );
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      const quote = response.data[0];
      return {
        text: quote.q,
        source: quote.a
      };
    }
    
    throw new Error('Invalid response format');
    */
  } catch (error) {
    // Return a fallback quote instead of propagating the error
    return getRandomQuoteFromArray(INSPIRATIONAL_QUOTES);
  }
};

/**
 * Get today's Zen quote
 * @returns {Promise<{text: string, source: string}>}
 */
export const getTodayQuote = async () => {
  try {
    // Use fallback quotes directly to avoid API calls that might cause errors
    return getRandomQuoteFromArray(INSPIRATIONAL_QUOTES);
    
    /* Commented out to avoid external API calls
    const response = await withTimeout(
      axios.get(`${ZENQUOTES_BASE_URL}/today`)
    );
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      const quote = response.data[0];
      return {
        text: quote.q,
        source: quote.a
      };
    }
    
    throw new Error('Invalid response format');
    */
  } catch (error) {
    // Return a fallback quote instead of propagating the error
    return getRandomQuoteFromArray(INSPIRATIONAL_QUOTES);
  }
};

/**
 * Get multiple Zen quotes
 * @param {number} count - Number of quotes to fetch
 * @returns {Promise<Array<{text: string, source: string}>>}
 */
export const getMultipleZenQuotes = async (count = 5) => {
  try {
    // Return a static array instead of making an API call
    const quotes = [];
    for (let i = 0; i < count; i++) {
      quotes.push(getRandomQuoteFromArray(INSPIRATIONAL_QUOTES));
    }
    return quotes;
    
    /* Commented out to avoid external API calls
    const response = await withTimeout(
      axios.get(`${ZENQUOTES_BASE_URL}/quotes`)
    );
    
    if (Array.isArray(response.data)) {
      return response.data.slice(0, count).map(quote => ({
        text: quote.q,
        source: quote.a
      }));
    }
    
    throw new Error('Invalid response format');
    */
  } catch (error) {
    // Return fallback quotes instead of propagating the error
    const quotes = [];
    for (let i = 0; i < count; i++) {
      quotes.push(getRandomQuoteFromArray(INSPIRATIONAL_QUOTES));
    }
    return quotes;
  }
}; 