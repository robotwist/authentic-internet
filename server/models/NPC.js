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
    enum: [
      'WRITER', 'PHILOSOPHER', 'ARTIST', 'SCIENTIST', 'EXPLORER', 
      'MENTOR', 'GUIDE', 'SAGE', 'POET', 'NATURALIST',
      'shakespeare', 'john_muir', 'ada_lovelace', 'lord_byron', 
      'oscar_wilde', 'alexander_pope', 'zeus', 'jesus', 'michelangelo'
    ]
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
  
  // Enhanced Memory System
  memory: {
    conversationHistory: [{
      playerId: { type: String, required: true },
      topics: [String],
      sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
      lastInteraction: { type: Date, default: Date.now },
      interactionCount: { type: Number, default: 0 },
      relationship: { 
        type: String, 
        enum: ['stranger', 'acquaintance', 'friend', 'confidant', 'mentor_student'], 
        default: 'stranger' 
      },
      playerProgress: {
        level: { type: Number, default: 1 },
        artifactsDiscussed: [String],
        questsGiven: [String],
        secretsRevealed: [String],
        personalDetails: [String]
      }
    }],
    globalKnowledge: {
      totalInteractions: { type: Number, default: 0 },
      popularTopics: [String],
      weatherConditions: String,
      timeOfDay: String,
      currentSeason: String
    }
  },
  
  // Personality System
  personality: {
    traits: {
      wit: { type: Number, min: 0, max: 100, default: 50 },
      wisdom: { type: Number, min: 0, max: 100, default: 50 },
      curiosity: { type: Number, min: 0, max: 100, default: 50 },
      passion: { type: Number, min: 0, max: 100, default: 50 },
      melancholy: { type: Number, min: 0, max: 100, default: 50 },
      enthusiasm: { type: Number, min: 0, max: 100, default: 50 },
      advocacy: { type: Number, min: 0, max: 100, default: 50 },
      adventure: { type: Number, min: 0, max: 100, default: 50 },
      humor: { type: Number, min: 0, max: 100, default: 50 },
      patience: { type: Number, min: 0, max: 100, default: 50 }
    },
    adaptiveDialogue: {
      greetings: [String],
      farewells: [String],
      questOffers: [String],
      wisdom: [String],
      personalStories: [String]
    },
    contextualResponses: {
      weatherResponses: {
        sunny: [String],
        rainy: [String],
        cloudy: [String],
        snowy: [String]
      },
      locationResponses: {
        overworld: [String],
        yosemite: [String],
        desert: [String],
        mountains: [String],
        dungeon: [String]
      },
      relationshipResponses: {
        stranger: [String],
        acquaintance: [String],
        friend: [String],
        confidant: [String]
      }
    }
  },
  
  // Quest System
  quests: [{
    id: String,
    title: String,
    description: String,
    stages: [{
      task: String,
      dialogue: String,
      completed: { type: Boolean, default: false },
      reward: {
        exp: Number,
        item: String,
        ability: String
      }
    }],
    prerequisites: [String],
    isActive: { type: Boolean, default: true },
    completedBy: [String]
  }],
  
  quoteCache: {
    quotes: [String],
    lastUpdated: Date
  }
}, {
  timestamps: true
});

// Method to get or create player memory
NPCSchema.methods.getPlayerMemory = function(playerId) {
  let playerMemory = this.memory.conversationHistory.find(
    conv => conv.playerId === playerId
  );
  
  if (!playerMemory) {
    playerMemory = {
      playerId,
      topics: [],
      sentiment: 'neutral',
      lastInteraction: new Date(),
      interactionCount: 0,
      relationship: 'stranger',
      playerProgress: {
        level: 1,
        artifactsDiscussed: [],
        questsGiven: [],
        secretsRevealed: [],
        personalDetails: []
      }
    };
    this.memory.conversationHistory.push(playerMemory);
  }
  
  return playerMemory;
};

// Method to update relationship based on interactions
NPCSchema.methods.updateRelationship = function(playerId) {
  const playerMemory = this.getPlayerMemory(playerId);
  const interactions = playerMemory.interactionCount;
  
  if (interactions >= 20 && playerMemory.sentiment === 'positive') {
    playerMemory.relationship = 'confidant';
  } else if (interactions >= 10) {
    playerMemory.relationship = 'friend';
  } else if (interactions >= 3) {
    playerMemory.relationship = 'acquaintance';
  }
  
  this.markModified('memory');
};

