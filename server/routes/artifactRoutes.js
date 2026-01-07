import express from "express";
import authenticateToken from "../middleware/authMiddleware.js";
import {
  validateUnifiedArtifact,
  validateArtifactUpdate,
  convertLegacyArtifact,
  ensureUnifiedResponse
} from "../middleware/artifactValidation.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { validate, schemas } from "../middleware/validation.js";
import {
  createArtifact,
  createCreativeArtifact,
  getArtifacts,
  getArtifactById,
  updateArtifact,
  deleteArtifact,
  getGameProgress,
  saveGameProgress,
  completeArtifact,
  completeArtifactWithRewards,
  getHint,
  getInteractiveHint,
  getPlayerProgress,
  savePlayerProgress,
  voteOnArtifact,
  addComment,
  recordView,
  recordShare,
  recordInteraction,
  rateArtifact,
  addToCollection,
  getMessage,
  updateMessage,
  deleteMessage,
  unlockArtifact,
  seedArtifacts,
  getMarketplace,
  shareArtifact,
  unshareArtifact,
  discoverArtifact,
  listInMarketplace,
  removeFromMarketplace,
  getFeatured,
  searchArtifacts
} from "../controllers/artifactController.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for artifact attachments and icons
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;
    
    // Choose directory based on file field name
    if (file.fieldname === 'artifactIcon') {
      uploadDir = path.join(process.cwd(), 'public/uploads/icons');
    } else {
      uploadDir = path.join(process.cwd(), 'public/uploads/artifacts');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    // Name files differently based on type
    if (file.fieldname === 'artifactIcon') {
      cb(null, 'icon-' + uniqueSuffix + ext);
    } else {
      cb(null, 'artifact-' + uniqueSuffix + ext);
    }
  }
});

// File filter to allow various file types
const fileFilter = (req, file, cb) => {
  // Only allow images for icons
  if (file.fieldname === 'artifactIcon') {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type for icon. Only images are allowed.'), false);
    }
    return;
  }
  
  // For attachments, allow more file types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', // Images
    'audio/mpeg', 'audio/wav', 'audio/ogg', // Audio
    'video/mp4', 'video/webm', // Video
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Documents
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, audio, video, and documents are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Configure the upload fields to accept both attachment and artifactIcon
const uploadFields = upload.fields([
  { name: 'attachment', maxCount: 1 },
  { name: 'artifactIcon', maxCount: 1 }
]);

/* ────────────────────────────────
   🔹 CREATE ARTIFACT (UNIFIED MODEL)
──────────────────────────────── */
router.post("/",
  authenticateToken,
  uploadFields,
  convertLegacyArtifact,
  validateUnifiedArtifact,
  ensureUnifiedResponse,
  createArtifact
);

/* ────────────────────────────────
   🔹 FETCH ALL ARTIFACTS (UNIFIED)
──────────────────────────────── */
router.get("/", ensureUnifiedResponse, getArtifacts);

/* ────────────────────────────────
<<<<<<< HEAD
   🔹 GAME ARTIFACT PROGRESS TRACKING
──────────────────────────────── */

// Get game progress for an artifact
router.get("/:id/progress", authenticateToken, getGameProgress);

// Save game progress for an artifact
router.post("/:id/progress", authenticateToken, saveGameProgress);

// Mark artifact as completed and award rewards
router.post("/:id/complete", authenticateToken, completeArtifact);

// Get hint for puzzle artifact
router.post("/:id/hint", authenticateToken, getHint);

/* ────────────────────────────────
   🔹 SEED GAME ARTIFACTS
──────────────────────────────── */
router.post("/admin/seed", seedArtifacts);

// Artifact sharing and marketplace routes

// Get public marketplace artifacts
router.get('/marketplace', getMarketplace);

/* ────────────────────────────────
   🔹 FETCH A SINGLE ARTIFACT BY ID (UNIFIED)
──────────────────────────────── */
router.get("/:id", ensureUnifiedResponse, getArtifactById);

/* ────────────────────────────────
   🔹 UPDATE ARTIFACT (UNIFIED)
──────────────────────────────── */
router.put("/:id",
  authenticateToken,
  uploadFields,
  convertLegacyArtifact,
  validateArtifactUpdate,
  ensureUnifiedResponse,
  updateArtifact
);

/* ────────────────────────────────
   🔹 MESSAGE OPERATIONS
──────────────────────────────── */
router.get("/:id/message", authenticateToken, getMessage);
router.put("/:id/message", authenticateToken, updateMessage);
router.delete("/:id/message", authenticateToken, deleteMessage);

/* ────────────────────────────────
   🔹 DELETE ARTIFACT
──────────────────────────────── */
router.delete("/:id", authenticateToken, deleteArtifact);

/* ────────────────────────────────
   🔹 SOLVE RIDDLE TO UNLOCK ARTIFACT
──────────────────────────────── */
router.post("/unlock/:id", authenticateToken, unlockArtifact);

/* ────────────────────────────────
   🔹 SOCIAL FEATURES
──────────────────────────────── */
router.post("/:id/vote", authenticateToken, voteOnArtifact);
router.post("/:id/comment", authenticateToken, addComment);
router.post("/:id/view", authenticateToken, recordView);
router.post("/:id/share", authenticateToken, recordShare);
router.post("/:id/interact", authenticateToken, recordInteraction);

