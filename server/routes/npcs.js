import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import NPC from '../models/NPC.js';
import World from '../models/World.js';
import { fetchJohnMuirQuote } from '../services/apiIntegrations.js';

const router = express.Router();

// Validation middleware
const validateNPC = [
  body('name').trim().isLength({ min: 3 }).escape(),
  body('description').trim().isLength({ min: 10 }).escape(),
  body('world').isMongoId(),
  body('apiType').isIn(['weather', 'quotes', 'shakespeare', 'keats', 'socrates', 'michelangelo', 'oscar_wilde', 'alexander_pope', 'zeus', 'jesus', 'john_muir']),
  body('apiConfig').isObject(),
  body('position').isObject(),
  body('dialogue').isArray()
];

// Get all NPCs
router.get('/', async (req, res) => {
  try {
    const npcs = await NPC.find({}).select('-memory.conversationHistory -quoteCache');
    res.json({ success: true, npcs });
  } catch (error) {
    console.error('Error fetching NPCs:', error);
    res.status(500).json({ success: false, message: 'Error fetching NPCs' });
  }
});

// Get NPC by ID
router.get('/:id', async (req, res) => {
  try {
    const npc = await NPC.findById(req.params.id);
    if (!npc) {
      return res.status(404).json({ success: false, message: 'NPC not found' });
    }
    res.json({ success: true, npc });
  } catch (error) {
    console.error('Error fetching NPC:', error);
    res.status(500).json({ success: false, message: 'Error fetching NPC' });
  }
});

