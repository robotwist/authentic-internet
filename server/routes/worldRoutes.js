import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import WorldInstance from '../models/World.js';
import ChatMessage from '../models/Chat.js';
import User from '../models/User.js';

const router = express.Router();

// Get all public worlds
router.get('/public', async (req, res) => {
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
      worlds: worlds.map(world => ({
        worldId: world.worldId,
        name: world.name,
        description: world.description,
        creator: world.creator,
        playerCount: world.activePlayers.length,
        maxPlayers: world.maxPlayers,
        stats: world.stats,
        createdAt: world.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching public worlds:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get world details
router.get('/:worldId', async (req, res) => {
  try {
    const { worldId } = req.params;
    
    const world = await WorldInstance.findOne({ worldId })
      .populate('creator', 'username avatar')
      .populate('moderators', 'username avatar');

    if (!world) {
      return res.status(404).json({ success: false, message: 'World not found' });
    }

    // Don't send sensitive data to non-moderators
    const isModerator = req.user && world.moderators.some(mod => 
      mod._id.toString() === req.user.userId
    );

    const worldData = {
      worldId: world.worldId,
      name: world.name,
      description: world.description,
      creator: world.creator,
      playerCount: world.activePlayers.length,
      maxPlayers: world.maxPlayers,
      settings: world.settings,
      stats: world.stats,
      createdAt: world.createdAt,
      isPublic: world.isPublic,
      requiresInvite: world.requiresInvite
    };

    if (isModerator) {
      worldData.activePlayers = world.activePlayers;
      worldData.moderators = world.moderators;
    }

    res.json({ success: true, world: worldData });
  } catch (error) {
    console.error('Error fetching world:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new world
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, maxPlayers = 50, isPublic = true, requiresInvite = false } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'World name is required' });
    }

    // Generate unique world ID
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

    res.json({
      success: true,
      world: {
        worldId: world.worldId,
        name: world.name,
        description: world.description,
        creator: req.user.userId,
        maxPlayers: world.maxPlayers,
        isPublic: world.isPublic,
        requiresInvite: world.requiresInvite
      }
    });
  } catch (error) {
    console.error('Error creating world:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update world settings (moderators only)
router.put('/:worldId', authenticateToken, async (req, res) => {
  try {
    const { worldId } = req.params;
    const { name, description, maxPlayers, settings } = req.body;

    const world = await WorldInstance.findOne({ worldId });
    if (!world) {
      return res.status(404).json({ success: false, message: 'World not found' });
    }

    // Check if user is moderator
    const isModerator = world.moderators.includes(req.user.userId) || 
                       world.creator.toString() === req.user.userId;

    if (!isModerator) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Update allowed fields
    if (name) world.name = name;
    if (description) world.description = description;
    if (maxPlayers) world.maxPlayers = maxPlayers;
    if (settings) world.settings = { ...world.settings, ...settings };

    await world.save();

    res.json({ success: true, world });
  } catch (error) {
    console.error('Error updating world:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get world chat history
router.get('/:worldId/chat', async (req, res) => {
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
    .limit(parseInt(limit));

    res.json({
      success: true,
      messages: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get online players in world
router.get('/:worldId/players', async (req, res) => {
  try {
    const { worldId } = req.params;

    const world = await WorldInstance.findOne({ worldId });
    if (!world) {
      return res.status(404).json({ success: false, message: 'World not found' });
    }

    const onlinePlayers = world.getOnlinePlayers();

    res.json({
      success: true,
      players: onlinePlayers
    });
  } catch (error) {
    console.error('Error fetching online players:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add moderator to world
router.post('/:worldId/moderators', authenticateToken, async (req, res) => {
  try {
    const { worldId } = req.params;
    const { userId } = req.body;

    const world = await WorldInstance.findOne({ worldId });
    if (!world) {
      return res.status(404).json({ success: false, message: 'World not found' });
    }

    // Only creator can add moderators
    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add moderator if not already one
    if (!world.moderators.includes(userId)) {
      world.moderators.push(userId);
      await world.save();
    }

    res.json({ success: true, message: 'Moderator added successfully' });
  } catch (error) {
    console.error('Error adding moderator:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove moderator from world
router.delete('/:worldId/moderators/:userId', authenticateToken, async (req, res) => {
  try {
    const { worldId, userId } = req.params;

    const world = await WorldInstance.findOne({ worldId });
    if (!world) {
      return res.status(404).json({ success: false, message: 'World not found' });
    }

    // Only creator can remove moderators
    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Remove moderator
    world.moderators = world.moderators.filter(id => id.toString() !== userId);
    await world.save();

    res.json({ success: true, message: 'Moderator removed successfully' });
  } catch (error) {
    console.error('Error removing moderator:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Ban user from world
router.post('/:worldId/ban/:userId', authenticateToken, async (req, res) => {
  try {
    const { worldId, userId } = req.params;

    const world = await WorldInstance.findOne({ worldId });
    if (!world) {
      return res.status(404).json({ success: false, message: 'World not found' });
    }

    // Check if user is moderator
    const isModerator = world.moderators.includes(req.user.userId) || 
                       world.creator.toString() === req.user.userId;

    if (!isModerator) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Remove player from world
    world.removePlayer(userId);
    await world.save();

    res.json({ success: true, message: 'User banned from world' });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