/* ────────────────────────────────
   🔹 INTERACTIVE ARTIFACT PROGRESS
──────────────────────────────── */
router.get('/:id/progress', authenticateToken, getPlayerProgress);
router.post('/:id/progress', authenticateToken, savePlayerProgress);
router.post('/:id/hint', authenticateToken, getInteractiveHint);

// Content Creation - Create new creative artifact with media upload
router.post('/', authenticateToken, upload.array('media', 10), createCreativeArtifact);

// Power Progression - Complete artifact and unlock rewards
router.post('/:id/complete', authenticateToken, completeArtifactWithRewards);

// Social Features - Rate and review artifact
router.post('/:id/rate', authenticateToken, rateArtifact);

// Discovery Features - Get featured content
router.get('/featured', getFeatured);

// Discovery Features - Search and filter content
router.get('/search', searchArtifacts);

// Collections - Add artifact to user's collection
router.post('/:id/collect', authenticateToken, async (req, res) => {
  try {
    const { collectionName = 'Favorites', tags = [], notes = '' } = req.body;
    const artifactId = req.params.id;
    const userId = req.user.id;

    const artifact = await Artifact.findById(artifactId);
    if (!artifact) {
      return res.status(404).json({
        success: false,
        message: 'Artifact not found'
      });
    }

    const user = await User.findById(userId);
    
    // Find or create collection
    let collection = user.collections.find(c => c.name === collectionName);
    if (!collection) {
      collection = user.createCollection(collectionName, '', false);
    }

    // Add to collection
    const result = user.addToCollection(
      user.collections.indexOf(collection),
      artifactId
    );

    // Also add to artifact's collections
    artifact.addToCollection(userId, collectionName, tags, notes);

    await user.save();
    await artifact.save();

    res.json({
      success: true,
      collection,
      message: 'Added to collection successfully!'
    });

  } catch (error) {
    console.error('Error adding to collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to collection',
      error: error.message
    });
  }
});

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

// Share artifact publicly
router.post('/:id/share', authenticateToken, validate(schemas.artifact.share), async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    
    if (!artifact) {
      return res.status(404).json({ message: 'Artifact not found' });
    }
    
    if (artifact.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to share this artifact' });
    }
    
    artifact.sharePublicly();
    await artifact.save();
    
    res.json({ 
      message: 'Artifact shared successfully',
      artifact: {
        id: artifact._id,
        name: artifact.name,
        isShared: artifact.isShared,
        sharedAt: artifact.sharedAt
      }
    });
  } catch (error) {
    console.error('Error sharing artifact:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unshare artifact
router.post('/:id/unshare', authenticateToken, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    
    if (!artifact) {
      return res.status(404).json({ message: 'Artifact not found' });
    }
    
    if (artifact.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to unshare this artifact' });
    }
    
    artifact.unsharePublicly();
    await artifact.save();
    
    res.json({ 
      message: 'Artifact unshared successfully',
      artifact: {
        id: artifact._id,
        name: artifact.name,
        isShared: artifact.isShared
      }
    });
  } catch (error) {
    console.error('Error unsharing artifact:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Discover artifact (increment discovery count)
router.post('/:id/discover', authenticateToken, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    
    if (!artifact) {
      return res.status(404).json({ message: 'Artifact not found' });
    }
    
    if (artifact.creator.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot discover your own artifact' });
    }
    
    artifact.incrementDiscoveryCount();
    await artifact.save();
    
    res.json({ 
      message: 'Artifact discovered!',
      discoveryCount: artifact.discoveryCount
    });
  } catch (error) {
    console.error('Error discovering artifact:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List artifact in marketplace
router.post('/:id/marketplace', authenticateToken, validate(schemas.artifact.share), async (req, res) => {
  try {
    const { price = 0, category = 'new', tags = [], description = '' } = req.body;
    
    const artifact = await Artifact.findById(req.params.id);
    
    if (!artifact) {
      return res.status(404).json({ message: 'Artifact not found' });
    }
    
    if (artifact.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to list this artifact' });
    }
    
    artifact.listInMarketplace(price, category, tags, description);
    await artifact.save();
    
    res.json({ 
      message: 'Artifact listed in marketplace successfully',
      artifact: {
        id: artifact._id,
        name: artifact.name,
        marketplace: artifact.marketplace
      }
    });
  } catch (error) {
    console.error('Error listing artifact in marketplace:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove artifact from marketplace
router.delete('/:id/marketplace', authenticateToken, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    
    if (!artifact) {
      return res.status(404).json({ message: 'Artifact not found' });
    }
    
    if (artifact.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to remove this artifact' });
    }
    
    artifact.removeFromMarketplace();
    await artifact.save();
    
    res.json({ 
      message: 'Artifact removed from marketplace successfully',
      artifact: {
        id: artifact._id,
        name: artifact.name,
        marketplace: artifact.marketplace
      }
    });
  } catch (error) {
    console.error('Error removing artifact from marketplace:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