// Enhanced interaction method with memory and personality
NPCSchema.methods.interact = async function(prompt, playerId, context = {}) {
  try {
    const playerMemory = this.getPlayerMemory(playerId);
    playerMemory.interactionCount++;
    playerMemory.lastInteraction = new Date();
    
    // Update global knowledge
    this.memory.globalKnowledge.totalInteractions++;
    if (context.weather) this.memory.globalKnowledge.weatherConditions = context.weather;
    if (context.timeOfDay) this.memory.globalKnowledge.timeOfDay = context.timeOfDay;
    
    this.updateRelationship(playerId);
    
    let response;
    
    // Get response based on NPC type and personality
    switch (this.type) {
      case 'shakespeare':
        response = await this.getShakespeareResponse(prompt, playerMemory, context);
        break;
      case 'john_muir':
        response = await this.getJohnMuirResponse(prompt, playerMemory, context);
        break;
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
          response = await this.getJohnMuirResponse(prompt, playerMemory, context);
        } else {
          response = await fetchQuoteByCategory('nature');
        }
        break;
      default:
        response = await fetchQuote();
    }

    // Add topic to memory
    if (prompt) {
      playerMemory.topics.push(prompt.substring(0, 50));
      // Keep only last 10 topics
      if (playerMemory.topics.length > 10) {
        playerMemory.topics = playerMemory.topics.slice(-10);
      }
    }
    
    this.markModified('memory');
    await this.save();

    return {
      text: response.text || response,
      author: response.author || this.name,
      type: this.type,
      relationship: playerMemory.relationship,
      context: {
        interactionCount: playerMemory.interactionCount,
        topics: playerMemory.topics
      }
    };
  } catch (error) {
    console.error('NPC interaction error:', error);
    return {
      text: this.dialogue[0],
      author: this.name,
      type: this.type,
      relationship: 'stranger'
    };
  }
};

// Shakespeare-specific response method
NPCSchema.methods.getShakespeareResponse = async function(prompt, playerMemory, context) {
  const relationship = playerMemory.relationship;
  const wit = this.personality?.traits?.wit || 95;
  const melancholy = this.personality?.traits?.melancholy || 70;
  
  // Contextual greetings based on relationship
  const greetings = {
    stranger: "Good morrow, traveler. What brings thee to my humble corner of this digital realm?",
    acquaintance: "Ah, we meet again! How fares thy quest for knowledge and truth?",
    friend: "Welcome back, dear friend! I've been pondering our last conversation...",
    confidant: "My trusted companion! I have thoughts to share that few would understand..."
  };
  
  // Weather-based responses
  if (context.weather === 'sunny' && wit > 80) {
    return {
      text: "What a day! 'But my heart remains dark as midnight, despite the sun's bright blessing.' (Original composition in the style of the Bard)",
      author: "William Shakespeare"
    };
  }
  
  // Relationship-specific responses
  if (relationship === 'stranger') {
    return {
      text: greetings.stranger,
      author: "William Shakespeare"
    };
  }
  
  // Default to fetching a quote with relationship context
  try {
    const quote = await fetchQuoteByAuthor('William Shakespeare');
    return {
      text: `${greetings[relationship]} "${quote.text}"`,
      author: "William Shakespeare"
    };
  } catch (error) {
    return {
      text: greetings[relationship],
      author: "William Shakespeare"
    };
  }
};

// John Muir-specific response method
NPCSchema.methods.getJohnMuirResponse = async function(prompt, playerMemory, context) {
  const relationship = playerMemory.relationship;
  const enthusiasm = this.personality?.traits?.enthusiasm || 95;
  const advocacy = this.personality?.traits?.advocacy || 85;
  
  // Location-based responses
  const locationResponses = {
    yosemite: "Behold! You stand in one of Earth's grandest cathedrals!",
    desert: "The desert speaks in whispers - you must learn to listen carefully.",
    mountains: "The mountains are calling! Can you hear their ancient wisdom?",
    overworld: "Every step in nature is a step toward understanding our place in the grand design."
  };
  
  // Weather-based responses
  const weatherResponses = {
    sunny: "What a glorious day! Perfect for exploring the wilderness that awaits!",
    rainy: "Even in storms, nature shows us her power and beauty. Listen to her song!",
    cloudy: "The clouds remind us that all things change - this too is nature's wisdom.",
    snowy: "Winter's grip teaches us patience and the value of preparation."
  };
  
  // Progressive teaching based on relationship
  const progressiveTeaching = {
    stranger: "Nature is the greatest teacher - start by simply observing.",
    acquaintance: "You're learning to read nature's signs. What patterns do you notice?",
    friend: "Your eyes are opening to nature's deeper truths. What have you discovered?",
    confidant: "Share with me your deepest observations. Together we can protect these wild places."
  };
  
  let response = "";
  
  // Add context-specific response
  if (context.location && locationResponses[context.location]) {
    response += locationResponses[context.location] + " ";
  }
  
  if (context.weather && weatherResponses[context.weather]) {
    response += weatherResponses[context.weather] + " ";
  }
  
  // Add relationship-based teaching
  response += progressiveTeaching[relationship];
  
  // If talking about conservation (high advocacy trait)
  if (advocacy > 80 && (prompt?.toLowerCase().includes('protect') || prompt?.toLowerCase().includes('save'))) {
    response += " Remember: 'In every walk with nature one receives far more than he seeks.' We must preserve these temples of nature for future generations.";
  }
  
  try {
    // Try to get additional Muir quote
    const quote = await fetchJohnMuirQuote();
    if (quote.text && !response.includes(quote.text)) {
      response += ` As I once wrote: "${quote.text}"`;
    }
  } catch (error) {
    // Continue with composed response
  }
  
  return {
    text: response,
    author: "John Muir"
  };
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