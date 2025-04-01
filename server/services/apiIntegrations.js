import { QUOTE_CATEGORIES, getCharacterQuote, getCategoryQuote, getRandomQuote } from '../utils/quoteSystem.js';

/**
 * Fetch a quote from Jesus
 */
export const fetchJesusQuote = async () => {
  try {
    return getCharacterQuote(QUOTE_CATEGORIES.SPIRITUAL, 'JESUS');
  } catch (error) {
    console.error('Error fetching Jesus quote:', error);
    return {
      text: "Love your neighbor as yourself.",
      author: "Jesus Christ"
    };
  }
};

/**
 * Fetch a quote from Alexander Pope
 */
export const fetchAlexanderPopeQuote = async () => {
  try {
    return getCharacterQuote(QUOTE_CATEGORIES.WIT, 'POPE');
  } catch (error) {
    console.error('Error fetching Alexander Pope quote:', error);
    return {
      text: "To err is human, to forgive, divine.",
      author: "Alexander Pope"
    };
  }
};

/**
 * Fetch a quote from Oscar Wilde
 */
export const fetchOscarWildeQuote = async () => {
  try {
    return getCharacterQuote(QUOTE_CATEGORIES.WIT, 'WILDE');
  } catch (error) {
    console.error('Error fetching Oscar Wilde quote:', error);
    return {
      text: "Be yourself; everyone else is already taken.",
      author: "Oscar Wilde"
    };
  }
};

/**
 * Fetch a quote from John Muir
 */
export const fetchJohnMuirQuote = async () => {
  try {
    return getCharacterQuote(QUOTE_CATEGORIES.WISDOM, 'MUIR');
  } catch (error) {
    console.error('Error fetching John Muir quote:', error);
    return {
      text: "The mountains are calling and I must go.",
      author: "John Muir"
    };
  }
};

/**
 * Fetch a quote by category
 */
export const fetchQuoteByCategory = async (category) => {
  try {
    return getCategoryQuote(category);
  } catch (error) {
    console.error(`Error fetching quote for category ${category}:`, error);
    return {
      text: "An error occurred fetching the quote",
      author: "System"
    };
  }
};

/**
 * Fetch a quote by author
 */
export const fetchQuoteByAuthor = async (author) => {
  try {
    const authorKey = author.toUpperCase().replace(/\s+/g, '_');
    for (const category of Object.values(QUOTE_CATEGORIES)) {
      const quote = getCharacterQuote(category, authorKey);
      if (quote) {
        return { text: quote, author };
      }
    }
    throw new Error('Author not found');
  } catch (error) {
    console.error(`Error fetching quote for author ${author}:`, error);
    return {
      text: "Quote not found",
      author: author
    };
  }
};

/**
 * Fetch a random quote
 */
export const fetchQuote = async () => {
  try {
    return getRandomQuote();
  } catch (error) {
    console.error('Error fetching random quote:', error);
    return {
      text: "An error occurred fetching the quote",
      author: "System"
    };
  }
};

export const getQuoteForArtifact = async (theme) => {
  // Map theme to category
  const categoryMap = {
    'spiritual': QUOTE_CATEGORIES.SPIRITUAL,
    'literary': QUOTE_CATEGORIES.LITERARY,
    'nature': QUOTE_CATEGORIES.NATURE,
    'philosophy': QUOTE_CATEGORIES.PHILOSOPHY,
    'wisdom': QUOTE_CATEGORIES.WISDOM
  };
  
  const category = categoryMap[theme.toLowerCase()] || QUOTE_CATEGORIES.WISDOM;
  return getCategoryQuote(category);
};

export const getZenQuote = async () => {
  // Get a quote from spiritual or philosophy category
  const category = Math.random() > 0.5 ? QUOTE_CATEGORIES.SPIRITUAL : QUOTE_CATEGORIES.PHILOSOPHY;
  return getCategoryQuote(category);
};

export const getTodayQuote = async () => {
  // Get a random quote from any category
  return getRandomQuote();
}; 