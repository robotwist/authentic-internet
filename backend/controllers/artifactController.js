import Artifact from "../models/Artifact.js";
import User from "../models/User.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper functions for power and achievement systems
function getPowerName(powerId) {
  const powerNames = {
    'speed_boost': 'Speed Boost',
    'double_jump': 'Double Jump',
    'wall_climb': 'Wall Climbing',
    'invisibility': 'Invisibility',
    'flight': 'Flight',
    'time_manipulation': 'Time Manipulation',
    'elemental_control': 'Elemental Control',
    'telepathy': 'Telepathy',
    'shape_shifting': 'Shape Shifting',
    'energy_projection': 'Energy Projection'
  };
  return powerNames[powerId] || powerId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getPowerDescription(powerId) {
  const powerDescriptions = {
    'speed_boost': 'Move 50% faster through the world',
    'double_jump': 'Jump twice in mid-air',
    'wall_climb': 'Scale vertical surfaces',
    'invisibility': 'Become invisible to enemies for 10 seconds',
    'flight': 'Fly freely through any area',
    'time_manipulation': 'Slow down time for 5 seconds',
    'elemental_control': 'Control fire, water, earth, and air',
    'telepathy': 'Read NPC thoughts and unlock hidden dialogue',
    'shape_shifting': 'Transform into different creatures',
    'energy_projection': 'Fire energy blasts at obstacles'
  };
  return powerDescriptions[powerId] || 'A mysterious power awaits...';
}

function getAchievementName(achievementId) {
  const achievementNames = {
    'first_completion': 'First Steps',
    'speed_runner': 'Speed Runner',
    'perfectionist': 'Perfectionist',
    'explorer': 'Explorer',
    'content_creator': 'Content Creator',
    'social_butterfly': 'Social Butterfly',
    'critic': 'Critic',
    'collector': 'Collector'
  };
  return achievementNames[achievementId] || achievementId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getAchievementDescription(achievementId) {
  const descriptions = {
    'first_completion': 'Complete your first artifact',
    'speed_runner': 'Complete an artifact in under 2 minutes',
    'perfectionist': 'Complete an artifact with a perfect score',
    'explorer': 'Discover 10 different areas',
    'content_creator': 'Publish your first creation',
    'social_butterfly': 'Follow 5 other creators',
    'critic': 'Rate 10 different artifacts',
    'collector': 'Add 20 artifacts to your collections'
  };
  return descriptions[achievementId] || 'A special achievement';
}

function getAchievementIcon(achievementId) {
  const icons = {
    'first_completion': '🎯',
    'speed_runner': '⚡',
    'perfectionist': '💎',
    'explorer': '🗺️',
    'content_creator': '🎨',
    'social_butterfly': '👥',
    'critic': '⭐',
    'collector': '📚'
  };
  return icons[achievementId] || '🏆';
}

/* ────────────────────────────────
   🔹 CRUD OPERATIONS
──────────────────────────────── */

// Create artifact (unified model)
export const createArtifact = async (req, res) => {
  try {
    const artifactData = req.body;

    // Generate unique ID if not provided
    if (!artifactData.id) {
      artifactData.id = `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Process uploaded files
    if (req.files) {
      // Handle attachment
      if (req.files.attachment && req.files.attachment[0]) {
        const file = req.files.attachment[0];
        const fileUrl = '/uploads/artifacts/' + file.filename;

        // Add to media array
        if (!artifactData.media) artifactData.media = [];
        artifactData.media.push(fileUrl);

        // Set legacy attachment fields for backward compatibility
        artifactData.attachment = fileUrl;
        artifactData.attachmentOriginalName = file.originalname;

        // Determine attachment type based on mimetype
        if (file.mimetype.startsWith('image/')) {
          artifactData.attachmentType = 'image';
        } else if (file.mimetype.startsWith('audio/')) {
          artifactData.attachmentType = 'audio';
        } else if (file.mimetype.startsWith('video/')) {
          artifactData.attachmentType = 'video';
        } else {
          artifactData.attachmentType = 'document';
        }
      }

      // Handle custom icon
      if (req.files.artifactIcon && req.files.artifactIcon[0]) {
        const iconFile = req.files.artifactIcon[0];
        artifactData.image = '/uploads/icons/' + iconFile.filename;
      }
    }

    // Create the artifact
    const newArtifact = new Artifact(artifactData);
    await newArtifact.save();

    res.status(201).json({
      success: true,
      message: "Artifact created successfully!",
      artifact: newArtifact.toUnifiedFormat()
    });
  } catch (error) {
    console.error("Error creating artifact:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create artifact.",
      details: error.message
    });
  }
};

// Create creative artifact with media upload
export const createCreativeArtifact = async (req, res) => {
  try {
    const {
      name,
      description,
      contentType,
      area,
      visibility,
      tags,
      location,
      content,
      writingConfig,
      artConfig,
      musicConfig,
      gameConfig,
      completionRewards
    } = req.body;

    // Parse JSON fields
    const parsedLocation = JSON.parse(location || '{"x": 0, "y": 0}');
    const parsedTags = JSON.parse(tags || '[]');
    const parsedCompletionRewards = JSON.parse(completionRewards || '{}');

    // Parse content-specific configs
    let typeConfig = {};
    if (contentType === 'writing' && writingConfig) {
      typeConfig.writingConfig = JSON.parse(writingConfig);
    } else if (contentType === 'art' && artConfig) {
      typeConfig.artConfig = JSON.parse(artConfig);
    } else if (contentType === 'music' && musicConfig) {
      typeConfig.musicConfig = JSON.parse(musicConfig);
    } else if (contentType === 'game' && gameConfig) {
      typeConfig.gameConfig = JSON.parse(gameConfig);
    }

    // Process uploaded media files
    const mediaFiles = req.files?.map(file => ({
      type: file.mimetype.startsWith('image/') ? 'image' :
            file.mimetype.startsWith('audio/') ? 'audio' :
            file.mimetype.startsWith('video/') ? 'video' : 'document',
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      description: file.originalname
    })) || [];

    // Create artifact
    const artifact = new Artifact({
      name,
      description,
      contentType,
      area,
      visibility,
      tags: parsedTags,
      location: parsedLocation,
      content,
      creator: req.user.id,
      completionRewards: parsedCompletionRewards,
      media: mediaFiles,
      isInteractive: contentType === 'game',
      allowsUserProgress: contentType === 'game',
      ...typeConfig
    });

    await artifact.save();

    // Update user creator stats
    const user = await User.findById(req.user.id);
    user.isCreator = true;
    if (!user.creatorStats) {
      user.creatorStats = {
        totalArtifacts: 0,
        totalPlays: 0,
        totalRatings: 0,
        averageRating: 0,
        totalFavorites: 0,
        featuredCount: 0
      };
    }
    user.creatorStats.totalArtifacts += 1;
    user.creatorStats.lastPublished = new Date();
    await user.save();

    // Grant creator achievement
    user.addAchievement('content_creator', 'Content Creator', 'Published your first creation', '🎨', 'common', artifact._id);
    await user.save();

    res.status(201).json({
      success: true,
      artifact: await artifact.populate('creator', 'username displayName avatar'),
      message: 'Content published successfully!'
    });

  } catch (error) {
    console.error('Error creating creative artifact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create artifact',
      error: error.message
    });
  }
};

// Fetch all artifacts (unified)
export const getArtifacts = async (req, res) => {
  try {
    const { area, type, creator, visibility, page = 1, limit = 20, tags } = req.query;

    const filter = {};
    if (area) filter.area = area;
    if (type) filter.type = type;
    if (creator) filter.creator = creator;
    if (visibility) filter.visibility = visibility;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray };
    }

    const artifacts = await Artifact.find(filter)
      .populate('creator', 'username email')
      .populate({
        path: 'comments.user',
        select: 'username'
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Artifact.countDocuments(filter);

    // Convert to unified format
    const unifiedArtifacts = artifacts.map(artifact => {
      const unified = {
        id: artifact.id,
        name: artifact.name,
        description: artifact.description,
        type: artifact.type,
        content: artifact.content,
        media: artifact.media || [],
        location: artifact.location,
        exp: artifact.exp || 0,
        visible: artifact.visible !== false,
        area: artifact.area,
        tags: artifact.tags || [],
        rating: artifact.rating || 0,
        reviews: artifact.reviews || [],
        remixOf: artifact.remixOf,
        createdBy: artifact.createdBy,
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
        interactions: artifact.interactions || [],
        properties: artifact.properties || {},
        userModifiable: artifact.userModifiable || {}
      };

      // Add legacy fields for backward compatibility
      if (artifact.messageText) unified.messageText = artifact.messageText;
      if (artifact.riddle) unified.riddle = artifact.riddle;
      if (artifact.unlockAnswer) unified.unlockAnswer = artifact.unlockAnswer;
      if (artifact.isExclusive !== undefined) unified.isExclusive = artifact.isExclusive;
      if (artifact.status) unified.status = artifact.status;
      if (artifact.image) unified.image = artifact.image;
      if (artifact.attachment) unified.attachment = artifact.attachment;
      if (artifact.theme) unified.theme = artifact.theme;
      if (artifact.dedication) unified.dedication = artifact.dedication;
      if (artifact.significance) unified.significance = artifact.significance;

      return unified;
    });

    res.json({
      success: true,
      artifacts: unifiedArtifacts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch artifacts',
      details: error.message
    });
  }
};

// Fetch single artifact by ID (unified)
export const getArtifactById = async (req, res) => {
  try {
    const artifact = await Artifact.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { id: req.params.id }
      ]
    })
      .populate('creator', 'username email')
      .populate({
        path: 'comments.user',
        select: 'username'
      });

    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: 'Artifact not found'
      });
    }

    // Increment view count
    artifact.views = (artifact.views || 0) + 1;
    await artifact.save();

    res.json({
      success: true,
      artifact: artifact.toUnifiedFormat()
    });
  } catch (error) {
    console.error('Error fetching artifact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch artifact',
      details: error.message
    });
  }
};

// Update artifact (unified)
export const updateArtifact = async (req, res) => {
  try {
    const artifactId = req.params.id;
    const artifact = await Artifact.findOne({
      $or: [
        { _id: artifactId.match(/^[0-9a-fA-F]{24}$/) ? artifactId : null },
        { id: artifactId }
      ]
    });

    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: "Artifact not found."
      });
    }

    // Check if user is the creator
    if (artifact.createdBy !== req.user.userId && artifact.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "You can only edit your own artifacts."
      });
    }

    // Update fields from body
    Object.keys(req.body).forEach(key => {
      if (key !== 'attachment' && key !== 'artifactIcon' && key !== 'id') {
        artifact[key] = req.body[key];
      }
    });

    // Handle file uploads
    if (req.files) {
      // Handle attachment
      if (req.files.attachment && req.files.attachment[0]) {
        // Delete old attachment if exists
        if (artifact.attachment) {
          try {
            const oldFilePath = path.join(process.cwd(), 'public', artifact.attachment);
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          } catch (error) {
            console.error("Error deleting old attachment:", error);
          }
        }

        const file = req.files.attachment[0];
        const fileUrl = '/uploads/artifacts/' + file.filename;

        // Update media array
        if (!artifact.media) artifact.media = [];
        artifact.media.push(fileUrl);

        artifact.attachment = fileUrl;
        artifact.attachmentOriginalName = file.originalname;

        if (file.mimetype.startsWith('image/')) {
          artifact.attachmentType = 'image';
        } else if (file.mimetype.startsWith('audio/')) {
          artifactData.attachmentType = 'audio';
        } else if (file.mimetype.startsWith('video/')) {
          artifact.attachmentType = 'video';
        } else {
          artifact.attachmentType = 'document';
        }
      }

      // Handle icon
      if (req.files.artifactIcon && req.files.artifactIcon[0]) {
        const iconFile = req.files.artifactIcon[0];
        artifact.image = '/uploads/icons/' + iconFile.filename;
      }
    }

    await artifact.save();
    await artifact.populate('creator', 'username email');

    res.json({
      success: true,
      message: "Artifact updated successfully!",
      artifact: artifact.toUnifiedFormat()
    });
  } catch (error) {
    console.error("Error updating artifact:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update artifact.",
      details: error.message
    });
  }
};

// Delete artifact
export const deleteArtifact = async (req, res) => {
  try {
    const deletedArtifact = await Artifact.findByIdAndDelete(req.params.id);
    if (!deletedArtifact || deletedArtifact.type !== "artifact") {
      return res.status(404).json({ error: "Artifact not found." });
    }

    res.json({ message: "Artifact deleted successfully!" });
  } catch (error) {
    console.error("Error deleting artifact:", error);
    res.status(500).json({ error: "Failed to delete artifact." });
  }
};