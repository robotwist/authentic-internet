import mongoose from 'mongoose';
import { 
  fetchQuote,
  fetchJesusQuote,
  fetchOscarWildeQuote,
  fetchAlexanderPopeQuote,
  fetchJohnMuirQuote,
  fetchQuoteByAuthor,
  fetchQuoteByCategory
} from '../services/apiIntegrations.js';

const NPCSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['WRITER', 'PHILOSOPHER', 'ARTIST', 'SCIENTIST', 'EXPLORER', 'MENTOR', 'GUIDE', 'SAGE', 'POET', 'NATURALIST']
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  area: {
    type: String,
    required: true,
    default: 'Overworld'
  },
  dialogue: [{
    type: String,
    required: true
  }],
  quoteCache: {
    quotes: [String],
    lastUpdated: Date
  }
});

// Method to interact with the NPC
NPCSchema.methods.interact = async function(prompt) {
  try {
    let response;
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

    return {
      text: response.text,
      author: response.author,
      type: this.type
    };
  } catch (error) {
    console.error('NPC interaction error:', error);
    return {
      text: this.dialogue[0],
      author: this.name,
      type: this.type
    };
  }
};

// Method to get fresh quotes for the NPC
NPCSchema.methods.refreshQuotes = async function() {
  try {
    let quotes = [];
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    // Check if cache is valid
    if (this.quoteCache?.lastUpdated && 
        (Date.now() - this.quoteCache.lastUpdated) < CACHE_DURATION) {
      return this.quoteCache.quotes;
    }

    // Get quotes based on NPC type
    switch(this.name) {
      case 'Alexander Pope':
        const popeQuote = await fetchAlexanderPopeQuote();
        quotes = [popeQuote.text];
        break;
      case 'Jesus Christ':
        const spiritualQuotes = await fetchQuoteByCategory('spiritual');
        quotes = [spiritualQuotes.text];
        break;
      default:
        const authorQuotes = await fetchQuoteByAuthor(this.name);
        quotes = [authorQuotes.text];
    }

    // Update cache
    this.quoteCache = {
      quotes,
      lastUpdated: new Date()
    };
    await this.save();

    return quotes;
  } catch (error) {
    console.error(`Error refreshing quotes for NPC ${this.name}:`, error);
    // Fallback to default dialogue if quote fetching fails
    return this.dialogue;
  }
};

const NPC = mongoose.model('NPC', NPCSchema);
export default NPC; 