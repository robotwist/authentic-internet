import express from 'express';
import { auth } from '../middleware/auth.js';
import Quest from '../models/Quest.js';
import NPC from '../models/NPC.js';
import User from '../models/User.js';

const router = express.Router();

// Get all quests for a user
router.get('/', auth, async (req, res) => {
  try {
    const questDoc = await Quest.findOrCreateForUser(req.user.id);
    
    res.json({
      success: true,
      data: {
        activeQuests: questDoc.getActiveQuests(),
        completedQuests: questDoc.getCompletedQuests(),
        stats: questDoc.questStats
      }
    });
  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ success: false, message: 'Error fetching quests' });
  }
});

// Start a new quest from an NPC
router.post('/start/:npcId', auth, async (req, res) => {
  try {
    const { npcId } = req.params;
    const { questId } = req.body;

    // Find the NPC
    const npc = await NPC.findById(npcId);
    if (!npc) {
      return res.status(404).json({ success: false, message: 'NPC not found' });
    }

    // Find the specific quest
    const questData = npc.quests.find(q => q.id === questId);
    if (!questData) {
      return res.status(404).json({ success: false, message: 'Quest not found' });
    }

    // Check if quest is active
    if (!questData.isActive) {
      return res.status(400).json({ success: false, message: 'Quest is not available' });
    }

    // Get or create quest document for user
    const questDoc = await Quest.findOrCreateForUser(req.user.id);

    // Check if user already has this quest active
    const existingQuest = questDoc.getQuestProgress(questId);
    if (existingQuest) {
      return res.status(400).json({ success: false, message: 'Quest already in progress' });
    }

    // Check if user has already completed this quest
    const completedQuest = questDoc.completedQuests.find(q => q.questId === questId);
    if (completedQuest) {
      return res.status(400).json({ success: false, message: 'Quest already completed' });
    }

    // Start the quest
    const questProgress = await questDoc.startQuest(npcId, questData);

    res.json({
      success: true,
      message: 'Quest started successfully',
      data: questProgress
    });
  } catch (error) {
    console.error('Error starting quest:', error);
    res.status(500).json({ success: false, message: 'Error starting quest' });
  }
});

// Complete a quest stage
router.post('/complete-stage', auth, async (req, res) => {
  try {
    const { questId, stageIndex } = req.body;

    const questDoc = await Quest.findOrCreateForUser(req.user.id);
    const result = await questDoc.completeStage(questId, stageIndex);

    // If quest is completed, update user stats
    if (result.questCompleted) {
      const user = await User.findById(req.user.id);
      if (user && result.rewards.exp) {
        user.exp = (user.exp || 0) + result.rewards.exp;
        await user.save();
      }
    }

    res.json({
      success: true,
      message: 'Stage completed successfully',
      data: {
        stage: result.stage,
        questCompleted: result.questCompleted,
        rewards: result.rewards,
        updatedStats: questDoc.questStats
      }
    });
  } catch (error) {
    console.error('Error completing quest stage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get quest progress for a specific quest
router.get('/progress/:questId', auth, async (req, res) => {
  try {
    const { questId } = req.params;
    const questDoc = await Quest.findOrCreateForUser(req.user.id);
    const progress = questDoc.getQuestProgress(questId);

    if (!progress) {
      return res.status(404).json({ success: false, message: 'Quest not found' });
    }

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error fetching quest progress:', error);
    res.status(500).json({ success: false, message: 'Error fetching quest progress' });
  }
});

// Get available quests from an NPC
router.get('/available/:npcId', auth, async (req, res) => {
  try {
    const { npcId } = req.params;
    const npc = await NPC.findById(npcId);
    
    if (!npc) {
      return res.status(404).json({ success: false, message: 'NPC not found' });
    }

    const questDoc = await Quest.findOrCreateForUser(req.user.id);
    const activeQuests = questDoc.getActiveQuests();
    const completedQuests = questDoc.getCompletedQuests();

    // Filter available quests
    const availableQuests = npc.quests.filter(quest => {
      // Check if quest is active
      if (!quest.isActive) return false;

      // Check if user already has this quest active
      const isActive = activeQuests.some(aq => aq.questId === quest.id);
      if (isActive) return false;

      // Check if user has already completed this quest
      const isCompleted = completedQuests.some(cq => cq.questId === quest.id);
      if (isCompleted) return false;

      return true;
    });

    res.json({
      success: true,
      data: {
        npc: {
          id: npc._id,
          name: npc.name,
          type: npc.type,
          area: npc.area
        },
        availableQuests,
        activeQuests: activeQuests.filter(aq => aq.npcId.toString() === npcId),
        completedQuests: completedQuests.filter(cq => cq.npcId.toString() === npcId)
      }
    });
  } catch (error) {
    console.error('Error fetching available quests:', error);
    res.status(500).json({ success: false, message: 'Error fetching available quests' });
  }
});

// Get quest statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const questDoc = await Quest.findOrCreateForUser(req.user.id);
    
    res.json({
      success: true,
      data: questDoc.questStats
    });
  } catch (error) {
    console.error('Error fetching quest stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching quest stats' });
  }
});

// Abandon a quest
router.delete('/abandon/:questId', auth, async (req, res) => {
  try {
    const { questId } = req.params;
    const questDoc = await Quest.findOrCreateForUser(req.user.id);
    
    const questIndex = questDoc.activeQuests.findIndex(q => q.questId === questId);
    if (questIndex === -1) {
      return res.status(404).json({ success: false, message: 'Quest not found' });
    }

    // Remove the quest from active quests
    questDoc.activeQuests.splice(questIndex, 1);
    await questDoc.save();

    res.json({
      success: true,
      message: 'Quest abandoned successfully'
    });
  } catch (error) {
    console.error('Error abandoning quest:', error);
    res.status(500).json({ success: false, message: 'Error abandoning quest' });
  }
});

export default router;
