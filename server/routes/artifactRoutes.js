import express from "express";
import Artifact from "../models/Artifact.js";
import User from "../models/User.js";
import authenticateToken from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

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
   🔹 CREATE ARTIFACT (WITH MESSAGE)
──────────────────────────────── */
router.post("/", authenticateToken, uploadFields, async (req, res) => {
  try {
    const { name, description, content, riddle, unlockAnswer, area, isExclusive, location } = req.body;

    if (!name || !description || !content || !area || !location) {
      return res.status(400).json({ error: "All required fields must be provided." });
    }

    const newArtifact = new Artifact({
      name,
      description,
      content,
      riddle,
      unlockAnswer,
      area,
      isExclusive,
      location,
      creator: req.user.userId,
    });

    // Add attachment if provided
    if (req.files && req.files.attachment && req.files.attachment[0]) {
      const file = req.files.attachment[0];
      newArtifact.attachment = '/uploads/artifacts/' + file.filename;
      newArtifact.attachmentOriginalName = file.originalname;
      
      // Determine attachment type based on mimetype
      if (file.mimetype.startsWith('image/')) {
        newArtifact.attachmentType = 'image';
      } else if (file.mimetype.startsWith('audio/')) {
        newArtifact.attachmentType = 'audio';
      } else if (file.mimetype.startsWith('video/')) {
        newArtifact.attachmentType = 'video';
      } else {
        newArtifact.attachmentType = 'document';
      }
    }
    
    // Add custom icon if provided
    if (req.files && req.files.artifactIcon && req.files.artifactIcon[0]) {
      const iconFile = req.files.artifactIcon[0];
      newArtifact.image = '/uploads/icons/' + iconFile.filename;
    } else if (req.body.image) {
      // If no file upload but image path was provided
      newArtifact.image = req.body.image;
    }

    await newArtifact.save();
    res.status(201).json({ message: "Artifact created successfully!", artifact: newArtifact });
  } catch (error) {
    console.error("Error creating artifact:", error);
    res.status(500).json({ error: "Failed to create artifact." });
  }
});

/* ────────────────────────────────
   🔹 FETCH ALL ARTIFACTS
──────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const { area, type, creator, visibility, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (area) filter.area = area;
    if (type) filter.type = type;
    if (creator) filter.creator = creator;
    if (visibility) filter.visibility = visibility;

    const artifacts = await Artifact.find(filter)
      .populate('creator', 'username email')
      .populate('comments.user', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Artifact.countDocuments(filter);

    res.json({
      artifacts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    res.status(500).json({ error: 'Failed to fetch artifacts' });
  }
});

/* ────────────────────────────────
   🔹 GAME ARTIFACT PROGRESS TRACKING
──────────────────────────────── */

