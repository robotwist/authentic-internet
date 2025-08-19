import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Character from "../models/Character.js";
import User from "../models/User.js";
import { auth as authenticateToken } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validation.js";
import sharp from "sharp";
import Joi from "joi";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for character image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public/uploads/characters');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'character-' + uniqueSuffix + ext);
  }
});

// File filter for character images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPEG, JPG, and GIF files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Character validation schemas
const characterValidation = {
  create: {
    name: Joi.string().min(1).max(20).required(),
    description: Joi.string().max(200).optional(),
    tags: Joi.array().items(Joi.string().max(20)).max(10).optional(),
    isPublic: Joi.boolean().optional()
  },
  
  update: {
    name: Joi.string().min(1).max(20).optional(),
    description: Joi.string().max(200).optional(),
    tags: Joi.array().items(Joi.string().max(20)).max(10).optional(),
    isPublic: Joi.boolean().optional()
  }
};

// Add character validation to schemas
schemas.character = characterValidation;

/* ────────────────────────────────
   🔹 CREATE CHARACTER
──────────────────────────────── */
router.post("/create", authenticateToken, upload.single('characterImage'), validate(schemas.character.create), async (req, res) => {
  try {
    const { name, description, tags, isPublic, pixelData, canvasSize } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Character image is required" });
    }

    // Process and optimize the image
    const processedImagePath = await processCharacterImage(req.file.path, canvasSize || 32);

    // Create character
    const character = new Character({
      name,
      description: description || '',
      tags: tags ? JSON.parse(tags) : [],
      isPublic: isPublic === 'true',
      creator: req.user.userId,
      imageUrl: '/uploads/characters/' + path.basename(processedImagePath),
      pixelData: pixelData ? JSON.parse(pixelData) : {},
      canvasSize: canvasSize || 32
    });

    await character.save();

    // Populate creator info
    await character.populate('creator', 'username avatar');

    res.status(201).json({
      message: "Character created successfully",
      character
    });
  } catch (error) {
    console.error('Error creating character:', error);
    
    // Clean up uploaded file if character creation fails
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: "Failed to create character" });
  }
});

/* ────────────────────────────────
   🔹 IMPORT PISKEL CHARACTER
──────────────────────────────── */
router.post("/import-piskel", authenticateToken, upload.single('piskelFile'), async (req, res) => {
  try {
    const { characterName, description, tags, isPublic } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    let processedImagePath;
    let pixelData = {};

    // Handle different file types
    if (req.file.originalname.endsWith('.piskel')) {
      // Process Piskel file
      const piskelData = await processPiskelFile(req.file.path);
      processedImagePath = await processCharacterImage(piskelData.imagePath, 32);
      pixelData = piskelData.pixelData;
    } else {
      // Process regular image file
      processedImagePath = await processCharacterImage(req.file.path, 32);
      pixelData = await extractPixelData(processedImagePath, 32);
    }

    // Create character
    const character = new Character({
      name: characterName,
      description: description || '',
      tags: tags ? JSON.parse(tags) : [],
      isPublic: isPublic === 'true',
      creator: req.user.userId,
      imageUrl: '/uploads/characters/' + path.basename(processedImagePath),
      pixelData,
      canvasSize: 32
    });

    await character.save();
    await character.populate('creator', 'username avatar');

    res.status(201).json({
      message: "Character imported successfully",
      character
    });
  } catch (error) {
    console.error('Error importing character:', error);
    
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: "Failed to import character" });
  }
});

/* ────────────────────────────────
   🔹 GET USER'S CHARACTERS
──────────────────────────────── */
router.get("/my-characters", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const characters = await Character.getUserCharacters(req.user.userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const total = await Character.countDocuments({ 
      creator: req.user.userId, 
      isActive: true 
    });

    res.json({
      characters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user characters:', error);
    res.status(500).json({ error: "Failed to fetch characters" });
  }
});

/* ────────────────────────────────
   🔹 GET PUBLIC CHARACTERS
──────────────────────────────── */
router.get("/public", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sort = 'createdAt', 
      order = 'desc',
      tags,
      search = ''
    } = req.query;

    const tagArray = tags ? tags.split(',') : [];

    const characters = await Character.getPublicCharacters({
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order,
      tags: tagArray,
      search
    });

    const total = await Character.countDocuments({ 
      isPublic: true, 
      isActive: true 
    });

    res.json({
      characters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching public characters:', error);
    res.status(500).json({ error: "Failed to fetch characters" });
  }
});

