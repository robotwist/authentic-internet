/**
 * Fallback quotes for when external APIs are unavailable
 */

// Shakespeare quotes
export const SHAKESPEARE_QUOTES = [
  { 
    text: "To be, or not to be, that is the question.", 
    source: "Hamlet, Act 3, Scene 1 - Shakespeare" 
  },
  { 
    text: "All the world's a stage, and all the men and women merely players.", 
    source: "As You Like It, Act 2, Scene 7 - Shakespeare" 
  },
  { 
    text: "The course of true love never did run smooth.", 
    source: "A Midsummer Night's Dream, Act 1, Scene 1 - Shakespeare" 
  },
  { 
    text: "If music be the food of love, play on.", 
    source: "Twelfth Night, Act 1, Scene 1 - Shakespeare" 
  },
  { 
    text: "What's in a name? That which we call a rose by any other name would smell as sweet.", 
    source: "Romeo and Juliet, Act 2, Scene 2 - Shakespeare" 
  },
  { 
    text: "Some are born great, some achieve greatness, and some have greatness thrust upon them.", 
    source: "Twelfth Night, Act 2, Scene 5 - Shakespeare" 
  },
  { 
    text: "Love all, trust a few, do wrong to none.", 
    source: "All's Well That Ends Well, Act 1, Scene 1 - Shakespeare" 
  },
  { 
    text: "We are such stuff as dreams are made on, and our little life is rounded with a sleep.", 
    source: "The Tempest, Act 4, Scene 1 - Shakespeare" 
  },
  { 
    text: "The fault, dear Brutus, is not in our stars, but in ourselves.", 
    source: "Julius Caesar, Act 1, Scene 2 - Shakespeare" 
  },
  { 
    text: "Brevity is the soul of wit.", 
    source: "Hamlet, Act 2, Scene 2 - Shakespeare" 
  },
  {
    text: "These violent delights have violent ends.",
    source: "Romeo and Juliet, Act 2, Scene 6 - Shakespeare"
  },
  {
    text: "There is nothing either good or bad, but thinking makes it so.",
    source: "Hamlet, Act 2, Scene 2 - Shakespeare"
  },
  {
    text: "Cowards die many times before their deaths; The valiant never taste of death but once.",
    source: "Julius Caesar, Act 2, Scene 2 - Shakespeare"
  },
  {
    text: "Full fathom five thy father lies; Of his bones are coral made; Those are pearls that were his eyes.",
    source: "The Tempest, Act 1, Scene 2 - Shakespeare"
  },
  {
    text: "The better part of valor is discretion.",
    source: "Henry IV Part 1, Act 5, Scene 4 - Shakespeare"
  }
];

// Zen quotes
export const ZEN_QUOTES = [
  {
    text: "When walking, walk. When eating, eat.",
    source: "Zen Proverb"
  },
  {
    text: "Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water.",
    source: "Zen Proverb"
  },
  {
    text: "The obstacle is the path.",
    source: "Zen Proverb"
  },
  {
    text: "If you are unable to find the truth right where you are, where else do you expect to find it?",
    source: "Dogen Zenji"
  },
  {
    text: "The journey of a thousand miles begins with a single step.",
    source: "Lao Tzu"
  },
  {
    text: "When you reach the top of the mountain, keep climbing.",
    source: "Zen Proverb"
  },
  {
    text: "If you want to find the meaning, stop chasing after so many things.",
    source: "Ryokan"
  },
  {
    text: "The quieter you become, the more you can hear.",
    source: "Ram Dass"
  }
];

// Daily quotes
export const DAILY_QUOTES = [
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    source: "Chinese Proverb"
  },
  {
    text: "The mind is everything. What you think you become.",
    source: "Buddha"
  },
  {
    text: "Your time is limited, don't waste it living someone else's life.",
    source: "Steve Jobs"
  },
  {
    text: "Every moment is a fresh beginning.",
    source: "T.S. Eliot"
  },
  {
    text: "Be yourself; everyone else is already taken.",
    source: "Oscar Wilde"
  },
  {
    text: "The unexamined life is not worth living.",
    source: "Socrates"
  },
  {
    text: "Not all those who wander are lost.",
    source: "J.R.R. Tolkien"
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    source: "John Lennon"
  }
];

/**
 * Get a random quote from an array
 * @param {Array} quoteArray - Array of quote objects
 * @returns {Object} A random quote object
 */
export const getRandomQuoteFromArray = (quoteArray) => {
  const randomIndex = Math.floor(Math.random() * quoteArray.length);
  return quoteArray[randomIndex];
};

// Export default fallback function
export default {
  shakespeare: () => getRandomQuoteFromArray(SHAKESPEARE_QUOTES),
  zen: () => getRandomQuoteFromArray(ZEN_QUOTES),
  daily: () => getRandomQuoteFromArray(DAILY_QUOTES)
}; 