// Get game progress for an artifact
router.get("/:id/progress", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    
    // Find existing progress for this user and artifact
    const progressEntry = artifact.userProgress?.find(
      p => p.userId.toString() === userId.toString()
    );
    
    res.json({ 
      progress: progressEntry?.progressData || null,
      completed: progressEntry?.completed || false,
      attempts: progressEntry?.attempts || 0,
      bestScore: progressEntry?.bestScore || 0
    });
  } catch (error) {
    console.error('Error fetching game progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Save game progress for an artifact
router.post("/:id/progress", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { progress } = req.body;
    
    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    
    // Initialize userProgress array if it doesn't exist
    if (!artifact.userProgress) {
      artifact.userProgress = [];
    }
    
    // Find existing progress entry or create new one
    let progressEntry = artifact.userProgress.find(
      p => p.userId.toString() === userId.toString()
    );
    
    if (progressEntry) {
      progressEntry.progressData = progress;
      progressEntry.lastSaved = new Date();
    } else {
      progressEntry = {
        userId,
        progressData: progress,
        attempts: 1,
        completed: false,
        lastSaved: new Date(),
        startedAt: new Date()
      };
      artifact.userProgress.push(progressEntry);
    }
    
    await artifact.save();
    res.json({ success: true, progress: progressEntry });
  } catch (error) {
    console.error('Error saving game progress:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Mark artifact as completed and award rewards
router.post("/:id/complete", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { completionData, score, playTime } = req.body;
    
    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    
    // Initialize userProgress array if it doesn't exist
    if (!artifact.userProgress) {
      artifact.userProgress = [];
    }
    
    // Find existing progress entry
    let progressEntry = artifact.userProgress.find(
      p => p.userId.toString() === userId.toString()
    );
    
    if (progressEntry) {
      progressEntry.completed = true;
      progressEntry.completedAt = new Date();
      progressEntry.completionData = completionData;
      if (score > (progressEntry.bestScore || 0)) {
        progressEntry.bestScore = score;
      }
      if (playTime) {
        progressEntry.totalPlayTime = (progressEntry.totalPlayTime || 0) + playTime;
      }
    } else {
      progressEntry = {
        userId,
        completed: true,
        completedAt: new Date(),
        completionData,
        bestScore: score || 0,
        totalPlayTime: playTime || 0,
        attempts: 1
      };
      artifact.userProgress.push(progressEntry);
    }
    
    // Update artifact completion stats
    if (!artifact.completionStats) {
      artifact.completionStats = {
        totalAttempts: 0,
        totalCompletions: 0,
        averageScore: 0,
        topScore: 0,
        averagePlayTime: 0
      };
    }
    
    artifact.completionStats.totalCompletions += 1;
    if (score > artifact.completionStats.topScore) {
      artifact.completionStats.topScore = score;
    }
    
    // Recalculate averages
    const allCompletions = artifact.userProgress.filter(p => p.completed);
    const totalScores = allCompletions.reduce((sum, p) => sum + (p.bestScore || 0), 0);
    const totalPlayTimes = allCompletions.reduce((sum, p) => sum + (p.totalPlayTime || 0), 0);
    
    artifact.completionStats.averageScore = Math.round(totalScores / allCompletions.length);
    artifact.completionStats.averagePlayTime = Math.round(totalPlayTimes / allCompletions.length);
    
    await artifact.save();
    
    res.json({ 
      success: true, 
      rewards: artifact.completionRewards,
      stats: artifact.completionStats
    });
  } catch (error) {
    console.error('Error completing artifact:', error);
    res.status(500).json({ error: 'Failed to complete artifact' });
  }
});

// Get hint for puzzle artifact
router.post("/:id/hint", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { hintLevel } = req.body;
    
    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    
    // Generate context-aware hints based on artifact type
    let hint = '';
    const gameType = artifact.gameType || artifact.type;
    
    switch (gameType) {
      case 'shooter':
      case 'shooter_experience':
        const shooterHints = [
          "Use arrow keys or WASD to move and jump",
          "Press spacebar to shoot at enemies",
          "Watch out for boss attacks - they have patterns!",
          "Collect power-ups to increase your damage",
          "Try to stay moving to avoid enemy fire"
        ];
        hint = shooterHints[hintLevel % shooterHints.length];
        break;
        
      case 'text_adventure':
      case 'text_adventure_world':
        const textHints = [
          "Type 'look' to examine your surroundings",
          "Try 'inventory' to see what you're carrying",
          "Use 'go [direction]' to move around",
          "Many objects can be 'examined' for more details",
          "Save your progress frequently with 'save'"
        ];
        hint = textHints[hintLevel % textHints.length];
        break;
        
      case 'terminal':
      case 'terminal_challenge':
        const terminalHints = [
          "Start with 'ls' to list directory contents",
          "Use 'cd' to change directories",
          "Try 'grep' to search for specific text in files",
          "The 'find' command can locate files by name",
          "Read files with 'cat' or 'head'"
        ];
        hint = terminalHints[hintLevel % terminalHints.length];
        break;
        
      default:
        hint = "Explore and experiment - every artifact has its secrets!";
    }
    
    res.json({ hint, hintLevel: hintLevel + 1 });
  } catch (error) {
    console.error('Error getting hint:', error);
    res.status(500).json({ error: 'Failed to get hint' });
  }
});

/* ────────────────────────────────
   🔹 SEED GAME ARTIFACTS
──────────────────────────────── */
router.post("/admin/seed", async (req, res) => {
  try {
    // Import the seeding function
    const { seedArtifacts } = await import('../seed/artifacts.js');
    
    // Run the seeding
    const insertedArtifacts = await seedArtifacts(Artifact);
    
    res.json({ 
      message: `Successfully seeded ${insertedArtifacts.length} artifacts`,
      artifacts: insertedArtifacts.map(a => ({ 
        id: a._id, 
        name: a.name, 
        type: a.type, 
        area: a.area,
        position: a.position 
      }))
    });
  } catch (error) {
    console.error('Error seeding artifacts:', error);
    res.status(500).json({ error: 'Failed to seed artifacts: ' + error.message });
  }
});

