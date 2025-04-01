/**
 * Core Quote System
 * Centralized management of all game quotes
 */

import { LITERARY_QUOTES, WISDOM_QUOTES, NATURE_QUOTES, INSPIRATIONAL_QUOTES } from './fallbackQuotes.js';

export const QUOTE_CATEGORIES = {
  SPIRITUAL: 'spiritual',
  LITERARY: 'literary',
  WIT: 'wit',
  WISDOM: 'wisdom',
  NATURE: 'nature',
  INSPIRATION: 'inspiration'
};

export const CORE_QUOTES = {
  [QUOTE_CATEGORIES.SPIRITUAL]: {
    JESUS: {
      name: "Jesus Christ",
      type: "spiritual_teacher",
      quotes: [
        "Love your neighbor as yourself.",
        "Let your light shine before others.",
        "Seek first the kingdom of God and his righteousness.",
        "The truth will set you free.",
        "Blessed are the peacemakers, for they will be called children of God.",
        "Do unto others as you would have them do unto you.",
        "Ask and it will be given to you; seek and you will find.",
        "For where your treasure is, there your heart will be also.",
        "Consider the lilies of the field, how they grow; they toil not, neither do they spin.",
        "Judge not, that ye be not judged.",
        "But I say unto you, Love your enemies, bless them that curse you.",
        "I am the way, the truth, and the life."
      ]
    }
  },
  [QUOTE_CATEGORIES.LITERARY]: {
    HEMINGWAY: {
      name: "Ernest Hemingway",
      type: "writer",
      quotes: [
        "Write hard and clear about what hurts.",
        "The world breaks everyone, and afterward, some are strong at the broken places.",
        "There is nothing to writing. All you do is sit down at a typewriter and bleed.",
        "All you have to do is write one true sentence.",
        "The first draft of anything is shit.",
        "Happiness in intelligent people is the rarest thing I know.",
        "The best way to find out if you can trust somebody is to trust them.",
        "We are all broken—that's how the light gets in.",
        "There is no friend as loyal as a book.",
        "Always do sober what you said you'd do drunk. That will teach you to keep your mouth shut.",
        "The most painful thing is losing yourself in the process of loving someone too much.",
        "Every day above earth is a good day."
      ]
    },
    TOLKIEN: {
      name: "J.R.R. Tolkien",
      type: "writer",
      quotes: [
        "Not all those who wander are lost.",
        "All we have to decide is what to do with the time that is given us.",
        "Even the smallest person can change the course of the future.",
        "It's a dangerous business, going out your door.",
        "Faithless is he that says farewell when the road darkens.",
        "There is some good in this world, and it's worth fighting for.",
        "The Road goes ever on and on down from the door where it began.",
        "Little by little, one travels far.",
        "Courage is found in unlikely places.",
        "It's the job that's never started as takes longest to finish.",
        "All's well that ends better.",
        "If more of us valued food and cheer and song above hoarded gold, it would be a merrier world."
      ]
    }
  },
  [QUOTE_CATEGORIES.WIT]: {
    WILDE: {
      name: "Oscar Wilde",
      type: "wit",
      quotes: [
        "Be yourself; everyone else is already taken.",
        "I can resist everything except temptation.",
        "We are all in the gutter, but some of us are looking at the stars.",
        "Life is far too important a thing ever to talk seriously about.",
        "A cynic is a man who knows the price of everything and the value of nothing.",
        "Experience is merely the name men give to their mistakes.",
        "The truth is rarely pure and never simple.",
        "To live is the rarest thing in the world. Most people exist, that is all.",
        "I have nothing to declare except my genius.",
        "Always forgive your enemies; nothing annoys them so much.",
        "Anyone who lives within their means suffers from a lack of imagination.",
        "Everything in moderation, including moderation."
      ]
    },
    POPE: {
      name: "Alexander Pope",
      type: "wit",
      quotes: [
        "To err is human, to forgive, divine.",
        "Fools rush in where angels fear to tread.",
        "Hope springs eternal in the human breast.",
        "A little learning is a dangerous thing.",
        "Good nature and good sense must ever join.",
        "What Reason weaves, by Passion is undone.",
        "Blessed is he who expects nothing, for he shall never be disappointed.",
        "Words are like leaves; and where they most abound, much fruit of sense beneath is rarely found.",
        "The bookful blockhead, ignorantly read, with loads of learned lumber in his head.",
        "True ease in writing comes from art, not chance, as those move easiest who have learned to dance.",
        "Honor and shame from no condition rise; act well your part, there all the honor lies.",
        "An honest man's the noblest work of God."
      ]
    }
  },
  [QUOTE_CATEGORIES.WISDOM]: {
    MUIR: {
      name: "John Muir",
      type: "naturalist",
      quotes: [
        "The mountains are calling and I must go.",
        "In every walk with nature one receives far more than he seeks.",
        "The clearest way into the Universe is through a forest wilderness.",
        "When one tugs at a single thing in nature, he finds it attached to the rest of the world.",
        "Between every two pines is a doorway to a new world.",
        "The power of imagination makes us infinite.",
        "The sun shines not on us but in us.",
        "Going to the mountains is going home.",
        "Of all the paths you take in life, make sure a few of them are dirt.",
        "The world is big and I want to have a good look at it before it gets dark.",
        "How glorious a greeting the sun gives the mountains!",
        "Nature is ever at work building and pulling down, creating and destroying, keeping everything whirling and flowing."
      ]
    }
  }
};

/**
 * Get a random quote from a specific character
 */
export const getCharacterQuote = (category, character) => {
  const quotes = CORE_QUOTES[category]?.[character]?.quotes || [];
  return quotes[Math.floor(Math.random() * quotes.length)];
};

/**
 * Get a random quote from a specific category
 */
export const getCategoryQuote = (category) => {
  let quotes;
  switch (category?.toLowerCase()) {
    case QUOTE_CATEGORIES.WISDOM.toLowerCase():
      quotes = WISDOM_QUOTES;
      break;
    case QUOTE_CATEGORIES.LITERARY.toLowerCase():
      quotes = LITERARY_QUOTES;
      break;
    case QUOTE_CATEGORIES.NATURE.toLowerCase():
      quotes = NATURE_QUOTES;
      break;
    case QUOTE_CATEGORIES.INSPIRATION.toLowerCase():
      quotes = INSPIRATIONAL_QUOTES;
      break;
    default:
      quotes = LITERARY_QUOTES;
  }
  
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

/**
 * Get a completely random quote
 */
export const getRandomQuote = () => {
  const allQuotes = [
    ...LITERARY_QUOTES,
    ...WISDOM_QUOTES,
    ...NATURE_QUOTES,
    ...INSPIRATIONAL_QUOTES
  ];
  const randomIndex = Math.floor(Math.random() * allQuotes.length);
  return allQuotes[randomIndex];
};

/**
 * Get all available categories
 */
export const getCategories = () => Object.values(QUOTE_CATEGORIES); 