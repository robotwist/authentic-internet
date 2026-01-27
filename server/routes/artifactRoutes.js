import express from "express";
import authenticateToken from "../middleware/authMiddleware.js";
import {
  validateUnifiedArtifact,
  validateArtifactUpdate,
  convertLegacyArtifact,
  ensureUnifiedResponse
} from "../middleware/artifactValidation.js";
import { requireCreationToken } from "../middleware/requireCreationToken.js";
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
  getCreationStatus,
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
  requireCreationToken,
  ensureUnifiedResponse,
  createArtifact
);

/* ────────────────────────────────
   🔹 FETCH ALL ARTIFACTS (UNIFIED)
──────────────────────────────── */
router.get("/", ensureUnifiedResponse, getArtifacts);

/* ────────────────────────────────
   🔹 CREATION STATUS (2nd-artifact token gating)
──────────────────────────────── */
router.get("/creation-status", authenticateToken, getCreationStatus);

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
router.post('/:id/collect', authenticateToken, addToCollection);


// Marketplace and Sharing
router.post('/:id/share', authenticateToken, validate(schemas.artifact.share), shareArtifact);
router.post('/:id/unshare', authenticateToken, unshareArtifact);
router.post('/:id/discover', authenticateToken, discoverArtifact);
router.post('/:id/marketplace', authenticateToken, validate(schemas.artifact.share), listInMarketplace);
router.delete('/:id/marketplace', authenticateToken, removeFromMarketplace);

export default router;