/* ────────────────────────────────
   🔹 FETCH A SINGLE ARTIFACT BY ID
──────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id)
      .populate('creator', 'username email')
      .populate('comments.user', 'username');

    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    // Increment view count
    artifact.views += 1;
    await artifact.save();

    res.json(artifact);
  } catch (error) {
    console.error('Error fetching artifact:', error);
    res.status(500).json({ error: 'Failed to fetch artifact' });
  }
});

/* ────────────────────────────────
   🔹 UPDATE ARTIFACT (EDIT PROPERTIES)
──────────────────────────────── */
router.put("/:id", authenticateToken, uploadFields, async (req, res) => {
  try {
    const artifactId = req.params.id;
    const artifact = await Artifact.findById(artifactId);
    
    if (!artifact || artifact.type !== "artifact") {
      return res.status(404).json({ error: "Artifact not found." });
    }
    
    // Update basic fields from body
    Object.keys(req.body).forEach(key => {
      // Handle location object specially
      if (key === 'location[x]' || key === 'location[y]') {
        if (!artifact.location) artifact.location = {};
        if (key === 'location[x]') artifact.location.x = Number(req.body[key]);
        if (key === 'location[y]') artifact.location.y = Number(req.body[key]);
      } 
      // Handle boolean conversions
      else if (key === 'isExclusive') {
        artifact[key] = req.body[key] === 'true';
      }
      // Handle all other fields normally
      else if (key !== 'attachment' && key !== 'artifactIcon') {
        artifact[key] = req.body[key];
      }
    });
    
    // Add attachment if provided
    if (req.files && req.files.attachment && req.files.attachment[0]) {
      // If there was a previous attachment, delete it
      if (artifact.attachment) {
        try {
          const oldFilePath = path.join(process.cwd(), 'public', artifact.attachment);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        } catch (error) {
          console.error("Error deleting old attachment:", error);
          // Continue with the update even if file deletion fails
        }
      }
      
      // Update with new attachment
      const file = req.files.attachment[0];
      artifact.attachment = '/uploads/artifacts/' + file.filename;
      artifact.attachmentOriginalName = file.originalname;
      
      // Determine attachment type based on mimetype
      if (file.mimetype.startsWith('image/')) {
        artifact.attachmentType = 'image';
      } else if (file.mimetype.startsWith('audio/')) {
        artifact.attachmentType = 'audio';
      } else if (file.mimetype.startsWith('video/')) {
        artifact.attachmentType = 'video';
      } else {
        artifact.attachmentType = 'document';
      }
    }
    
    // Add custom icon if provided
    if (req.files && req.files.artifactIcon && req.files.artifactIcon[0]) {
      // If there was a previous custom icon, delete it
      if (artifact.image && artifact.image.startsWith('/uploads/icons/')) {
        try {
          const oldIconPath = path.join(process.cwd(), 'public', artifact.image);
          if (fs.existsSync(oldIconPath)) {
            fs.unlinkSync(oldIconPath);
          }
        } catch (error) {
          console.error("Error deleting old icon:", error);
          // Continue with the update even if file deletion fails
        }
      }
      
      // Update with new icon
      const iconFile = req.files.artifactIcon[0];
      artifact.image = '/uploads/icons/' + iconFile.filename;
    } else if (req.body.image) {
      // If no file upload but image path was provided
      artifact.image = req.body.image;
    }
    
    await artifact.save();
    res.json({ message: "Artifact updated successfully!", artifact });
  } catch (error) {
    console.error("Error updating artifact:", error);
    res.status(500).json({ error: "Failed to update artifact." });
  }
});

/* ────────────────────────────────
   🔹 FETCH MESSAGE FROM ARTIFACT
──────────────────────────────── */
router.get("/:id/message", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Fetching message for artifact ID:", id);
    
    // Try to find the artifact in the database
    let artifact = await Artifact.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { id: id }
      ]
    });

    // If not found in database, check if it's a map artifact
    if (!artifact) {
      // Return empty message for map artifacts
      return res.json({ messageText: "" });
    }

    console.log("Found artifact:", artifact);
    res.json({ messageText: artifact.messageText || "" });
  } catch (error) {
    console.error("Error fetching message:", error);
    res.status(500).json({ error: "Failed to fetch message." });
  }
});

