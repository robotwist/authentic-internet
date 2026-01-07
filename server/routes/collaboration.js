import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import Collaboration from '../models/Collaboration.js';
import Artifact from '../models/Artifact.js';
import User from '../models/User.js';

const router = express.Router();

// Create a new collaboration session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const { name, description, artifactType, settings } = req.body;
    const userId = req.user.id;

    const collaboration = new Collaboration({
      name,
      description,
      artifactType,
      creator: userId,
      participants: [{ user: userId, role: 'owner' }],
      settings: {
        allowComments: settings?.allowComments ?? true,
        allowEditing: settings?.allowEditing ?? true,
        requireApproval: settings?.requireApproval ?? false,
        maxParticipants: settings?.maxParticipants ?? 10,
        ...settings
      },
      status: 'active'
    });

    await collaboration.save();

    // Populate creator info
    await collaboration.populate('creator', 'username email');

    res.status(201).json({
      success: true,
      collaboration,
      message: 'Collaboration session created successfully'
    });
  } catch (error) {
    console.error('Error creating collaboration session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create collaboration session'
    });
  }
});

// Get all collaboration sessions for a user
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type } = req.query;

    let query = {
      $or: [
        { creator: userId },
        { 'participants.user': userId }
      ]
    };

    if (status) query.status = status;
    if (type) query.artifactType = type;

    const collaborations = await Collaboration.find(query)
      .populate('creator', 'username email')
      .populate('participants.user', 'username email')
      .populate('artifact', 'name type status')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      collaborations
    });
  } catch (error) {
    console.error('Error fetching collaboration sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collaboration sessions'
    });
  }
});

// Get a specific collaboration session
router.get('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findOne({
      _id: sessionId,
      $or: [
        { creator: userId },
        { 'participants.user': userId }
      ]
    })
    .populate('creator', 'username email')
    .populate('participants.user', 'username email')
    .populate('artifact', 'name type status content gameConfig')
    .populate('comments.user', 'username');

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration session not found'
      });
    }

    res.json({
      success: true,
      collaboration
    });
  } catch (error) {
    console.error('Error fetching collaboration session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collaboration session'
    });
  }
});

// Join a collaboration session
router.post('/sessions/:sessionId/join', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { role = 'editor' } = req.body;

    const collaboration = await Collaboration.findById(sessionId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration session not found'
      });
    }

    // Check if user is already a participant
    const existingParticipant = collaboration.participants.find(
      p => p.user.toString() === userId
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'Already a participant in this session'
      });
    }

    // Check if session is full
    if (collaboration.participants.length >= collaboration.settings.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Collaboration session is full'
      });
    }

    // Add user as participant
    collaboration.participants.push({
      user: userId,
      role,
      joinedAt: new Date()
    });

    await collaboration.save();
    await collaboration.populate('participants.user', 'username email');

    res.json({
      success: true,
      collaboration,
      message: 'Joined collaboration session successfully'
    });
  } catch (error) {
    console.error('Error joining collaboration session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join collaboration session'
    });
  }
});

// Leave a collaboration session
router.post('/sessions/:sessionId/leave', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findById(sessionId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration session not found'
      });
    }

    // Check if user is the creator
    if (collaboration.creator.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Creator cannot leave the session. Transfer ownership or delete the session.'
      });
    }

    // Remove user from participants
    collaboration.participants = collaboration.participants.filter(
      p => p.user.toString() !== userId
    );

    await collaboration.save();

    res.json({
      success: true,
      message: 'Left collaboration session successfully'
    });
  } catch (error) {
    console.error('Error leaving collaboration session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave collaboration session'
    });
  }
});

// Update collaboration session settings
router.put('/sessions/:sessionId/settings', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { settings } = req.body;

    const collaboration = await Collaboration.findById(sessionId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration session not found'
      });
    }

    // Only creator can update settings
    if (collaboration.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can update session settings'
      });
    }

    collaboration.settings = {
      ...collaboration.settings,
      ...settings
    };

    await collaboration.save();

    res.json({
      success: true,
      collaboration,
      message: 'Session settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating collaboration settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session settings'
    });
  }
});

// Add comment to collaboration session
router.post('/sessions/:sessionId/comments', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { content, type = 'general' } = req.body;

    const collaboration = await Collaboration.findById(sessionId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration session not found'
      });
    }

    // Check if user is a participant
    const isParticipant = collaboration.participants.some(
      p => p.user.toString() === userId
    );

    if (!isParticipant && collaboration.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Must be a participant to add comments'
      });
    }

    const comment = {
      user: userId,
      content,
      type,
      timestamp: new Date()
    };

    collaboration.comments.push(comment);
    await collaboration.save();
    await collaboration.populate('comments.user', 'username');

    res.json({
      success: true,
      comment: collaboration.comments[collaboration.comments.length - 1],
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
});

