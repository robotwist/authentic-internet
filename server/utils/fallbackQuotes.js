/**
 * Internal quote system with fallback quotes
 */

export const LITERARY_QUOTES = [
  {
    text: "Write hard and clear about what hurts.",
    author: "Ernest Hemingway",
    type: "literary"
  },
  {
    text: "The world breaks everyone, and afterward, some are strong at the broken places.",
    author: "Ernest Hemingway",
    type: "literary"
  },
  {
    text: "Not all those who wander are lost.",
    author: "J.R.R. Tolkien",
    type: "literary"
  },
  {
    text: "All we have to decide is what to do with the time that is given us.",
    author: "J.R.R. Tolkien",
    type: "literary"
  },
  {
    text: "Two roads diverged in a wood, and I took the one less traveled by.",
    author: "Robert Frost",
    type: "literary"
  }
];

export const WISDOM_QUOTES = [
  {
    text: "The best way out is always through.",
    author: "Robert Frost",
    type: "wisdom"
  },
  {
    text: "To err is human, to forgive, divine.",
    author: "Alexander Pope",
    type: "wisdom"
  },
  {
    text: "Life is not a problem to be solved, but a reality to be experienced.",
    author: "Søren Kierkegaard",
    type: "wisdom"
  },
  {
    text: "Be yourself; everyone else is already taken.",
    author: "Oscar Wilde",
    type: "wisdom"
  },
  {
    text: "The journey of a thousand miles begins with a single step.",
    author: "Lao Tzu",
    type: "wisdom"
  }
];

export const NATURE_QUOTES = [
  {
    text: "The mountains are calling and I must go.",
    author: "John Muir",
    type: "nature"
  },
  {
    text: "In every walk with nature one receives far more than he seeks.",
    author: "John Muir",
    type: "nature"
  },
  {
    text: "The clearest way into the Universe is through a forest wilderness.",
    author: "John Muir",
    type: "nature"
  },
  {
    text: "Nature always wears the colors of the spirit.",
    author: "Ralph Waldo Emerson",
    type: "nature"
  },
  {
    text: "Adopt the pace of nature: her secret is patience.",
    author: "Ralph Waldo Emerson",
    type: "nature"
  }
];

export const INSPIRATIONAL_QUOTES = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    type: "inspiration"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    type: "inspiration"
  },
  {
    text: "What you seek is seeking you.",
    author: "Rumi",
    type: "inspiration"
  },
  {
    text: "Everything you can imagine is real.",
    author: "Pablo Picasso",
    type: "inspiration"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    type: "inspiration"
  }
];

/**
 * Get a random quote from a specific category
 * @param {string} type - The category of quote to get
 * @returns {Object} A random quote from the specified category
 */
export const getRandomQuote = (type = 'literary') => {
  const quotes = {
    literary: LITERARY_QUOTES,
    wisdom: WISDOM_QUOTES,
    nature: NATURE_QUOTES,
    inspiration: INSPIRATIONAL_QUOTES
  };

  const quoteList = quotes[type] || LITERARY_QUOTES;
  const randomIndex = Math.floor(Math.random() * quoteList.length);
  return quoteList[randomIndex];
};

/**
 * Get a random quote from any category
 * @returns {Object} A random quote from any category
 */
export const getRandomQuoteFromAny = () => {
  const allQuotes = [...LITERARY_QUOTES, ...WISDOM_QUOTES];
  const randomIndex = Math.floor(Math.random() * allQuotes.length);
  return allQuotes[randomIndex];
}; 