/* ────────────────────────────────
   🔹 UPDATE MESSAGE IN ARTIFACT
──────────────────────────────── */
router.put("/:id/message", authenticateToken, async (req, res) => {
  try {
    const { messageText } = req.body;
    const { id } = req.params;
    console.log("Updating message for artifact ID:", id);
    console.log("Message text:", messageText);
    
    // Try to find the artifact in the database
    let artifact = await Artifact.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { id: id }
      ]
    });

    // If not found in database, create a new artifact
    if (!artifact) {
      artifact = new Artifact({
        id: id,
        messageText: messageText,
        type: "artifact",
        name: "Map Artifact",
        area: "world",
        location: { x: 0, y: 0 }
      });
    } else {
      artifact.messageText = messageText;
    }

    await artifact.save();
    console.log("Saved artifact:", artifact);
    res.json({ message: "Message updated successfully!", artifact });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ error: "Failed to update message." });
  }
});

/* ────────────────────────────────
   🔹 DELETE MESSAGE FROM ARTIFACT
──────────────────────────────── */
router.delete("/:id/message", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting message for artifact ID:", id);
    
    // Try to find the artifact in the database
    let artifact = await Artifact.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { id: id }
      ]
    });

    // If not found in database, return success (nothing to delete)
    if (!artifact) {
      return res.json({ message: "Message deleted successfully!" });
    }

    artifact.messageText = "";
    await artifact.save();
    console.log("Cleared message from artifact:", artifact);
    res.json({ message: "Message deleted successfully!", artifact });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message." });
  }
});

/* ────────────────────────────────
   🔹 DELETE ARTIFACT
──────────────────────────────── */
router.delete("/:id", authenticateToken, async (req, res) => {
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
});

/* ────────────────────────────────
   🔹 SOLVE RIDDLE TO UNLOCK ARTIFACT
──────────────────────────────── */
router.post("/unlock/:id", authenticateToken, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    if (!artifact || artifact.type !== "artifact") {
      return res.status(404).json({ error: "Artifact not found." });
    }

    if (!artifact.unlockAnswer || artifact.unlockAnswer.toLowerCase() !== req.body.answer.toLowerCase()) {
      return res.status(400).json({ error: "Incorrect answer. Try again!" });
    }

    if (artifact.isExclusive) {
      artifact.foundBy = req.user.userId;
      await artifact.save();
    }

    res.json({ message: "You unlocked the artifact!", artifact });
  } catch (error) {
    console.error("Error unlocking artifact:", error);
    res.status(500).json({ error: "Failed to unlock artifact." });
  }
});

/* ────────────────────────────────
   🔹 VOTE ON ARTIFACT
──────────────────────────────── */
router.post("/:id/vote", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({ error: "Artifact not found." });
    }

    // Check if user has already voted
    if (artifact.voters.includes(userId)) {
      // Remove vote
      artifact.votes -= 1;
      artifact.voters = artifact.voters.filter(voter => voter.toString() !== userId);
      await artifact.save();
      return res.json({ message: "Vote removed", votes: artifact.votes });
    } else {
      // Add vote
      artifact.votes += 1;
      artifact.voters.push(userId);
      await artifact.save();
      return res.json({ message: "Vote added", votes: artifact.votes });
    }
  } catch (error) {
    console.error("Error voting on artifact:", error);
    res.status(500).json({ error: "Failed to vote on artifact." });
  }
});

/* ────────────────────────────────
   🔹 ADD COMMENT TO ARTIFACT
──────────────────────────────── */
router.post("/:id/comment", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    if (!text) {
      return res.status(400).json({ error: "Comment text is required." });
    }

    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({ error: "Artifact not found." });
    }

    artifact.comments.push({
      user: userId,
      text,
      createdAt: new Date()
    });

    await artifact.save();
    
    // Populate the user details for the new comment
    const populatedArtifact = await Artifact.findById(id)
      .populate('comments.user', 'username avatar');
    
    res.json({ 
      message: "Comment added", 
      comments: populatedArtifact.comments 
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment." });
  }
});

