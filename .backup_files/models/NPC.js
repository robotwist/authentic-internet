import mongoose from 'mongoose';
import { 
  fetchWeather, 
  fetchQuote, 
  fetchShakespeareQuote, 
  fetchKeatsQuote, 
  fetchSocratesQuote, 
  fetchMichelangeloQuote,
  fetchOscarWildeQuote,
  fetchAlexanderPopeQuote,
  fetchZeusQuote
} from '../services/apiIntegrations.js';

const NPCSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  sprite: {
    type: String,
    default: '/assets/npcs/default.png'
  },
  world: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'World',
    required: true
  },
  apiType: {
    type: String,
    enum: [
      'weather', 
      'quotes', 
      'shakespeare', 
      'socrates', 
      'michelangelo',
      'oscar_wilde',
      'alexander_pope',
      'zeus'
    ],
    default: 'quotes'
  },
  apiConfig: {
    type: Object,
    required: true
  },
  personality: {
    type: String,
    default: 'friendly'
  },
  dialogue: [{
    type: String,
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Update the updatedAt timestamp before saving
NPCSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to interact with the NPC's API
NPCSchema.methods.interact = async function(prompt) {
  try {
    let response;
    switch (this.apiType) {
      case 'weather':
        response = await fetchWeather(this.apiConfig);
        break;
      case 'quotes':
        response = await fetchQuote(this.apiConfig);
        break;
      case 'shakespeare':
        response = await fetchShakespeareQuote(prompt);
        // Format the response for client consumption
        return {
          response: response.quote,
          source: `${response.author}, ${response.work || 'Various works'}`,
          text: response.quote,
          work: response.work || 'Various works',
          location: response.location || 'Various locations'
        };
      case 'socrates':
        response = await fetchSocratesQuote(prompt);
        // Format the response for client consumption
        return {
          response: response.quote,
          source: `${response.author}, ${response.dialogue || 'Various dialogues'}`,
          text: response.quote,
          dialogue: response.dialogue || 'Various dialogues',
          translator: response.translator || 'Various',
          section: response.section || 'Various sections'
        };
      case 'michelangelo':
        response = await fetchMichelangeloQuote(prompt);
        // Format the response for client consumption
        return {
          response: response.quote,
          source: `${response.author}, ${response.source || 'Various works'}`,
          text: response.quote,
          source: response.source || 'Various works',
          date: response.date || 'Unknown date',
          recipient: response.recipient || null,
          additionalQuotes: response.additionalQuotes || []
        };
      case 'oscar_wilde':
        response = await fetchOscarWildeQuote(prompt);
        // Format the response for client consumption
        return {
          response: response.quote,
          source: `${response.author}, ${response.work || 'Various works'}`,
          text: response.quote,
          work: response.work || 'Various works',
          date: response.date || 'Unknown date',
          additionalQuotes: response.additionalQuotes || []
        };
      case 'alexander_pope':
        response = await fetchAlexanderPopeQuote(prompt);
        // Format the response for client consumption
        return {
          response: response.quote,
          source: `${response.author}, ${response.work || 'Various works'}`,
          text: response.quote,
          work: response.work || 'Various works',
          date: response.date || 'Unknown date',
          additionalQuotes: response.additionalQuotes || []
        };
      case 'zeus':
        response = await fetchZeusQuote(prompt);
        // Format the response for client consumption
        return {
          response: response.quote,
          source: `${response.author}, ${response.source || 'Various works'}`,
          text: response.quote,
          work: response.work || 'Various works',
          date: response.date || 'Unknown date',
          additionalQuotes: response.additionalQuotes || []
        };
      default:
        throw new Error('Invalid API type');
    }
    return response;
  } catch (error) {
    console.error('NPC interaction error:', error);
    throw error;
  }
};

const NPC = mongoose.model('NPC', NPCSchema);
export default NPC; 