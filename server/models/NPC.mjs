import mongoose from 'mongoose';
import { 
  fetchQuote,
  fetchJesusQuote,
  fetchOscarWildeQuote,
  fetchAlexanderPopeQuote,
  fetchJohnMuirQuote,
  fetchQuoteByAuthor,
  fetchQuoteByCategory
} from '../services/apiIntegrations.mjs';

const VALID_TYPES = [
  'WRITER',
  'PHILOSOPHER',
  'ARTIST',
  'SCIENTIST',
  'EXPLORER',
  'MENTOR',
  'GUIDE',
  'SAGE',
  'POET',
  'NATURALIST'
];

const VALID_AREAS = [
  'Overworld',
  'Desert',
  'Mountain',
  'Forest',
  'City',
  'Temple'
];

const NPCSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: {
      values: VALID_TYPES,
      message: '{VALUE} is not a valid NPC type'
    }
  },
  position: {
    x: { 
      type: Number, 
      required: [true, 'X position is required'],
      min: [0, 'X position cannot be negative']
    },
    y: { 
      type: Number, 
      required: [true, 'Y position is required'],
      min: [0, 'Y position cannot be negative']
    }
  },
  area: {
    type: String,
    required: [true, 'Area is required'],
    enum: {
      values: VALID_AREAS,
      message: '{VALUE} is not a valid area'
    },
    default: 'Overworld'
  },
  dialogue: [{
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return v.length >= 10 && v.length <= 500;
      },
      message: 'Dialogue must be between 10 and 500 characters'
    }
  }],
  quoteCache: {
    quotes: [String],
    lastUpdated: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware to ensure default dialogue
NPCSchema.pre('save', function(next) {
  if (!this.dialogue || this.dialogue.length === 0) {
    this.dialogue = ['Greetings, traveler! I am here to share wisdom with you.'];
  }
  next();
});

// Method to interact with the NPC
NPCSchema.methods.interact = async function(prompt) {
  try {
    let response;
    
    // Get cached quote if available
    const cachedQuote = await this.getQuoteFromCache();
    if (cachedQuote) {
      return {
        text: cachedQuote,
        author: this.name,
        type: this.type,
        source: 'cache'
      };
    }

    // Fetch fresh quote based on NPC type
    switch (this.type) {
      case 'WRITER':
        switch (this.name) {
          case 'Oscar Wilde':
            response = await fetchOscarWildeQuote();
            break;
          case 'Alexander Pope':
            response = await fetchAlexanderPopeQuote();
            break;
          default:
            response = await fetchQuoteByAuthor(this.name);
        }
        break;
      case 'SAGE':
        if (this.name === 'Jesus Christ') {
          response = await fetchJesusQuote();
        } else {
          response = await fetchQuoteByCategory('spiritual');
        }
        break;
      case 'NATURALIST':
        if (this.name === 'John Muir') {
          response = await fetchJohnMuirQuote();
        } else {
          response = await fetchQuoteByCategory('nature');
        }
        break;
      default:
        response = await fetchQuote();
    }

    // Cache the new quote
    await this.cacheQuote(response.text);

    return {
      text: response.text,
      author: response.author || this.name,
      type: this.type,
      source: 'api'
    };
  } catch (error) {
    console.error('NPC interaction error:', error);
    return {
      text: this.dialogue[0],
      author: this.name,
      type: this.type,
      source: 'fallback'
    };
  }
};

// Method to get quote from cache
NPCSchema.methods.getQuoteFromCache = async function() {
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  if (this.quoteCache?.lastUpdated && 
      (Date.now() - this.quoteCache.lastUpdated) < CACHE_DURATION &&
      this.quoteCache.quotes?.length > 0) {
    return this.quoteCache.quotes[0];
  }
  return null;
};

// Method to cache a quote
NPCSchema.methods.cacheQuote = async function(quote) {
  try {
    this.quoteCache = {
      quotes: [quote],
      lastUpdated: new Date()
    };
    await this.save();
  } catch (error) {
    console.error('Error caching quote:', error);
  }
};

// Virtual for full position
NPCSchema.virtual('fullPosition').get(function() {
  return `${this.area} (${this.position.x}, ${this.position.y})`;
});

// Index for efficient queries
NPCSchema.index({ area: 1, type: 1 });
NPCSchema.index({ name: 1 });

const NPC = mongoose.model('NPC', NPCSchema);
export default NPC; 