/* ────────────────────────────────
   🔹 RECORD ARTIFACT VIEW
──────────────────────────────── */
router.post("/:id/view", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({ error: "Artifact not found." });
    }

    artifact.views += 1;
    await artifact.save();
    
    res.json({ message: "View recorded", views: artifact.views });
  } catch (error) {
    console.error("Error recording view:", error);
    res.status(500).json({ error: "Failed to record view." });
  }
});

/* ────────────────────────────────
   🔹 SHARE ARTIFACT
──────────────────────────────── */
router.post("/:id/share", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({ error: "Artifact not found." });
    }

    artifact.shares += 1;
    await artifact.save();
    
    res.json({ message: "Share recorded", shares: artifact.shares });
  } catch (error) {
    console.error("Error recording share:", error);
    res.status(500).json({ error: "Failed to record share." });
  }
});

/* ────────────────────────────────
   🔹 RECORD ARTIFACT INTERACTION
──────────────────────────────── */
router.post("/:id/interact", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { interactionType } = req.body;
    const userId = req.user.userId;

    // Valid interaction types
    const validInteractions = ['view', 'vote', 'comment', 'share', 'save'];
    
    if (!validInteractions.includes(interactionType)) {
      return res.status(400).json({ 
        error: "Invalid interaction type", 
        validTypes: validInteractions 
      });
    }

    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({ error: "Artifact not found." });
    }

    // Don't reward self-interactions
    if (artifact.creator && artifact.creator.toString() === userId) {
      return res.json({ 
        message: "Self-interaction recorded", 
        rewardedExp: 0 
      });
    }

    // Record the interaction on the artifact
    switch (interactionType) {
      case 'view':
        artifact.views += 1;
        break;
      case 'vote':
        // Only add vote if user hasn't voted before
        if (!artifact.voters.includes(userId)) {
          artifact.votes += 1;
          artifact.voters.push(userId);
        }
        break;
      case 'comment':
        // Comment content should be handled by the comment endpoint
        // This just tracks the interaction for XP purposes
        break;
      case 'share':
        artifact.shares += 1;
        break;
      case 'save':
        // Saving to inventory is handled separately
        // This just tracks the interaction for XP purposes
        break;
    }
    
    await artifact.save();
    
    // Find creator to award experience
    if (artifact.creator) {
      const creator = await User.findById(artifact.creator);
      if (creator) {
        // Award experience based on interaction type
        let rewardedExp = 0;
        
        switch (interactionType) {
          case 'view':
            rewardedExp = 1; // 1 XP per view
            break;
          case 'vote':
            rewardedExp = 5; // 5 XP per vote
            break;
          case 'comment':
            rewardedExp = 10; // 10 XP per comment
            break;
          case 'share':
            rewardedExp = 15; // 15 XP per share
            break;
          case 'save':
            rewardedExp = 20; // 20 XP when someone saves the artifact
            break;
        }
        
        // Update creator's experience
        creator.experience = (creator.experience || 0) + rewardedExp;
        
        // Check if creator leveled up
        const newLevel = Math.floor(creator.experience / 100) + 1;
        if (newLevel > creator.level) {
          creator.level = newLevel;
          // Could add notifications or other level-up rewards here
        }
        
        await creator.save();
        
        return res.json({ 
          message: `Interaction recorded and ${rewardedExp} XP awarded to creator`, 
          rewardedExp, 
          newCreatorExp: creator.experience,
          newCreatorLevel: creator.level
        });
      }
    }
    
    res.json({ 
      message: "Interaction recorded", 
      rewardedExp: 0 
    });
  } catch (error) {
    console.error("Error recording interaction:", error);
    res.status(500).json({ error: "Failed to record interaction." });
  }
});

