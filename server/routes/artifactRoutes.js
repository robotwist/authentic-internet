import express from "express";
import { body, validationResult } from "express-validator";
import Artifact from "../models/Artifact.js";
import User from "../models/User.js";
import authenticateToken from "../middleware/authMiddleware.js";
import { apiLimiter } from "../utils/rateLimiting.js";
import { validateFileUpload } from "../middleware/fileValidation.js";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

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

// Validation middleware for artifact creation
const validateArtifactCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
    .withMessage('Name contains invalid characters')
    .escape(),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters')
    .escape(),
    
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Content must be between 1 and 2000 characters')
    .escape(),
    
  body('area')
    .trim()
    .isIn(['world', 'forest', 'mountains', 'village', 'dungeon', 'castle'])
    .withMessage('Invalid area specified'),
    
  body('riddle')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Riddle must not exceed 1000 characters')
    .escape(),
    
  body('unlockAnswer')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Unlock answer must not exceed 100 characters')
    .escape(),
    
  body('isExclusive')
    .optional()
    .isBoolean()
    .withMessage('isExclusive must be a boolean'),
    
  body('location.x')
    .isNumeric()
    .withMessage('Location X must be a number')
    .isFloat({ min: -1000, max: 1000 })
    .withMessage('Location X must be between -1000 and 1000'),
    
  body('location.y')
    .isNumeric()
    .withMessage('Location Y must be a number')
    .isFloat({ min: -1000, max: 1000 })
    .withMessage('Location Y must be between -1000 and 1000')
];

// Enhanced rate limiter for artifact creation
const artifactCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each user to 5 artifact creations per windowMs
  message: {
    error: 'RATE_LIMITED',
    message: 'Too many artifacts created. Please wait before creating more.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key generator to rate limit per user
  keyGenerator: (req) => req.user?.userId || req.ip,
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1'
});

/* ────────────────────────────────
   🔹 CREATE ARTIFACT (WITH MESSAGE)
──────────────────────────────── */
router.post("/", artifactCreationLimiter, authenticateToken, validateArtifactCreation, uploadFields, validateFileUpload, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid input data provided",
        details: errors.array()
      });
    }

    const { name, description, content, riddle, unlockAnswer, area, isExclusive, location } = req.body;

    // Additional business logic validation
    if (isExclusive && (!riddle || !unlockAnswer)) {
      return res.status(400).json({ 
        success: false,
        error: "BUSINESS_LOGIC_ERROR",
        message: "Exclusive artifacts must have both riddle and unlock answer" 
      });
    }

    const newArtifact = new Artifact({
      name,
      description,
      content,
      riddle,
      unlockAnswer,
      area,
      isExclusive: isExclusive === true || isExclusive === 'true',
      location: {
        x: parseFloat(location.x),
        y: parseFloat(location.y)
      },
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
    
    // Success response with consistent format
    res.status(201).json({ 
      success: true,
      message: "Artifact created successfully!", 
      data: {
        artifact: {
          id: newArtifact._id,
          name: newArtifact.name,
          description: newArtifact.description,
          area: newArtifact.area,
          location: newArtifact.location,
          isExclusive: newArtifact.isExclusive,
          createdAt: newArtifact.createdAt
        }
      }
    });
  } catch (error) {
    console.error("Error creating artifact:", error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: "DATABASE_VALIDATION_ERROR",
        message: "Artifact data validation failed",
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) { // MongoDB duplicate key error
      return res.status(409).json({ 
        success: false,
        error: "DUPLICATE_ERROR",
        message: "An artifact with similar properties already exists"
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to create artifact due to server error",
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

/* ────────────────────────────────
   🔹 FETCH ALL ARTIFACTS
──────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const artifacts = await Artifact.find({ type: "artifact" }).populate("creator");
    res.json(artifacts);
  } catch (error) {
    console.error("Error fetching artifacts:", error);
    res.status(500).json({ error: "Failed to fetch artifacts." });
  }
});

/* ────────────────────────────────
   🔹 FETCH A SINGLE ARTIFACT BY ID
──────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id).populate("creator");
    if (!artifact || artifact.type !== "artifact") {
      return res.status(404).json({ error: "Artifact not found." });
    }
    res.json(artifact);
  } catch (error) {
    console.error("Error fetching artifact:", error);
    res.status(500).json({ error: "Failed to fetch artifact." });
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

export default router;
