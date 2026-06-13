import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import WorldInstance from '../models/World.js';
import ChatMessage from '../models/Chat.js';
import User from '../models/User.js';
import NPC from '../models/NPC.js';
import { MAPS_STRUCTURE } from '../constants.js';

const router = express.Router();
const MAIN_WORLD_ID = 'main-world';
const DEFAULT_SPAWN_POINT = { x: 1, y: 1 };

const validateWorld = [
  body('name').trim().isLength({ min: 3 }).escape(),
  body('description').trim().isLength({ min: 10 }).escape(),
  body('isPublic').optional().isBoolean(),
  body('isMainWorld').optional().isBoolean(),
  body('mapType').optional().isString()
];

const validateInstanceWorld = [
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('maxPlayers').optional().isInt({ min: 1, max: 500 }),
  body('isPublic').optional().isBoolean(),
  body('requiresInvite').optional().isBoolean()
];

const normalizeMapKey = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[\s_-]+/g, '');

const getMapDefinition = (mapType) => {
  if (Number.isInteger(Number(mapType))) {
    return MAPS_STRUCTURE[Number(mapType)] || MAPS_STRUCTURE[0];
  }

  const normalized = normalizeMapKey(mapType);
  if (!normalized || normalized === 'default' || normalized === 'main') {
    return MAPS_STRUCTURE[0];
  }

  return MAPS_STRUCTURE.find((map) => normalizeMapKey(map.name) === normalized) || MAPS_STRUCTURE[0];
};

const getMapTiles = (mapDefinition) => mapDefinition?.tiles || mapDefinition?.data || [];
const getSpawnPoints = (mapDefinition) => mapDefinition?.spawnPoints || [DEFAULT_SPAWN_POINT];

const serializeWorld = (world) => {
  const source = world?.toObject ? world.toObject() : world;
  if (!source) return null;

  const mapDefinition = getMapDefinition(source.mapType);
  const mapData = source.mapData || getMapTiles(mapDefinition);

  return {
    ...source,
    _id: source._id?.toString ? source._id.toString() : source._id,
    id: source._id?.toString ? source._id.toString() : source._id,
    worldId: source.worldId,
    name: source.name,
    description: source.description,
    isMainWorld: Boolean(source.isMainWorld),
    isPublic: Boolean(source.isPublic),
    mapType: source.mapType || mapDefinition?.name || 'Home',
    mapData,
    spawnPoints: source.spawnPoints || getSpawnPoints(mapDefinition),
    npcs: source.npcs || [],
    games: source.games || [],
    portals: source.portals || [],
    artifacts: source.artifacts || [],
    activePlayers: source.activePlayers || [],
    playerCount: source.activePlayers?.length || 0,
    maxPlayers: source.maxPlayers,
    stats: source.stats,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };
};

const publicWorldSummary = (world) => {
  const data = serializeWorld(world);
  return {
    worldId: data.worldId,
    name: data.name,
    description: data.description,
    creator: data.creator,
    playerCount: data.playerCount,
    maxPlayers: data.maxPlayers,
    stats: data.stats,
    createdAt: data.createdAt
  };
};

const makeStaticMainWorld = () => {
  const mapDefinition = getMapDefinition('Home');
  return {
    _id: MAIN_WORLD_ID,
    id: MAIN_WORLD_ID,
    worldId: MAIN_WORLD_ID,
    name: 'Authentic Internet',
    description: 'The shared world where all users can interact and explore together',
    isPublic: true,
    isMainWorld: true,
    mapType: mapDefinition.name,
    mapData: getMapTiles(mapDefinition),
    spawnPoints: getSpawnPoints(mapDefinition),
    npcs: [],
    games: [],
    portals: [],
    artifacts: [],
    activePlayers: [],
    playerCount: 0,
    maxPlayers: 50,
    stats: {
      totalVisits: 0,
      totalArtifactsCreated: 0,
      totalChatMessages: 0,
      lastActivity: new Date()
    }
  };
};

const findWorldByIdOrWorldId = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const worldById = await WorldInstance.findById(id)
      .populate('creator', 'username avatar')
      .populate('moderators', 'username avatar');
    if (worldById) return worldById;
  }

  return WorldInstance.findOne({ worldId: id })
    .populate('creator', 'username avatar')
    .populate('moderators', 'username avatar');
};

const optionalAuth = async (req, res, next) => {
  if (!req.header('Authorization')) {
    return next();
  }

  return auth(req, res, next);
};

const isWorldModerator = (world, userId) => {
  if (!world || !userId) return false;
  const creatorId = world.creator?._id || world.creator;
  if (creatorId?.toString() === userId) return true;
  return (world.moderators || []).some((moderator) => {
    const moderatorId = moderator?._id || moderator;
    return moderatorId?.toString() === userId;
  });
};

const unsupportedLegacyOperation = (res, operation) => res.status(501).json({
  success: false,
  message: `${operation} is not supported by the current world model`
});