/* ────────────────────────────────
   🔹 GET PLAYER'S PROGRESS ON ARTIFACT
──────────────────────────────── */
router.get('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    if (!artifact.isInteractive) {
      return res.status(400).json({ error: 'This artifact is not interactive' });
    }

    const playerProgress = artifact.getPlayerProgress(req.user.id);
    
    if (!playerProgress) {
      return res.status(404).json({ error: 'No progress found' });
    }

    res.json(playerProgress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

/* ────────────────────────────────
   🔹 SAVE PLAYER'S PROGRESS ON ARTIFACT
──────────────────────────────── */
router.post('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { currentState, completed, timeSpent, attempts } = req.body;
    const artifact = await Artifact.findById(req.params.id);
    
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    if (!artifact.isInteractive) {
      return res.status(400).json({ error: 'This artifact is not interactive' });
    }

    // Check if player can attempt
    if (!artifact.canPlayerAttempt(req.user.id)) {
      return res.status(403).json({ error: 'Maximum attempts exceeded' });
    }

    // Find existing progress or create new
    let playerProgress = artifact.playerProgress.find(p => p.playerId.toString() === req.user.id);
    
    if (!playerProgress) {
      playerProgress = {
        playerId: req.user.id,
        attempts: 0,
        currentState: {},
        completed: false,
        hintsUsed: 0,
        timeSpent: 0,
        lastAttempt: new Date()
      };
      artifact.playerProgress.push(playerProgress);
    }

    // Update progress
    playerProgress.currentState = currentState;
    playerProgress.completed = completed;
    playerProgress.timeSpent += timeSpent || 0;
    playerProgress.attempts = attempts || playerProgress.attempts;
    playerProgress.lastAttempt = new Date();

    if (completed) {
      playerProgress.completedAt = new Date();
      
      // Grant rewards
      if (artifact.completionRewards) {
        const user = await User.findById(req.user.id);
        
        // Grant experience
        if (artifact.completionRewards.experience) {
          user.experience = (user.experience || 0) + artifact.completionRewards.experience;
        }

        // Grant achievements
        if (artifact.completionRewards.achievements) {
          artifact.completionRewards.achievements.forEach(achievementId => {
            if (!user.achievements) user.achievements = [];
            if (!user.achievements.some(a => a.id === achievementId)) {
              user.achievements.push({
                id: achievementId,
                unlockedAt: new Date(),
                artifactId: artifact._id
              });
            }
          });
        }

        await user.save();
      }
    }

    // Update completion stats
    artifact.updateCompletionStats();
    await artifact.save();

    res.json({ 
      success: true, 
      progress: playerProgress,
      rewards: completed ? artifact.completionRewards : null
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

/* ────────────────────────────────
   🔹 GET HINT FOR ARTIFACT
──────────────────────────────── */
router.post('/:id/hint', authenticateToken, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    if (!artifact.isInteractive || !artifact.gameConfig.hintsEnabled) {
      return res.status(400).json({ error: 'Hints not available for this artifact' });
    }

    let playerProgress = artifact.playerProgress.find(p => p.playerId.toString() === req.user.id);
    
    if (!playerProgress) {
      return res.status(404).json({ error: 'No progress found' });
    }

    if (playerProgress.completed) {
      return res.status(400).json({ error: 'Puzzle already completed' });
    }

    // Generate hint based on puzzle type
    let hint = '';
    switch (artifact.puzzleType) {
      case 'riddle':
        const answer = artifact.unlockAnswer.toLowerCase();
        if (playerProgress.hintsUsed === 0) {
          hint = `The answer has ${answer.length} letters.`;
        } else if (playerProgress.hintsUsed === 1) {
          hint = `The answer starts with "${answer.charAt(0).toUpperCase()}".`;
        } else {
          hint = `The answer contains the letter "${answer.charAt(Math.floor(answer.length / 2))}".`;
        }
        break;
      case 'textAdventure':
        hint = 'Try examining objects and interacting with your environment.';
        break;
      case 'dialogChallenge':
        hint = 'Think carefully about your conversation choices.';
        break;
      default:
        hint = 'Think about the problem from a different angle.';
    }

    playerProgress.hintsUsed += 1;
    await artifact.save();

    res.json({ hint, hintsUsed: playerProgress.hintsUsed });
  } catch (error) {
    console.error('Error getting hint:', error);
    res.status(500).json({ error: 'Failed to get hint' });
  }
});

// Content Creation - Create new creative artifact with media upload
router.post('/', authenticateToken, upload.array('media', 10), async (req, res) => {
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
    console.error('Error creating artifact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create artifact',
      error: error.message
    });
  }
});

