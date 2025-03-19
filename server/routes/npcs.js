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

// Interact with NPC
router.post('/:id/interact', auth, async (req, res) => {
  try {
    const npc = await NPC.findById(req.params.id);
    if (!npc) {
      return res.status(404).json({ message: 'NPC not found' });
    }

    const { prompt } = req.body;
    const response = await npc.interact(prompt);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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