// Get all public worlds
router.get('/', async (req, res) => {
  try {
    const worlds = await WorldInstance.find({
      isPublic: true,
      isActive: true
    })
      .populate('creator', 'username avatar')
      .sort({ 'stats.lastActivity': -1 })
      .limit(20);

    res.json({
      success: true,
      worlds: worlds.map(publicWorldSummary)
    });
  } catch (error) {
    console.error('Error fetching worlds:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get main world
router.get('/main', async (req, res) => {
  try {
    const persistedMainWorld = await WorldInstance.findOne({ worldId: MAIN_WORLD_ID, isActive: true })
      .populate('creator', 'username avatar')
      .populate('moderators', 'username avatar');

    res.json(persistedMainWorld ? serializeWorld(persistedMainWorld) : makeStaticMainWorld());
  } catch (error) {
    console.error('Error fetching main world:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's development worlds
router.get('/my-worlds', auth, async (req, res) => {
  try {
    const worlds = await WorldInstance.find({
      creator: req.user.userId,
      isActive: true
    })
      .populate('creator', 'username avatar')
      .populate('moderators', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(worlds.map(serializeWorld));
  } catch (error) {
    console.error('Error fetching my-worlds:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Multiplayer-specific routes must come before the generic /:id route.
router.get('/instance/:worldId', async (req, res) => {
  try {
    const { worldId } = req.params;

    const world = await WorldInstance.findOne({ worldId })
      .populate('creator', 'username avatar')
      .populate('moderators', 'username avatar');

    if (!world) {
      return res.status(404).json({ success: false, message: 'World not found' });
    }

    res.json({ success: true, world: serializeWorld(world) });
  } catch (error) {
    console.error('Error fetching world:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/instance', auth, validateInstanceWorld, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, maxPlayers = 50, isPublic = true, requiresInvite = false } = req.body;
    const worldId = `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const world = new WorldInstance({
      worldId,
      name,
      description,
      creator: req.user.userId,
      maxPlayers,
      isPublic,
      requiresInvite,
      moderators: [req.user.userId]
    });

    await world.save();

    res.status(201).json({ success: true, world: serializeWorld(world) });
  } catch (error) {
    console.error('Error creating world:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/instance/:worldId/chat', async (req, res) => {
  try {
    const { worldId } = req.params;
    const { limit = 50 } = req.query;

    const messages = await ChatMessage.find({
      messageType: 'world',
      'world.worldId': worldId,
      'status.isDeleted': false
    })
      .populate('sender.userId', 'username avatar level')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      messages: messages.reverse()
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/instance/:worldId/players', async (req, res) => {
  try {
    const { worldId } = req.params;

    const world = await WorldInstance.findOne({ worldId });
    if (!world) {
      return res.status(404).json({ success: false, message: 'World not found' });
    }

    res.json({
      success: true,
      players: world.getOnlinePlayers()
    });
  } catch (error) {
    console.error('Error fetching online players:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new development world
router.post('/', auth, validateWorld, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, mapType = 'Home' } = req.body;
    const selectedMap = getMapDefinition(mapType);

    const existingWorld = await WorldInstance.findOne({ name, creator: req.user.userId, isActive: true });
    if (existingWorld) {
      return res.status(400).json({ message: 'You already have a world with this name' });
    }

    const world = new WorldInstance({
      worldId: `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      creator: req.user.userId,
      mapType: selectedMap.name,
      maxPlayers: 50,
      isPublic: false,
      requiresInvite: true,
      moderators: [req.user.userId]
    });

    await world.save();

    res.status(201).json({
      world: serializeWorld(world)
    });
  } catch (error) {
    console.error('Error creating world:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Expand world map (legacy operation no longer backed by the WorldInstance schema)
router.post('/:id/expand', auth, async (req, res) => {
  return unsupportedLegacyOperation(res, 'Map expansion');
});

// Share world with another user
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const world = await findWorldByIdOrWorldId(req.params.id);

    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to share this world' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!world.moderators.some((moderatorId) => moderatorId.toString() === userId)) {
      world.moderators.push(userId);
      await world.save();
    }

    res.json(serializeWorld(world));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove world sharing with a user
router.delete('/:id/share/:userId', auth, async (req, res) => {
  try {
    const world = await findWorldByIdOrWorldId(req.params.id);

    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to modify sharing settings' });
    }

    world.moderators = world.moderators.filter((moderatorId) => moderatorId.toString() !== req.params.userId);
    await world.save();

    res.json(serializeWorld(world));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a game to the world (legacy operation no longer backed by the WorldInstance schema)
router.post('/:id/games', auth, async (req, res) => {
  return unsupportedLegacyOperation(res, 'Adding games to worlds');
});

// Get specific world
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const world = await findWorldByIdOrWorldId(req.params.id);

    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (!world.isPublic && !isWorldModerator(world, req.user?.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(serializeWorld(world));
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

    const world = await findWorldByIdOrWorldId(req.params.id);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this world' });
    }

    const { name, description, isPublic, mapType } = req.body;
    if (name) world.name = name;
    if (description) world.description = description;
    if (typeof isPublic === 'boolean') {
      world.isPublic = isPublic;
      world.requiresInvite = !isPublic;
    }
    if (mapType) {
      world.mapType = getMapDefinition(mapType).name;
    }

    await world.save();
    res.json(serializeWorld(world));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete world
router.delete('/:id', auth, async (req, res) => {
  try {
    const world = await findWorldByIdOrWorldId(req.params.id);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this world' });
    }

    world.isActive = false;
    await world.save();
    res.json({ message: 'World deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get NPCs in a world
router.get('/:id/npcs', async (req, res) => {
  try {
    const world = await findWorldByIdOrWorldId(req.params.id);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    const npcs = await NPC.find({ world: world._id });
    return res.json(npcs);
  } catch (error) {
    console.error('Error fetching NPCs:', error);
    return res.status(500).json({ message: 'Error fetching NPCs' });
  }
});

// Create system default world if none exists
export const ensureDefaultWorldExists = async () => {
  try {
    return await WorldInstance.findOne({ worldId: MAIN_WORLD_ID, isActive: true });
  } catch (error) {
    console.error('Error ensuring default world exists:', error);
    return null;
  }
};

export default router;