// Save artifact progress in collaboration
router.post('/sessions/:sessionId/save', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { artifactData, version } = req.body;

    const collaboration = await Collaboration.findById(sessionId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration session not found'
      });
    }

    // Check if user is a participant with edit permissions
    const participant = collaboration.participants.find(
      p => p.user.toString() === userId
    );

    if (!participant && collaboration.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Must be a participant to save changes'
      });
    }

    if (participant && !['owner', 'editor'].includes(participant.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to save changes'
      });
    }

    // Create or update artifact
    let artifact;
    if (collaboration.artifact) {
      // Update existing artifact
      artifact = await Artifact.findById(collaboration.artifact);
      if (!artifact) {
        return res.status(404).json({
          success: false,
          message: 'Associated artifact not found'
        });
      }

      // Save version history
      if (!artifact.versionHistory) {
        artifact.versionHistory = [];
      }

      artifact.versionHistory.push({
        version: artifact.versionHistory.length + 1,
        data: {
          name: artifact.name,
          description: artifact.description,
          content: artifact.content,
          gameConfig: artifact.gameConfig,
          media: artifact.media
        },
        savedBy: userId,
        timestamp: new Date()
      });

      // Update artifact with new data
      Object.assign(artifact, artifactData);
      artifact.lastModifiedBy = userId;
      artifact.lastModifiedAt = new Date();
    } else {
      // Create new artifact
      artifact = new Artifact({
        ...artifactData,
        createdBy: collaboration.creator,
        collaborators: collaboration.participants.map(p => p.user),
        collaborationSession: sessionId,
        versionHistory: [{
          version: 1,
          data: artifactData,
          savedBy: userId,
          timestamp: new Date()
        }]
      });
    }

    await artifact.save();

    // Update collaboration session
    collaboration.artifact = artifact._id;
    collaboration.lastActivity = new Date();
    collaboration.lastActivityBy = userId;
    await collaboration.save();

    res.json({
      success: true,
      artifact,
      message: 'Progress saved successfully'
    });
  } catch (error) {
    console.error('Error saving collaboration progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save progress'
    });
  }
});

// Publish collaboration artifact
router.post('/sessions/:sessionId/publish', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findById(sessionId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration session not found'
      });
    }

    // Only creator can publish
    if (collaboration.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can publish the artifact'
      });
    }

    if (!collaboration.artifact) {
      return res.status(400).json({
        success: false,
        message: 'No artifact to publish'
      });
    }

    const artifact = await Artifact.findById(collaboration.artifact);
    if (!artifact) {
      return res.status(404).json({
        success: false,
        message: 'Associated artifact not found'
      });
    }

    // Publish the artifact
    artifact.status = 'published';
    artifact.publishedAt = new Date();
    artifact.publishedBy = userId;
    await artifact.save();

    // Update collaboration status
    collaboration.status = 'completed';
    collaboration.completedAt = new Date();
    await collaboration.save();

    res.json({
      success: true,
      artifact,
      message: 'Artifact published successfully'
    });
  } catch (error) {
    console.error('Error publishing collaboration artifact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish artifact'
    });
  }
});

// Get collaboration analytics
router.get('/sessions/:sessionId/analytics', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const collaboration = await Collaboration.findById(sessionId);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration session not found'
      });
    }

    // Only creator can view analytics
    if (collaboration.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can view analytics'
      });
    }

    // Calculate analytics
    const analytics = {
      totalParticipants: collaboration.participants.length,
      totalComments: collaboration.comments.length,
      sessionDuration: collaboration.completedAt 
        ? collaboration.completedAt - collaboration.createdAt
        : Date.now() - collaboration.createdAt,
      participantActivity: collaboration.participants.map(p => ({
        userId: p.user,
        role: p.role,
        joinedAt: p.joinedAt,
        lastActivity: p.lastActivity
      })),
      commentActivity: collaboration.comments.reduce((acc, comment) => {
        const date = comment.timestamp.toDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}),
      versionHistory: collaboration.artifact ? 
        (await Artifact.findById(collaboration.artifact)).versionHistory?.length || 0 : 0
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error fetching collaboration analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

export default router; 