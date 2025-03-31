import { QUOTE_CATEGORIES, getCharacterQuote, getCategoryQuote, getRandomQuote } from '../../client/src/utils/quoteSystem.mjs';
import { circuitBreaker } from '../utils/circuitBreaker.mjs';

// Wrap quote fetching in circuit breaker
const quoteBreaker = circuitBreaker.create('quotes', {
  failureThreshold: 3,
  resetTimeout: 30000
});

/**
 * Base quote fetching function with error handling and circuit breaking
 */
const fetchQuoteWithBreaker = async (fetcher, fallback) => {
  return quoteBreaker.executeFunction(
    async () => {
      try {
        const result = await fetcher();
        if (!result || !result.text) {
          throw new Error('Invalid quote format');
        }
        return result;
      } catch (error) {
        console.error('Quote fetch error:', error);
        return fallback;
      }
    },
    () => fallback
  );
};

/**
 * Fetch a quote from Jesus
 */
export const fetchJesusQuote = async () => {
  const fallback = {
    text: "Love your neighbor as yourself.",
    author: "Jesus Christ",
    type: "spiritual"
  };
  
  return fetchQuoteWithBreaker(
    () => getCharacterQuote(QUOTE_CATEGORIES.SPIRITUAL, 'JESUS'),
    fallback
  );
};

/**
 * Fetch a quote from Alexander Pope
 */
export const fetchAlexanderPopeQuote = async () => {
  const fallback = {
    text: "To err is human, to forgive, divine.",
    author: "Alexander Pope",
    type: "wit"
  };
  
  return fetchQuoteWithBreaker(
    () => getCharacterQuote(QUOTE_CATEGORIES.WIT, 'POPE'),
    fallback
  );
};

/**
 * Fetch a quote from Oscar Wilde
 */
export const fetchOscarWildeQuote = async () => {
  const fallback = {
    text: "Be yourself; everyone else is already taken.",
    author: "Oscar Wilde",
    type: "wit"
  };
  
  return fetchQuoteWithBreaker(
    () => getCharacterQuote(QUOTE_CATEGORIES.WIT, 'WILDE'),
    fallback
  );
};

/**
 * Fetch a quote from John Muir
 */
export const fetchJohnMuirQuote = async () => {
  const fallback = {
    text: "The mountains are calling and I must go.",
    author: "John Muir",
    type: "wisdom"
  };
  
  return fetchQuoteWithBreaker(
    () => getCharacterQuote(QUOTE_CATEGORIES.WISDOM, 'MUIR'),
    fallback
  );
};

/**
 * Fetch a quote by category with validation
 */
export const fetchQuoteByCategory = async (category) => {
  const fallback = {
    text: "Wisdom comes from experience, and experience comes from mistakes.",
    author: "Unknown",
    type: category
  };

  if (!Object.values(QUOTE_CATEGORIES).includes(category)) {
    return fallback;
  }

  return fetchQuoteWithBreaker(
    () => getCategoryQuote(category),
    fallback
  );
};

/**
 * Fetch a quote by author with validation
 */
export const fetchQuoteByAuthor = async (author) => {
  if (!author || typeof author !== 'string') {
    return {
      text: "Invalid author request",
      author: "System",
      type: "error"
    };
  }

  const fallback = {
    text: `No quote found for ${author}`,
    author: author,
    type: "unknown"
  };

  return fetchQuoteWithBreaker(
    async () => {
      const authorKey = author.toUpperCase().replace(/\s+/g, '_');
      for (const category of Object.values(QUOTE_CATEGORIES)) {
        const quote = await getCharacterQuote(category, authorKey);
        if (quote) {
          return { text: quote, author, type: category };
        }
      }
      throw new Error('Author not found');
    },
    fallback
  );
};

/**
 * Fetch a random quote with enhanced metadata
 */
export const fetchQuote = async () => {
  const fallback = {
    text: "Knowledge speaks, but wisdom listens.",
    author: "System",
    type: "wisdom"
  };

  return fetchQuoteWithBreaker(
    () => getRandomQuote(),
    fallback
  );
}; 