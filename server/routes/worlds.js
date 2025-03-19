import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import World from '../models/World.js';
import NPC from '../models/NPC.js';
import jwt from 'jsonwebtoken';
import { MAPS_STRUCTURE } from '../constants.js';

const router = express.Router();

// Validation middleware
const validateWorld = [
  body('name').trim().isLength({ min: 3 }).escape(),
  body('description').trim().isLength({ min: 10 }).escape(),
  body('isPublic').optional().isBoolean(),
  body('isMainWorld').optional().isBoolean(),
  body('mapType').optional().isString()
];

// Get all public worlds
router.get('/', async (req, res) => {
  try {
    const worlds = await World.find({ isPublic: true })
      .populate('creator', 'username avatar')
      .sort({ createdAt: -1 });
    
    return res.json(worlds);
  } catch (error) {
    console.error('Error fetching worlds:', error);
    return res.status(500).json({ message: 'Error fetching worlds' });
  }
});

// Get main world
router.get('/main', async (req, res) => {
  try {
    const mainWorld = await World.findOne({ isMainWorld: true })
      .populate('creator', 'username')
      .populate('npcs', 'name description apiType sprite position')
      .populate('games', 'name description type config')
      .populate('sharedWith.user', 'username');

    if (!mainWorld) {
      // Create the main world if it doesn't exist
      const mainWorld = new World({
        name: "Authentic Internet",
        description: "The shared world where all users can interact and explore together",
        isPublic: true,
        isMainWorld: true,
        creator: req.user?.userId || null, // System-created
        mapType: 'DEFAULT',
        mapData: MAPS_STRUCTURE.DEFAULT.tiles,
        spawnPoints: MAPS_STRUCTURE.DEFAULT.spawnPoints || [{ x: 1, y: 1 }]
      });

      await mainWorld.save();

      // Create default Guide NPC
      const npc = new NPC({
        name: 'World Guide',
        description: 'A helpful guide for the main world',
        world: mainWorld._id,
        creator: req.user?.userId || null,
        apiType: 'gpt',
        position: mainWorld.spawnPoints[0] || { x: 1, y: 1 }
      });

      await npc.save();

      // Add NPC to world
      mainWorld.npcs = [npc._id];
      await mainWorld.save();
      await mainWorld.populate('npcs');
    }

    res.json(mainWorld);
  } catch (error) {
    console.error('Error fetching main world:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's development worlds
router.get('/my-worlds', auth, async (req, res) => {
  try {
    const worlds = await World.find({
      creator: req.user.userId,
      isMainWorld: false // Only get development worlds
    })
    .populate('creator', 'username')
    .populate('npcs', 'name description apiType')
    .populate('games', 'name description type')
    .populate('sharedWith.user', 'username');
    res.json(worlds);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new development world
router.post('/', auth, validateWorld, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, mapType = 'DEFAULT' } = req.body;

    // Check if world name already exists
    const existingWorld = await World.findOne({ name, creator: req.user.userId });
    if (existingWorld) {
      return res.status(400).json({ message: 'You already have a world with this name' });
    }

    // Get predefined map data
    const selectedMap = MAPS_STRUCTURE[mapType] || MAPS_STRUCTURE.DEFAULT;
    if (!selectedMap) {
      return res.status(400).json({ message: 'Invalid map type' });
    }

    const world = new World({
      name,
      description,
      isPublic: false, // Development worlds are private by default
      isMainWorld: false, // Cannot create new main worlds
      creator: req.user.userId,
      mapType,
      mapData: selectedMap.tiles,
      spawnPoints: selectedMap.spawnPoints || [{ x: 1, y: 1 }]
    });

    await world.save();

    // Create default NPC for the world
    const defaultSpawnPoint = world.spawnPoints[0] || { x: 1, y: 1 };
    const npc = new NPC({
      name: 'Development Guide',
      description: 'A helpful guide for your development world',
      world: world._id,
      creator: req.user.userId,
      apiType: 'gpt',
      position: defaultSpawnPoint
    });

    await npc.save();

    // Add NPC to world
    world.npcs = [npc._id];
    await world.save();
    await world.populate('npcs');

    res.status(201).json({
      world: {
        ...world.toObject(),
        npcs: [npc]
      }
    });
  } catch (error) {
    console.error('Error creating world:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Expand world map
router.post('/:id/expand', auth, async (req, res) => {
  try {
    const { direction, size } = req.body;
    const world = await World.findById(req.params.id);

    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to expand this world' });
    }

    await world.expandMap(direction, size);
    res.json(world);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Share world with another user
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { userId, role } = req.body;
    const world = await World.findById(req.params.id);

    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to share this world' });
    }

    await world.shareWith(userId, role);
    res.json(world);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove world sharing with a user
router.delete('/:id/share/:userId', auth, async (req, res) => {
  try {
    const world = await World.findById(req.params.id);

    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to modify sharing settings' });
    }

    await world.removeShare(req.params.userId);
    res.json(world);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a game to the world
router.post('/:id/games', auth, async (req, res) => {
  try {
    const { name, description, type, config } = req.body;
    const world = await World.findById(req.params.id);

    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to add games to this world' });
    }

    await world.addGame({ name, description, type, config });
    res.json(world);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific world
router.get('/:id', async (req, res) => {
  try {
    const world = await World.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate({
        path: 'npcs',
        model: 'NPC'
      });
    
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (!world.isPublic && world.creator.toString() !== req.user?.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(world);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update world
router.put('/:id', auth, validateWorld, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const world = await World.findById(req.params.id);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this world' });
    }

    const { name, description, isPublic } = req.body;
    world.name = name;
    world.description = description;
    if (typeof isPublic === 'boolean') {
      world.isPublic = isPublic;
    }

    await world.save();
    res.json(world);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete world
router.delete('/:id', auth, async (req, res) => {
  try {
    const world = await World.findById(req.params.id);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this world' });
    }

    await world.remove();
    res.json({ message: 'World deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get NPCs in a world
router.get('/:id/npcs', async (req, res) => {
  try {
    const world = await World.findById(req.params.id);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }
    
    const npcs = await NPC.find({ world: req.params.id });
    
    return res.json(npcs);
  } catch (error) {
    console.error('Error fetching NPCs:', error);
    return res.status(500).json({ message: 'Error fetching NPCs' });
  }
});

// Create system default world if none exists
export const ensureDefaultWorldExists = async () => {
  try {
    const existingDefaultWorld = await World.findOne({ isMainWorld: true });
    
    if (!existingDefaultWorld) {
      console.log('Creating default world...');
      
      const defaultWorld = new World({
        name: 'Authentic Internet',
        description: 'The main world of Authentic Internet where users can create and discover artifacts.',
        isPublic: true,
        isMainWorld: true,
        creator: null, // System-created
        mapType: 'Home',
        mapData: MAPS_STRUCTURE[0].data,
        spawnPoints: [{ x: 4, y: 4 }]
      });
      
      await defaultWorld.save();
      console.log('Default world created successfully');
      return defaultWorld;
    }
    
    return existingDefaultWorld;
  } catch (error) {
    console.error('Error ensuring default world exists:', error);
    return null;
  }
};

export default router; 