// Power Progression - Complete artifact and unlock rewards
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { score = 0, attempts = 1, timeSpent = 0 } = req.body;
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

    // Record completion
    const completionResult = user.completeArtifact(artifactId, score, attempts, timeSpent);
    
    // Grant experience
    const expResult = user.addExperience(artifact.completionRewards?.experience || 10);
    
    // Unlock powers
    const unlockedPowers = [];
    if (artifact.completionRewards?.powers) {
      for (const powerId of artifact.completionRewards.powers) {
        const powerResult = user.unlockPower(
          powerId,
          getPowerName(powerId),
          getPowerDescription(powerId),
          artifact.name
        );
        if (powerResult.unlocked || powerResult.upgraded) {
          unlockedPowers.push(powerResult.power);
        }
      }
    }

    // Unlock areas
    const unlockedAreas = [];
    if (artifact.completionRewards?.areas) {
      for (const areaId of artifact.completionRewards.areas) {
        const areaResult = user.unlockArea(areaId, `Completed ${artifact.name}`);
        if (areaResult.unlocked) {
          unlockedAreas.push(areaId);
        }
      }
    }

    // Grant achievements
    const newAchievements = [];
    if (artifact.completionRewards?.achievements) {
      for (const achievementId of artifact.completionRewards.achievements) {
        const achievement = user.addAchievement(
          achievementId,
          getAchievementName(achievementId),
          getAchievementDescription(achievementId),
          getAchievementIcon(achievementId),
          'common',
          artifactId
        );
        if (achievement.unlocked) {
          newAchievements.push(achievement.achievement);
        }
      }
    }

    await user.save();

    // Update artifact completion stats
    artifact.views += 1;
    artifact.updateCompletionStats();
    await artifact.save();

    res.json({
      success: true,
      completion: completionResult,
      rewards: {
        experience: expResult,
        powers: unlockedPowers,
        areas: unlockedAreas,
        achievements: newAchievements
      },
      message: 'Artifact completed successfully!'
    });

  } catch (error) {
    console.error('Error completing artifact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete artifact',
      error: error.message
    });
  }
});

// Social Features - Rate and review artifact
router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { rating, review = '' } = req.body;
    const artifactId = req.params.id;
    const userId = req.user.id;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const artifact = await Artifact.findById(artifactId);
    if (!artifact) {
      return res.status(404).json({
        success: false,
        message: 'Artifact not found'
      });
    }

    // Add or update rating
    artifact.addRating(userId, rating, review);
    await artifact.save();

    // Update creator stats
    const creator = await User.findById(artifact.creator);
    if (creator && creator.creatorStats) {
      creator.updateCreatorStats();
      await creator.save();
    }

    res.json({
      success: true,
      averageRating: artifact.averageRating,
      totalRatings: artifact.totalRatings,
      message: 'Rating submitted successfully!'
    });

  } catch (error) {
    console.error('Error rating artifact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate artifact',
      error: error.message
    });
  }
});

// Discovery Features - Get featured content
router.get('/featured', async (req, res) => {
  try {
    const { contentType, limit = 10, page = 1 } = req.query;
    
    const query = {
      visibility: 'public',
      $or: [
        { featured: true },
        { averageRating: { $gte: 4.0 }, totalRatings: { $gte: 5 } },
        { views: { $gte: 100 } }
      ]
    };

    if (contentType && contentType !== 'all') {
      query.contentType = contentType;
    }

    const artifacts = await Artifact.find(query)
      .populate('creator', 'username displayName avatar')
      .sort({ featuredAt: -1, averageRating: -1, views: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Artifact.countDocuments(query);

    res.json({
      success: true,
      artifacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching featured content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured content',
      error: error.message
    });
  }
});

// Discovery Features - Search and filter content
router.get('/search', async (req, res) => {
  try {
    const { 
      q = '', 
      contentType, 
      tags, 
      creator, 
      minRating, 
      sortBy = 'newest',
      limit = 20, 
      page = 1 
    } = req.query;

    const query = { visibility: 'public' };

    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Filters
    if (contentType && contentType !== 'all') {
      query.contentType = contentType;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    if (creator) {
      const creatorUser = await User.findOne({ username: creator });
      if (creatorUser) {
        query.creator = creatorUser._id;
      }
    }

    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    // Sorting
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'rating':
        sort = { averageRating: -1, totalRatings: -1 };
        break;
      case 'popular':
        sort = { views: -1, plays: -1 };
        break;
      case 'name':
        sort = { name: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const artifacts = await Artifact.find(query)
      .populate('creator', 'username displayName avatar')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Artifact.countDocuments(query);

    res.json({
      success: true,
      artifacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      query: {
        searchTerm: q,
        contentType,
        tags,
        creator,
        minRating,
        sortBy
      }
    });

  } catch (error) {
    console.error('Error searching artifacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search artifacts',
      error: error.message
    });
  }
});

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

export default router;