/* ────────────────────────────────
   🔹 GET TRENDING CHARACTERS
──────────────────────────────── */
router.get("/trending", async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const characters = await Character.getTrendingCharacters(parseInt(limit));
    
    res.json({ characters });
  } catch (error) {
    console.error('Error fetching trending characters:', error);
    res.status(500).json({ error: "Failed to fetch trending characters" });
  }
});

/* ────────────────────────────────
   🔹 GET CHARACTER BY ID
──────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const character = await Character.findById(req.params.id)
      .populate('creator', 'username avatar level')
      .populate('likes', 'username avatar');

    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    // Increment views
    await character.incrementViews();

    res.json(character);
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ error: "Failed to fetch character" });
  }
});

/* ────────────────────────────────
   🔹 UPDATE CHARACTER
──────────────────────────────── */
router.put("/:id", authenticateToken, validate(schemas.character.update), async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);

    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    if (character.creator.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized to update this character" });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key === 'tags') {
        character[key] = JSON.parse(req.body[key]);
      } else {
        character[key] = req.body[key];
      }
    });

    await character.save();
    await character.populate('creator', 'username avatar');

    res.json({
      message: "Character updated successfully",
      character
    });
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: "Failed to update character" });
  }
});

/* ────────────────────────────────
   🔹 DELETE CHARACTER
──────────────────────────────── */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);

    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    if (character.creator.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized to delete this character" });
    }

    // Soft delete
    character.isActive = false;
    await character.save();

    res.json({ message: "Character deleted successfully" });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ error: "Failed to delete character" });
  }
});

/* ────────────────────────────────
   🔹 TOGGLE CHARACTER LIKE
──────────────────────────────── */
router.post("/:id/like", authenticateToken, async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);

    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    await character.toggleLike(req.user.userId);
    await character.populate('likes', 'username avatar');

    res.json({
      message: "Like toggled successfully",
      character,
      hasLiked: character.hasLiked(req.user.userId)
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

/* ────────────────────────────────
   🔹 DOWNLOAD CHARACTER
──────────────────────────────── */
router.post("/:id/download", authenticateToken, async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);

    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    await character.incrementDownloads();

    res.json({
      message: "Download recorded successfully",
      downloadUrl: character.imageUrl
    });
  } catch (error) {
    console.error('Error recording download:', error);
    res.status(500).json({ error: "Failed to record download" });
  }
});

// Helper function to process character images
async function processCharacterImage(imagePath, size) {
  const outputPath = imagePath.replace(/\.[^/.]+$/, '_processed.png');
  
  await sharp(imagePath)
    .resize(size, size, {
      kernel: sharp.kernel.nearest,
      fit: 'fill'
    })
    .png()
    .toFile(outputPath);

  return outputPath;
}

// Helper function to process Piskel files
async function processPiskelFile(filePath) {
  // This is a simplified implementation
  // In a real implementation, you would parse the .piskel JSON structure
  const piskelData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Extract image data from Piskel format
  const layers = piskelData.piskel.layers;
  const frameData = layers[0].chunks[0].base64PNG;
  
  // Convert base64 to image file
  const imageBuffer = Buffer.from(frameData, 'base64');
  const imagePath = filePath.replace('.piskel', '.png');
  fs.writeFileSync(imagePath, imageBuffer);
  
  return {
    imagePath,
    pixelData: {} // Extract pixel data from Piskel format
  };
}

// Helper function to extract pixel data from image
async function extractPixelData(imagePath, size) {
  const image = sharp(imagePath);
  const { data } = await image.raw().toBuffer({ resolveWithObject: true });
  
  const pixelData = {};
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      
      if (a > 0) {
        const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        pixelData[`${x},${y}`] = color;
      }
    }
  }
  
  return pixelData;
}

export default router;