// Get all NPCs in a world
router.get('/world/:worldId', async (req, res) => {
  try {
    const npcs = await NPC.find({ world: req.params.worldId })
      .select('-apiConfig.apiKey');
    res.json(npcs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new NPC
router.post('/', auth, validateNPC, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, world, apiType, apiConfig, position, dialogue } = req.body;

    // Check if world exists and user has access
    const worldDoc = await World.findById(world);
    if (!worldDoc) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (!worldDoc.isPublic && worldDoc.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to add NPCs to this world' });
    }

    // Check if NPC name already exists in this world
    const existingNPC = await NPC.findOne({ name, world });
    if (existingNPC) {
      return res.status(400).json({ message: 'NPC name already exists in this world' });
    }

    const npc = new NPC({
      name,
      description,
      world,
      apiType,
      apiConfig,
      position,
      dialogue,
      creator: req.user.userId
    });

    await npc.save();

    // Add NPC to world's NPCs array
    worldDoc.npcs.push(npc._id);
    await worldDoc.save();

    res.status(201).json(npc);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Enhanced NPC interaction endpoint
router.post('/:id/interact', async (req, res) => {
  try {
    const { message, userId, context = {} } = req.body;
    const npcId = req.params.id;

    const npc = await NPC.findById(npcId);
    if (!npc) {
      return res.status(404).json({ success: false, message: 'NPC not found' });
    }

    // Get current weather for context if not provided
    let currentContext = {
      location: context.location || 'overworld',
      weather: context.weather || 'sunny',
      timeOfDay: context.timeOfDay || 'day',
      ...context
    };

    // If we have external weather API, try to get real weather
    if (context.location === 'yosemite' || context.location === 'overworld') {
      try {
        // This would call a weather API - for now using mock data
        const weatherConditions = ['sunny', 'cloudy', 'rainy', 'partly-cloudy'];
        currentContext.weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
      } catch (weatherError) {
        // Fall back to provided weather or default
        console.log('Weather API unavailable, using default');
      }
    }

    // Use the enhanced interaction method
    const response = await npc.interact(message, userId, currentContext);

    // Check for available quests
    const availableQuests = npc.quests?.filter(quest => 
      quest.isActive && !quest.completedBy.includes(userId)
    ) || [];

    // Prepare response with enhanced data
    const enhancedResponse = {
      ...response,
      availableQuests: availableQuests.length > 0 ? availableQuests : null,
      npcData: {
        id: npc._id,
        name: npc.name,
        type: npc.type,
        area: npc.area,
        personalityTraits: npc.personality?.traits || {},
        totalInteractions: npc.memory?.globalKnowledge?.totalInteractions || 0
      },
      contextData: currentContext
    };

    res.json({ 
      success: true, 
      response: enhancedResponse,
      debug: process.env.NODE_ENV === 'development' ? {
        playerId: userId,
        npcType: npc.type,
        context: currentContext
      } : undefined
    });

  } catch (error) {
    console.error('Error in NPC interaction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing NPC interaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get NPC memory for a specific player (requires auth)
router.get('/:id/memory/:playerId', auth, async (req, res) => {
  try {
    const { id, playerId } = req.params;
    
    const npc = await NPC.findById(id);
    if (!npc) {
      return res.status(404).json({ success: false, message: 'NPC not found' });
    }

    const playerMemory = npc.getPlayerMemory(playerId);
    
    res.json({ 
      success: true, 
      memory: {
        relationship: playerMemory.relationship,
        interactionCount: playerMemory.interactionCount,
        topics: playerMemory.topics,
        sentiment: playerMemory.sentiment,
        lastInteraction: playerMemory.lastInteraction,
        playerProgress: playerMemory.playerProgress
      }
    });

  } catch (error) {
    console.error('Error fetching NPC memory:', error);
    res.status(500).json({ success: false, message: 'Error fetching NPC memory' });
  }
});

// Update NPC quest progress
router.post('/:id/quest/:questId/progress', auth, async (req, res) => {
  try {
    const { id, questId } = req.params;
    const { userId, stageIndex, completed } = req.body;

    const npc = await NPC.findById(id);
    if (!npc) {
      return res.status(404).json({ success: false, message: 'NPC not found' });
    }

    const quest = npc.quests.find(q => q.id === questId);
    if (!quest) {
      return res.status(404).json({ success: false, message: 'Quest not found' });
    }

    // Update quest stage
    if (quest.stages[stageIndex]) {
      quest.stages[stageIndex].completed = completed;
    }

    // Check if quest is fully completed
    const allStagesCompleted = quest.stages.every(stage => stage.completed);
    if (allStagesCompleted && !quest.completedBy.includes(userId)) {
      quest.completedBy.push(userId);
      
      // Update player memory
      const playerMemory = npc.getPlayerMemory(userId);
      playerMemory.playerProgress.questsGiven.push(questId);
      
      // Improve relationship
      if (playerMemory.relationship === 'stranger') {
        playerMemory.relationship = 'acquaintance';
      } else if (playerMemory.relationship === 'acquaintance') {
        playerMemory.relationship = 'friend';
      }
    }

    await npc.save();

    res.json({ 
      success: true, 
      quest: quest,
      questCompleted: allStagesCompleted
    });

  } catch (error) {
    console.error('Error updating quest progress:', error);
    res.status(500).json({ success: false, message: 'Error updating quest progress' });
  }
});

// Get NPC quotes/wisdom
router.get('/:id/quotes', async (req, res) => {
  try {
    const npc = await NPC.findById(req.params.id);
    if (!npc) {
      return res.status(404).json({ success: false, message: 'NPC not found' });
    }

    // Get fresh quotes
    const quotes = await npc.refreshQuotes();
    
    res.json({ 
      success: true, 
      quotes: quotes,
      npcName: npc.name,
      npcType: npc.type
    });

  } catch (error) {
    console.error('Error fetching NPC quotes:', error);
    res.status(500).json({ success: false, message: 'Error fetching quotes' });
  }
});

// Get NPCs by area/location
router.get('/area/:area', async (req, res) => {
  try {
    const { area } = req.params;
    const npcs = await NPC.find({ area }).select('-memory.conversationHistory -quoteCache');
    
    res.json({ 
      success: true, 
      npcs,
      area
    });

  } catch (error) {
    console.error('Error fetching NPCs by area:', error);
    res.status(500).json({ success: false, message: 'Error fetching NPCs by area' });
  }
});

// Admin endpoint to seed NPCs (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/admin/seed', async (req, res) => {
    try {
      const { seedNPCs } = await import('../seed/npcs.js');
      const createdNPCs = await seedNPCs();
      
      res.json({ 
        success: true, 
        message: `Successfully seeded ${createdNPCs.length} NPCs`,
        npcs: createdNPCs.map(npc => ({ id: npc._id, name: npc.name, type: npc.type }))
      });
      
    } catch (error) {
      console.error('Error seeding NPCs:', error);
      res.status(500).json({ success: false, message: 'Error seeding NPCs', error: error.message });
    }
  });
}

// Get NPC analytics (for development/debugging)
router.get('/:id/analytics', async (req, res) => {
  try {
    const npc = await NPC.findById(req.params.id);
    if (!npc) {
      return res.status(404).json({ success: false, message: 'NPC not found' });
    }

    const analytics = {
      name: npc.name,
      type: npc.type,
      totalInteractions: npc.memory?.globalKnowledge?.totalInteractions || 0,
      uniquePlayersInteracted: npc.memory?.conversationHistory?.length || 0,
      averageInteractionsPerPlayer: npc.memory?.conversationHistory?.length > 0 
        ? (npc.memory.globalKnowledge.totalInteractions / npc.memory.conversationHistory.length).toFixed(2)
        : 0,
      relationships: {
        strangers: npc.memory?.conversationHistory?.filter(c => c.relationship === 'stranger').length || 0,
        acquaintances: npc.memory?.conversationHistory?.filter(c => c.relationship === 'acquaintance').length || 0,
        friends: npc.memory?.conversationHistory?.filter(c => c.relationship === 'friend').length || 0,
        confidants: npc.memory?.conversationHistory?.filter(c => c.relationship === 'confidant').length || 0,
      },
      popularTopics: npc.memory?.globalKnowledge?.popularTopics || [],
      activeQuests: npc.quests?.filter(q => q.isActive).length || 0,
      completedQuests: npc.quests?.reduce((total, quest) => total + quest.completedBy.length, 0) || 0
    };

    res.json({ success: true, analytics });

  } catch (error) {
    console.error('Error fetching NPC analytics:', error);
    res.status(500).json({ success: false, message: 'Error fetching analytics' });
  }
});

// Update NPC
router.put('/:id', auth, validateNPC, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const npc = await NPC.findById(req.params.id);
    if (!npc) {
      return res.status(404).json({ message: 'NPC not found' });
    }

    if (npc.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this NPC' });
    }

    const { name, description, apiType, apiConfig, position, dialogue } = req.body;
    npc.name = name;
    npc.description = description;
    npc.apiType = apiType;
    npc.apiConfig = apiConfig;
    npc.position = position;
    npc.dialogue = dialogue;

    await npc.save();
    res.json(npc);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete NPC
router.delete('/:id', auth, async (req, res) => {
  try {
    const npc = await NPC.findById(req.params.id);
    if (!npc) {
      return res.status(404).json({ message: 'NPC not found' });
    }

    if (npc.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this NPC' });
    }

    // Remove NPC from world's NPCs array
    await World.findByIdAndUpdate(npc.world, {
      $pull: { npcs: npc._id }
    });

    await npc.remove();
    res.json({ message: 'NPC deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add Michelangelo API route
router.post('/michelangelo', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // Import the fetchMichelangeloQuote function
    const { fetchMichelangeloQuote } = await import('../services/apiIntegrations.js');
    
    // Get Michelangelo's response
    const response = await fetchMichelangeloQuote(prompt);
    
    // Return the response
    res.json({
      text: response.quote,
      source: response.source,
      date: response.date,
      recipient: response.recipient,
      additionalQuotes: response.additionalQuotes
    });
  } catch (error) {
    console.error('Michelangelo API error:', error);
    res.status(500).json({ message: 'Failed to get Michelangelo response' });
  }
});

// Add Oscar Wilde API route
router.post('/wilde', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // Import the fetchOscarWildeQuote function
    const { fetchOscarWildeQuote } = await import('../services/apiIntegrations.js');
    
    // Get Oscar Wilde's response
    const response = await fetchOscarWildeQuote(prompt);
    
    // Return the response
    res.json({
      text: response.quote,
      source: response.source,
      date: response.date,
      work: response.work,
      additionalQuotes: response.additionalQuotes
    });
  } catch (error) {
    console.error('Oscar Wilde API error:', error);
    res.status(500).json({ message: 'Failed to get Oscar Wilde response' });
  }
});

// Add Alexander Pope API route
router.post('/pope', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // Import the fetchAlexanderPopeQuote function
    const { fetchAlexanderPopeQuote } = await import('../services/apiIntegrations.js');
    
    // Get Alexander Pope's response
    const response = await fetchAlexanderPopeQuote(prompt);
    
    // Return the response
    res.json({
      text: response.quote,
      source: response.source,
      date: response.date,
      work: response.work,
      additionalQuotes: response.additionalQuotes
    });
  } catch (error) {
    console.error('Alexander Pope API error:', error);
    res.status(500).json({ message: 'Failed to get Alexander Pope response' });
  }
});

// Add Zeus API route
router.post('/zeus', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // Import the fetchZeusQuote function
    const { fetchZeusQuote } = await import('../services/apiIntegrations.js');
    
    // Get Zeus's response
    const response = await fetchZeusQuote(prompt);
    
    // Return the response
    res.json({
      text: response.quote,
      source: response.source,
      date: response.date,
      work: response.work,
      additionalQuotes: response.additionalQuotes
    });
  } catch (error) {
    console.error('Zeus API error:', error);
    res.status(500).json({ message: 'Failed to get Zeus response' });
  }
});

// Add Jesus API route
router.post('/jesus', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // Import the fetchJesusQuote function
    const { fetchJesusQuote } = await import('../services/apiIntegrations.js');
    
    // Get Jesus's response
    const response = await fetchJesusQuote(prompt);
    
    // Return the response
    res.json({
      text: response.quote,
      source: response.source,
      context: response.context,
      author: response.author
    });
  } catch (error) {
    console.error('Jesus API error:', error);
    res.status(500).json({ message: 'Failed to get Jesus response' });
  }
});

// John Muir quotes endpoint
router.post('/john_muir', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await fetchJohnMuirQuote(prompt);
    res.json({
      response: response.quote,
      source: response.source ? `${response.work}, ${response.date}` : 'The writings of John Muir',
      character: 'John Muir',
      prompt
    });
  } catch (error) {
    console.error('Error fetching John Muir quotes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch John Muir quotes', 
      message: error.message 
    });
  }
});

export default router; 